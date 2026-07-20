import type { FontInfo, GlyphFont } from '@kartore/glyphore';
import { describe, expect, it, vi } from 'vitest';

import type { Glyphore } from '$lib/fonts/glyphore.ts';

import type { FontsStoreAdapter, StoredFont } from './FontsStoreAdapter.ts';
import { FontsStore } from './fontsStore.svelte.ts';

const fontInfo: FontInfo = {
	familyName: 'Noto Sans JP',
	styleName: 'Regular',
	fontstackName: 'Noto Sans JP Regular',
	coveredRanges: [0, 256],
	glyphCount: 321
};

const createGlyphore = () => {
	const disposeFont = vi.fn();
	const loadFont = vi.fn(async () => ({
		info: fontInfo,
		[Symbol.dispose]: disposeFont
	}));
	return {
		glyphore: {
			loadFont,
			generateRange: vi.fn(() => Uint8Array.from([1, 2, 3]))
		} as unknown as Glyphore,
		loadFont,
		disposeFont
	};
};

const createAdapter = (
	initial: Record<string, Omit<StoredFont, 'bytes'>> = {},
	stored: Record<string, StoredFont> = {}
) => {
	const records = new Map(Object.entries(stored));
	const save = vi.fn<FontsStoreAdapter['save']>(async (name, font) => {
		records.set(name, font);
	});
	const remove = vi.fn<FontsStoreAdapter['remove']>(async (name) => {
		records.delete(name);
	});
	return {
		adapter: {
			id: 'test',
			load: async () => initial,
			get: async (name) => records.get(name) ?? null,
			save,
			remove
		} satisfies FontsStoreAdapter,
		records,
		save,
		remove
	};
};

describe('FontsStore', () => {
	it('loads metadata without loading or parsing glyphore', async () => {
		const { adapter } = createAdapter({
			'Noto Sans JP Regular': {
				familyName: 'Noto Sans JP',
				styleName: 'Regular',
				addedAt: 1234
			}
		});
		const loadGlyphore = vi.fn(async () => createGlyphore().glyphore);
		const store = new FontsStore({ adapter, loadGlyphore });

		await vi.waitFor(() => expect(store.isLoading).toBe(false));
		expect(store.fonts).toEqual({
			'Noto Sans JP Regular': {
				familyName: 'Noto Sans JP',
				styleName: 'Regular',
				addedAt: 1234
			}
		});
		expect(loadGlyphore).not.toHaveBeenCalled();
	});

	it('loads a saved font only on first use and caches its resource', async () => {
		const storedFont: StoredFont = {
			bytes: Uint8Array.from([1, 2, 3]).buffer,
			familyName: fontInfo.familyName,
			styleName: fontInfo.styleName,
			addedAt: 1234
		};
		const { adapter } = createAdapter(
			{ 'Noto Sans JP Regular': storedFont },
			{ 'Noto Sans JP Regular': storedFont }
		);
		const { glyphore, loadFont } = createGlyphore();
		const loadGlyphore = vi.fn(async () => glyphore);
		const store = new FontsStore({ adapter, loadGlyphore });
		await vi.waitFor(() => expect(store.isLoading).toBe(false));

		const first = await store.getLoadedFont('Noto Sans JP Regular');
		const second = await store.getLoadedFont('Noto Sans JP Regular');
		expect(first).toBe(second);
		expect(first?.info).toEqual(fontInfo);
		expect(loadGlyphore).toHaveBeenCalledTimes(1);
		expect(loadFont).toHaveBeenCalledTimes(1);
	});

	it('loads and saves an added font, then disposes it on delete', async () => {
		const { adapter, save, remove } = createAdapter();
		const { glyphore, disposeFont } = createGlyphore();
		const store = new FontsStore({
			adapter,
			loadGlyphore: async () => glyphore,
			now: () => 4567
		});
		await vi.waitFor(() => expect(store.isLoading).toBe(false));

		await expect(store.addFont(Uint8Array.from([4, 5, 6]))).resolves.toEqual(fontInfo);
		expect(save).toHaveBeenCalledWith('Noto Sans JP Regular', {
			bytes: Uint8Array.from([4, 5, 6]).buffer,
			familyName: 'Noto Sans JP',
			styleName: 'Regular',
			addedAt: 4567
		});
		expect(store.fonts['Noto Sans JP Regular']).toEqual({
			familyName: 'Noto Sans JP',
			styleName: 'Regular',
			addedAt: 4567
		});

		await store.removeFont('Noto Sans JP Regular');
		expect(remove).toHaveBeenCalledWith('Noto Sans JP Regular');
		expect(store.fonts).toEqual({});
		expect(disposeFont).toHaveBeenCalledOnce();
	});

	it('disposes a newly loaded font when persistence fails', async () => {
		const { adapter } = createAdapter();
		adapter.save = vi.fn(async () => {
			throw new Error('quota exceeded');
		});
		const { glyphore, disposeFont } = createGlyphore();
		const store = new FontsStore({ adapter, loadGlyphore: async () => glyphore });
		await vi.waitFor(() => expect(store.isLoading).toBe(false));

		await expect(store.addFont(Uint8Array.from([1]))).rejects.toThrow('quota exceeded');
		expect(store.fonts).toEqual({});
		expect(disposeFont).toHaveBeenCalledOnce();
	});

	it('disposes cached fonts when destroyed', async () => {
		const { adapter } = createAdapter();
		const { glyphore, disposeFont } = createGlyphore();
		const store = new FontsStore({ adapter, loadGlyphore: async () => glyphore });
		await vi.waitFor(() => expect(store.isLoading).toBe(false));
		await store.addFont(Uint8Array.from([1]));

		store.destroy();
		store.destroy();

		expect(disposeFont).toHaveBeenCalledOnce();
	});

	it('disposes a font that finishes loading after destruction without saving it', async () => {
		const { adapter, save } = createAdapter();
		const disposeFont = vi.fn();
		const deferred = Promise.withResolvers<GlyphFont>();
		const loadFont = vi.fn(() => deferred.promise);
		const glyphore = {
			loadFont,
			generateRange: vi.fn(() => Uint8Array.from([1, 2, 3]))
		} as unknown as Glyphore;
		const store = new FontsStore({ adapter, loadGlyphore: async () => glyphore });
		await vi.waitFor(() => expect(store.isLoading).toBe(false));

		const adding = store.addFont(Uint8Array.from([1]));
		await vi.waitFor(() => expect(loadFont).toHaveBeenCalledOnce());
		store.destroy();
		deferred.resolve({ info: fontInfo, [Symbol.dispose]: disposeFont });

		await expect(adding).rejects.toThrow('The font store has been destroyed.');
		expect(save).not.toHaveBeenCalled();
		expect(disposeFont).toHaveBeenCalledOnce();
	});
});
