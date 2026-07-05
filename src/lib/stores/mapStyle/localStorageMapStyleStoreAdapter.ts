import type { StyleSpecification } from 'maplibre-gl';

import type { MapStyleStoreAdapter } from './MapStyleStoreAdapter.ts';

const STORAGE_KEY = 'kartore:style';

const isRecord = (value: unknown): value is Record<PropertyKey, unknown> => {
	return typeof value === 'object' && value != null;
};

const isStyleSpecification = (value: unknown): value is StyleSpecification => {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.version === 'number' && isRecord(value.sources) && Array.isArray(value.layers)
	);
};

export const localStorageMapStyleStoreAdapter: MapStyleStoreAdapter = {
	id: 'local-storage',
	load: async () => {
		const storedValue = localStorage.getItem(STORAGE_KEY);

		if (storedValue == null) {
			return null;
		}

		try {
			const parsedValue: unknown = JSON.parse(storedValue);

			if (!isStyleSpecification(parsedValue)) {
				return null;
			}

			return parsedValue;
		} catch {
			return null;
		}
	},
	save: async (style) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(style));
	}
};
