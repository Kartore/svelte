import type { SpriteIcons, SpriteIconsStoreAdapter } from './SpriteIconsStoreAdapter.ts';

const STORAGE_KEY = 'kartore:sprite-svgs';

const isSpriteIcons = (value: unknown): value is SpriteIcons => {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
	return Object.values(value).every((svg) => typeof svg === 'string');
};

export const localStorageSpriteIconsStoreAdapter: SpriteIconsStoreAdapter = {
	id: 'local-storage',
	load: async () => {
		const storedValue = localStorage.getItem(STORAGE_KEY);
		if (storedValue === null) return null;

		try {
			const parsedValue: unknown = JSON.parse(storedValue);
			return isSpriteIcons(parsedValue) ? parsedValue : null;
		} catch {
			return null;
		}
	},
	save: async (icons) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
	}
};
