import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLayerGroup, groupLayersByIdPrefix } from '$lib/utils/layerGroup.ts';

import { MapStyleStore } from './mapStyleStore.svelte.ts';

const layer = (id: string): LayerSpecification => ({ id, type: 'background' });
const initialStyle: StyleSpecification = {
	version: 8,
	sources: {},
	layers: [layer('road-primary'), layer('road-secondary'), layer('labels')]
};

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe('MapStyleStore layer grouping history', () => {
	it('restores prefix grouping with undo when applied through setMapStyle', async () => {
		vi.useFakeTimers();
		vi.spyOn(performance, 'now').mockReturnValue(1_000);
		const store = new MapStyleStore({
			initialStyle,
			adapter: {
				id: 'test',
				load: async () => null,
				save: async () => undefined
			}
		});
		await Promise.resolve();

		const grouping = groupLayersByIdPrefix(store.mapStyle.layers);
		store.setMapStyle((currentStyle) => ({ ...currentStyle, layers: grouping.layers }));

		expect(grouping.groupCount).toBe(1);
		expect(getLayerGroup(store.mapStyle.layers[0])).toBe('road');
		expect(store.canUndo).toBe(true);

		store.undo();

		expect(store.mapStyle.layers.map(getLayerGroup)).toEqual([undefined, undefined, undefined]);
		await vi.runOnlyPendingTimersAsync();
	});
});
