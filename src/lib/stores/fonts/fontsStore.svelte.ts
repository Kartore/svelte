import type { FontInfo, GlyphFont } from '@kartore/glyphore';

import { loadGlyphore, type Glyphore } from '$lib/fonts/glyphore.ts';

import type { FontMeta, Fonts, FontsStoreAdapter, StoredFont } from './FontsStoreAdapter.ts';

/* eslint-disable svelte/prefer-svelte-reactivity -- WASM resource caches do not participate in rendering. */

export type LoadedFont = GlyphFont;

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
	#loadedFonts = new globalThis.Map<string, GlyphFont>();
	#loadPromises = new globalThis.Map<string, Promise<LoadedFont | null>>();
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
		if (this.#destroyed) throw new Error('The font store has been destroyed.');
		const storedBytes = ownedArrayBuffer(bytes);
		const { loadFont } = await this.#loadGlyphore();
		if (this.#destroyed) throw new Error('The font store has been destroyed.');
		const font = await loadFont(new Uint8Array(storedBytes));
		if (this.#destroyed) {
			font[Symbol.dispose]();
			throw new Error('The font store has been destroyed.');
		}
		const name = font.info.fontstackName;
		const storedFont: StoredFont = {
			bytes: storedBytes,
			familyName: font.info.familyName,
			styleName: font.info.styleName,
			addedAt: this.#now()
		};

		try {
			await this.#adapter.save(name, storedFont);
		} catch (error) {
			font[Symbol.dispose]();
			throw error;
		}

		if (this.#destroyed) {
			font[Symbol.dispose]();
			throw new Error('The font store has been destroyed.');
		}

		this.#advanceVersion(name);
		this.#releaseFont(name);
		this.#loadedFonts.set(name, font);
		this.fonts = { ...this.fonts, [name]: fontMeta(storedFont) };
		return font.info;
	};

	removeFont = async (name: string): Promise<void> => {
		if (!(name in this.fonts)) return;
		await this.#adapter.remove(name);
		if (!(name in this.fonts)) return;

		const fonts = { ...this.fonts };
		delete fonts[name];
		this.fonts = fonts;
		this.#advanceVersion(name);
		this.#releaseFont(name);
	};

	getLoadedFont = async (name: string): Promise<LoadedFont | null> => {
		if (this.#destroyed || !(name in this.fonts)) return null;
		const font = this.#loadedFonts.get(name);
		if (font !== undefined) return font;

		const pending = this.#loadPromises.get(name);
		if (pending) return pending;

		const version = this.#version(name);
		const promise = this.#loadStoredFont(name, version);
		this.#loadPromises.set(name, promise);
		try {
			return await promise;
		} finally {
			if (this.#loadPromises.get(name) === promise) this.#loadPromises.delete(name);
		}
	};

	destroy = () => {
		if (this.#destroyed) return;
		this.#destroyed = true;
		for (const name of new globalThis.Set([
			...this.#loadedFonts.keys(),
			...this.#loadPromises.keys()
		])) {
			this.#advanceVersion(name);
		}
		for (const name of [...this.#loadedFonts.keys()]) this.#releaseFont(name);
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

	async #loadStoredFont(name: string, version: number): Promise<LoadedFont | null> {
		const storedFont = await this.#adapter.get(name);
		if (!storedFont) throw new Error(`Stored font “${name}” could not be read.`);
		if (this.#destroyed || this.#version(name) !== version || !(name in this.fonts)) return null;
		const { loadFont } = await this.#loadGlyphore();
		if (this.#destroyed || this.#version(name) !== version || !(name in this.fonts)) return null;
		const font = await loadFont(new Uint8Array(storedFont.bytes));

		if (this.#destroyed || this.#version(name) !== version || !(name in this.fonts)) {
			font[Symbol.dispose]();
			return null;
		}

		const existingFont = this.#loadedFonts.get(name);
		if (existingFont !== undefined && existingFont !== font) {
			existingFont[Symbol.dispose]();
		}
		this.#loadedFonts.set(name, font);
		return font;
	}

	#releaseFont(name: string) {
		const font = this.#loadedFonts.get(name);
		if (font === undefined) return;
		font[Symbol.dispose]();
		this.#loadedFonts.delete(name);
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
