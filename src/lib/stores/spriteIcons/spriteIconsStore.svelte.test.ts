import { describe, expect, it, vi } from 'vitest';

import type { SpriteIconsStoreAdapter } from './SpriteIconsStoreAdapter.ts';
import { SpriteIconsStore } from './spriteIconsStore.svelte.ts';

const createAdapter = (initial: Record<string, string> | null = null) => {
	const save = vi.fn<SpriteIconsStoreAdapter['save']>(async () => undefined);
	return {
		adapter: {
			id: 'test',
			load: async () => initial,
			save
		} satisfies SpriteIconsStoreAdapter,
		save
	};
};

describe('SpriteIconsStore', () => {
	it('loads saved icons', async () => {
		const { adapter } = createAdapter({ marker: '<svg />' });
		const store = new SpriteIconsStore({ adapter });

		expect(store.isLoading).toBe(true);
		await vi.waitFor(() => expect(store.isLoading).toBe(false));
		expect(store.icons).toEqual({ marker: '<svg />' });
	});

	it('saves immediately when icons are added and removed', async () => {
		const { adapter, save } = createAdapter();
		const store = new SpriteIconsStore({ adapter });
		await vi.waitFor(() => expect(store.isLoading).toBe(false));

		store.setIcon('marker', '<svg width="12" height="12" />');
		expect(store.icons).toEqual({ marker: '<svg width="12" height="12" />' });
		expect(save).toHaveBeenLastCalledWith({ marker: '<svg width="12" height="12" />' });

		store.removeIcon('marker');
		expect(store.icons).toEqual({});
		expect(save).toHaveBeenLastCalledWith({});
	});

	it('replaces and persists the complete icon collection', async () => {
		const { adapter, save } = createAdapter({ old: '<svg id="old" />' });
		const store = new SpriteIconsStore({ adapter });
		await vi.waitFor(() => expect(store.isLoading).toBe(false));

		await store.replaceIcons({ marker: '<svg id="marker" />' });

		expect(save).toHaveBeenCalledWith({ marker: '<svg id="marker" />' });
		expect(store.icons).toEqual({ marker: '<svg id="marker" />' });
	});

	it('keeps the current collection when replacement persistence fails', async () => {
		const { adapter } = createAdapter({ old: '<svg id="old" />' });
		adapter.save = vi.fn(async () => {
			throw new Error('quota exceeded');
		});
		const store = new SpriteIconsStore({ adapter });
		await vi.waitFor(() => expect(store.isLoading).toBe(false));

		await expect(store.replaceIcons({ marker: '<svg />' })).rejects.toThrow('quota exceeded');

		expect(store.icons).toEqual({ old: '<svg id="old" />' });
		expect(store.saveError?.message).toBe('quota exceeded');
	});
});
