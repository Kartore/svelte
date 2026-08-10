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

describe('MapStyleStore initial loading', () => {
	it('exposes whether an initial project is needed', async () => {
		const initialStore = new MapStyleStore({
			initialStyle,
			adapter: { id: 'empty', load: async () => null, save: async () => undefined }
		});
		await initialStore.ready;
		expect(initialStore.needsInitialProject).toBe(true);

		const storedStyle = { ...initialStyle, name: 'Stored style' };
		const storedStore = new MapStyleStore({
			initialStyle,
			adapter: { id: 'stored', load: async () => storedStyle, save: async () => undefined }
		});
		await storedStore.ready;
		expect(storedStore.needsInitialProject).toBe(false);
		expect(storedStore.mapStyle.name).toBe('Stored style');
	});
});

describe('MapStyleStore project replacement', () => {
	it('drops history when an external project replaces the style', async () => {
		vi.useFakeTimers();
		vi.spyOn(performance, 'now').mockReturnValue(1_000);
		const save = vi.fn(async () => undefined);
		const store = new MapStyleStore({
			initialStyle,
			adapter: { id: 'test', load: async () => null, save }
		});
		await store.ready;
		store.setMapStyle({ ...initialStyle, name: 'Edited' });
		expect(store.canUndo).toBe(true);

		store.replaceMapStyle({ ...initialStyle, name: 'Opened project' });

		expect(store.mapStyle.name).toBe('Opened project');
		expect(store.needsInitialProject).toBe(false);
		expect(store.canUndo).toBe(false);
		expect(store.canRedo).toBe(false);
		await vi.runOnlyPendingTimersAsync();
		expect(save).toHaveBeenLastCalledWith({ ...initialStyle, name: 'Opened project' });
	});
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
