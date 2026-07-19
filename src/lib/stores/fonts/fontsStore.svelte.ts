import type { FontInfo } from '@kartore/glyphore';

import { loadGlyphore, type Glyphore } from '$lib/fonts/glyphore.ts';

import type { FontMeta, Fonts, FontsStoreAdapter, StoredFont } from './FontsStoreAdapter.ts';

/* eslint-disable svelte/prefer-svelte-reactivity -- WASM handle caches do not participate in rendering. */

export type ParsedFont = {
	handle: number;
	info: FontInfo;
};

export type FontsStoreOptions = {
	adapter: FontsStoreAdapter;
	loadGlyphore?: () => Promise<Glyphore>;
	now?: () => number;
};

const ownedArrayBuffer = (bytes: ArrayBuffer | Uint8Array): ArrayBuffer => {
	const source = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	return Uint8Array.from(source).buffer;
};

export class FontsStore {
	#adapter: FontsStoreAdapter;
	#loadGlyphore: () => Promise<Glyphore>;
	#now: () => number;
	#glyphore: Glyphore | undefined;
	#handles = new globalThis.Map<string, number>();
	#fontInfos = new globalThis.Map<string, FontInfo>();
	#parsePromises = new globalThis.Map<string, Promise<ParsedFont | null>>();
	#versions = new globalThis.Map<string, number>();
	#destroyed = false;

	fonts = $state<Fonts>({});
	isLoading = $state(true);
	loadError = $state<Error | null>(null);

	constructor({
		adapter,
		loadGlyphore: glyphoreLoader = loadGlyphore,
		now = Date.now
	}: FontsStoreOptions) {
		this.#adapter = adapter;
		this.#loadGlyphore = glyphoreLoader;
		this.#now = now;
		void this.#load();
	}

	addFont = async (bytes: ArrayBuffer | Uint8Array): Promise<FontInfo> => {
		const storedBytes = ownedArrayBuffer(bytes);
		const glyphore = await this.#getGlyphore();
		const parsed = glyphore.parseFont(new Uint8Array(storedBytes));
		const name = parsed.info.fontstackName;
		const storedFont: StoredFont = {
			bytes: storedBytes,
			familyName: parsed.info.familyName,
			styleName: parsed.info.styleName,
			addedAt: this.#now()
		};

		try {
			await this.#adapter.save(name, storedFont);
		} catch (error) {
			glyphore.freeFont(parsed.handle);
			throw error;
		}

		if (this.#destroyed) {
			glyphore.freeFont(parsed.handle);
			throw new Error('The font store has been destroyed.');
		}

		this.#advanceVersion(name);
		this.#releaseHandle(name);
		this.#handles.set(name, parsed.handle);
		this.#fontInfos.set(name, parsed.info);
		this.fonts = { ...this.fonts, [name]: fontMeta(storedFont) };
		return parsed.info;
	};

	removeFont = async (name: string): Promise<void> => {
		if (!(name in this.fonts)) return;
		await this.#adapter.remove(name);
		if (!(name in this.fonts)) return;

		const fonts = { ...this.fonts };
		delete fonts[name];
		this.fonts = fonts;
		this.#advanceVersion(name);
		this.#releaseHandle(name);
		this.#fontInfos.delete(name);
	};

	getParsedFont = async (name: string): Promise<ParsedFont | null> => {
		if (this.#destroyed || !(name in this.fonts)) return null;
		const handle = this.#handles.get(name);
		const info = this.#fontInfos.get(name);
		if (handle !== undefined && info !== undefined) return { handle, info };

		const pending = this.#parsePromises.get(name);
		if (pending) return pending;

		const version = this.#version(name);
		const promise = this.#parseStoredFont(name, version);
		this.#parsePromises.set(name, promise);
		try {
			return await promise;
		} finally {
			if (this.#parsePromises.get(name) === promise) this.#parsePromises.delete(name);
		}
	};

	destroy = () => {
		if (this.#destroyed) return;
		this.#destroyed = true;
		for (const name of new globalThis.Set([
			...this.#handles.keys(),
			...this.#parsePromises.keys()
		])) {
			this.#advanceVersion(name);
		}
		for (const name of [...this.#handles.keys()]) this.#releaseHandle(name);
		this.#fontInfos.clear();
	};

	async #load() {
		try {
			const fonts = (await this.#adapter.load()) ?? {};
			if (!this.#destroyed) this.fonts = fonts;
		} catch (error) {
			if (!this.#destroyed) {
				this.loadError = error instanceof Error ? error : new Error(String(error));
			}
		} finally {
			if (!this.#destroyed) this.isLoading = false;
		}
	}

	async #parseStoredFont(name: string, version: number): Promise<ParsedFont | null> {
		const storedFont = await this.#adapter.get(name);
		if (!storedFont) throw new Error(`Stored font “${name}” could not be read.`);
		const glyphore = await this.#getGlyphore();
		const parsed = glyphore.parseFont(new Uint8Array(storedFont.bytes));

		if (this.#destroyed || this.#version(name) !== version || !(name in this.fonts)) {
			glyphore.freeFont(parsed.handle);
			return null;
		}

		const existingHandle = this.#handles.get(name);
		if (existingHandle !== undefined && existingHandle !== parsed.handle) {
			glyphore.freeFont(existingHandle);
		}
		this.#handles.set(name, parsed.handle);
		this.#fontInfos.set(name, parsed.info);
		return parsed;
	}

	async #getGlyphore(): Promise<Glyphore> {
		const glyphore = await this.#loadGlyphore();
		this.#glyphore = glyphore;
		return glyphore;
	}

	#releaseHandle(name: string) {
		const handle = this.#handles.get(name);
		if (handle === undefined) return;
		this.#glyphore?.freeFont(handle);
		this.#handles.delete(name);
	}

	#version(name: string): number {
		return this.#versions.get(name) ?? 0;
	}

	#advanceVersion(name: string) {
		this.#versions.set(name, this.#version(name) + 1);
	}
}

const fontMeta = ({ familyName, styleName, addedAt }: StoredFont): FontMeta => ({
	familyName,
	styleName,
	addedAt
});
