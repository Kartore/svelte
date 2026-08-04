import type { StyleSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import { osmLibertyMigrated } from '#lib/samples/osm-liberty.ts';

import {
	applyFilterHighlight,
	FILTER_HIGHLIGHT_LAYER_ID,
	type FilterHighlightRequest
} from './filterHighlight.ts';

const request: FilterHighlightRequest = { layerId: 'place_city', accent: '#168ada' };

describe('applyFilterHighlight', () => {
	it('keeps the current filter and makes a symbol clone independent from collision placement', () => {
		const original = structuredClone(osmLibertyMigrated) as StyleSpecification;
		const originalLayer = original.layers.find(
			({ id }) => id === request.layerId
		) as SymbolLayerSpecification;
		const highlighted = applyFilterHighlight(original, request);
		const layer = highlighted.layers.at(-1) as SymbolLayerSpecification;

		expect(layer.id).toBe(FILTER_HIGHLIGHT_LAYER_ID);
		expect(layer.filter).toEqual(originalLayer?.filter);
		expect(layer.layout).toMatchObject({
			'text-allow-overlap': true,
			'text-ignore-placement': true,
			'icon-allow-overlap': true,
			'icon-ignore-placement': true
		});
		expect(layer.paint).toMatchObject({
			'text-color': request.accent,
			'icon-color': request.accent
		});
		expect(original.layers).toHaveLength(highlighted.layers.length - 1);
		expect(original.layers.find(({ id }) => id === FILTER_HIGHLIGHT_LAYER_ID)).toBeUndefined();
	});

	it('uses the latest filter whenever the display style changes', () => {
		const first = structuredClone(osmLibertyMigrated) as StyleSpecification;
		const firstHighlighted = applyFilterHighlight(first, request);
		const nextFilter = ['==', ['get', 'class'], 'town'] as never;
		const next = {
			...first,
			layers: first.layers.map((layer) =>
				layer.id === request.layerId ? { ...layer, filter: nextFilter } : layer
			)
		};
		const nextHighlighted = applyFilterHighlight(next, request);

		expect((firstHighlighted.layers.at(-1) as SymbolLayerSpecification).filter).not.toEqual(
			nextFilter
		);
		expect((nextHighlighted.layers.at(-1) as SymbolLayerSpecification).filter).toEqual(nextFilter);
	});

	it('returns the same style when no supported layer is requested', () => {
		expect(applyFilterHighlight(osmLibertyMigrated, null)).toBe(osmLibertyMigrated);
		expect(
			applyFilterHighlight(osmLibertyMigrated, { layerId: 'missing', accent: '#168ada' })
		).toBe(osmLibertyMigrated);
		expect(
			applyFilterHighlight(osmLibertyMigrated, { layerId: 'background', accent: '#168ada' })
		).toBe(osmLibertyMigrated);
	});
});
