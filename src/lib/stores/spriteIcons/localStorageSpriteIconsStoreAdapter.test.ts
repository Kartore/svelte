import { afterEach, describe, expect, it, vi } from 'vitest';

import { localStorageSpriteIconsStoreAdapter } from './localStorageSpriteIconsStoreAdapter.ts';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('localStorageSpriteIconsStoreAdapter', () => {
	it('uses the sprite SVG storage key for load and save', async () => {
		const getItem = vi.fn(() => JSON.stringify({ marker: '<svg />' }));
		const setItem = vi.fn();
		vi.stubGlobal('localStorage', { getItem, setItem });

		await expect(localStorageSpriteIconsStoreAdapter.load()).resolves.toEqual({
			marker: '<svg />'
		});
		expect(getItem).toHaveBeenCalledWith('kartore:sprite-svgs');

		await localStorageSpriteIconsStoreAdapter.save({ marker: '<svg />' });
		expect(setItem).toHaveBeenCalledWith(
			'kartore:sprite-svgs',
			JSON.stringify({ marker: '<svg />' })
		);
	});

	it('ignores malformed or non-string records', async () => {
		const getItem = vi
			.fn()
			.mockReturnValueOnce('{')
			.mockReturnValueOnce(JSON.stringify({ marker: 42 }));
		vi.stubGlobal('localStorage', { getItem, setItem: vi.fn() });

		await expect(localStorageSpriteIconsStoreAdapter.load()).resolves.toBeNull();
		await expect(localStorageSpriteIconsStoreAdapter.load()).resolves.toBeNull();
	});
});
