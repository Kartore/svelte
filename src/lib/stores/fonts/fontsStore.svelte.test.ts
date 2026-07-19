import type { FontInfo } from '@kartore/glyphore';
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
	let nextHandle = 1;
	const parseFont = vi.fn(() => ({ handle: nextHandle++, info: fontInfo }));
	const freeFont = vi.fn();
	return {
		glyphore: {
			init: vi.fn(async () => undefined),
			parseFont,
			generateRange: vi.fn(() => Uint8Array.from([1, 2, 3])),
			freeFont
		} as unknown as Glyphore,
		parseFont,
		freeFont
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

	it('parses a saved font only on first use and caches its handle', async () => {
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
		const { glyphore, parseFont } = createGlyphore();
		const loadGlyphore = vi.fn(async () => glyphore);
		const store = new FontsStore({ adapter, loadGlyphore });
		await vi.waitFor(() => expect(store.isLoading).toBe(false));

		const first = await store.getParsedFont('Noto Sans JP Regular');
		const second = await store.getParsedFont('Noto Sans JP Regular');
		expect(first).toEqual(second);
		expect(first?.info).toEqual(fontInfo);
		expect(loadGlyphore).toHaveBeenCalledTimes(1);
		expect(parseFont).toHaveBeenCalledTimes(1);
	});

	it('parses and saves an added font, then frees its handle on delete', async () => {
		const { adapter, save, remove } = createAdapter();
		const { glyphore, freeFont } = createGlyphore();
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
		expect(freeFont).toHaveBeenCalledWith(1);
	});

	it('frees a newly parsed handle when persistence fails', async () => {
		const { adapter } = createAdapter();
		adapter.save = vi.fn(async () => {
			throw new Error('quota exceeded');
		});
		const { glyphore, freeFont } = createGlyphore();
		const store = new FontsStore({ adapter, loadGlyphore: async () => glyphore });
		await vi.waitFor(() => expect(store.isLoading).toBe(false));

		await expect(store.addFont(Uint8Array.from([1]))).rejects.toThrow('quota exceeded');
		expect(store.fonts).toEqual({});
		expect(freeFont).toHaveBeenCalledWith(1);
	});
});
