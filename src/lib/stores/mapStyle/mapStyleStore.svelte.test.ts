import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLayerGroup, groupLayersByIdPrefix } from '#lib/utils/layerGroup.ts';

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

describe('MapStyleStore transient updates', () => {
	it('records a scrub sequence as exactly one undo entry', async () => {
		vi.useFakeTimers();
		vi.spyOn(performance, 'now').mockReturnValue(2_000);
		const save = vi.fn(async () => undefined);
		const store = new MapStyleStore({
			initialStyle,
			adapter: { id: 'test', load: async () => null, save }
		});
		await Promise.resolve();

		for (const zoom of [2, 3, 4]) {
			store.setStyleTransient((style) => ({ ...style, zoom }));
		}

		expect(store.mapStyle.zoom).toBe(4);
		expect(store.canUndo).toBe(false);
		expect(save).not.toHaveBeenCalled();

		store.commitStyle();
		expect(store.canUndo).toBe(true);
		await vi.runOnlyPendingTimersAsync();
		expect(save).toHaveBeenCalledTimes(1);

		store.undo();
		expect(store.mapStyle.zoom).toBeUndefined();
		expect(store.canUndo).toBe(false);
		await vi.runOnlyPendingTimersAsync();
	});

	it('cancels a transient sequence without history or save', async () => {
		vi.useFakeTimers();
		const save = vi.fn(async () => undefined);
		const store = new MapStyleStore({
			initialStyle,
			adapter: { id: 'test', load: async () => null, save }
		});
		await Promise.resolve();

		store.setStyleTransient((style) => ({ ...style, zoom: 8 }));
		store.cancelStyleTransient();

		expect(store.mapStyle.zoom).toBeUndefined();
		expect(store.canUndo).toBe(false);
		await vi.runOnlyPendingTimersAsync();
		expect(save).not.toHaveBeenCalled();
	});
});
