import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import {
	collectInspectSourceLayers,
	createFeatureHighlightFilter,
	createInspectDataStyle,
	dedupeInspectedFeatures,
	inspectColorForName,
	inspectFeatureContextLabel,
	inspectFeatureDisplayLabel,
	inspectFeatureHighlightKey,
	inspectQueryBox,
	longitudeLatitudeToTile,
	resolveTileUrl,
	type InspectedFeature
} from './inspectUtils.ts';

const baseStyle = {
	version: 8,
	name: 'inspect fixture',
	sources: {
		vector: { type: 'vector', tiles: ['https://example.com/{z}/{x}/{y}.pbf'] },
		geojson: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
		raster: { type: 'raster', tiles: ['https://example.com/{z}/{x}/{y}.png'] }
	},
	layers: [
		{
			id: 'used',
			type: 'line',
			source: 'vector',
			'source-layer': 'roads'
		}
	]
} as StyleSpecification;

describe('inspect tile utilities', () => {
	it('builds a five-pixel click query buffer around the pointer', () => {
		expect(inspectQueryBox({ x: 120, y: 80 })).toEqual([
			[115, 75],
			[125, 85]
		]);
	});

	it('calculates standard Web Mercator tile coordinates', () => {
		expect(longitudeLatitudeToTile(0, 0, 1)).toEqual({ z: 1, x: 1, y: 1 });
		expect(longitudeLatitudeToTile(139.767, 35.681, 15.9)).toEqual({
			z: 15,
			x: 29_105,
			y: 12_903
		});
	});

	it('resolves XYZ, TMS, and quadkey placeholders', () => {
		const tile = { z: 3, x: 5, y: 2 };
		expect(resolveTileUrl('https://x/{z}/{x}/{y}/{-y}/{quadkey}', tile)).toBe(
			'https://x/3/5/2/5/121'
		);
	});
});

describe('inspect data style generation', () => {
	it('assigns deterministic colors and includes unused TileJSON source layers', () => {
		const sourceLayers = collectInspectSourceLayers(baseStyle, {
			vector: {
				vector_layers: [
					{ id: 'roads', maxzoom: 14 },
					{ id: 'unused_landuse', minzoom: 3, maxzoom: 14 }
				]
			}
		});
		const first = createInspectDataStyle(baseStyle, sourceLayers);
		const second = createInspectDataStyle(baseStyle, sourceLayers);

		expect(sourceLayers.map(({ key }) => key)).toEqual([
			'geojson/',
			'vector/roads',
			'vector/unused_landuse'
		]);
		expect(first).toEqual(second);
		expect(first.legend.map(({ label }) => label)).toEqual(['geojson', 'roads', 'unused_landuse']);
		expect(first.legend.find(({ label }) => label === 'roads')?.color).toBe(
			inspectColorForName('roads')
		);
		expect(first.style.layers).toHaveLength(1 + sourceLayers.length * 3);
		expect(
			first.style.layers
				.filter(
					(layer) =>
						(layer.metadata as Record<string, unknown> | undefined)?.[
							'kartore:inspectSourceLayer'
						] === 'vector/roads'
				)
				.every((layer) => !('maxzoom' in layer))
		).toBe(true);
		expect(inspectColorForName('roads')).toBe('hsl(332.76, 65%, 55%)');
	});

	it('omits all generated geometry layers for a hidden legend entry', () => {
		const sourceLayers = collectInspectSourceLayers(baseStyle, {
			vector: { vector_layers: [{ id: 'roads' }] }
		});
		const generated = createInspectDataStyle(baseStyle, sourceLayers, new Set(['vector/roads']));

		expect(generated.legend.find(({ key }) => key === 'vector/roads')?.layerIds).toHaveLength(3);
		expect(
			generated.style.layers.some(
				(layer) =>
					(layer.metadata as Record<string, unknown> | undefined)?.[
						'kartore:inspectSourceLayer'
					] === 'vector/roads'
			)
		).toBe(false);
	});
});

describe('feature highlight filter', () => {
	it('hides generated display-layer ids behind source data labels in data view', () => {
		const feature = {
			layerId: 'kartore-inspect-openmaptiles-poi-circle',
			sourceId: 'openmaptiles',
			sourceLayer: 'poi',
			geometryType: 'Point',
			properties: {},
			geojson: {
				type: 'Feature' as const,
				properties: {},
				geometry: { type: 'Point', coordinates: [139.767, 35.681] }
			}
		} satisfies InspectedFeature;

		expect(inspectFeatureDisplayLabel(feature, 'data')).toBe('openmaptiles / poi');
		expect(inspectFeatureContextLabel(feature, 'data')).toBe('Point');
		expect(inspectFeatureDisplayLabel(feature, 'style')).toBe(feature.layerId);
		expect(inspectFeatureContextLabel(feature, 'style')).toBe('openmaptiles / poi ・ Point');
	});

	it('prefers feature id and otherwise uses primitive properties', () => {
		expect(createFeatureHighlightFilter({ id: 42, properties: { name: 'ignored' } })).toEqual([
			'==',
			['id'],
			42
		]);
		expect(createFeatureHighlightFilter({ properties: { name: 'Tokyo', nested: {} } })).toEqual([
			'==',
			['get', 'name'],
			'Tokyo'
		]);
	});

	it('keeps the hover target key stable while only the pointer position changes', () => {
		const feature: InspectedFeature = {
			layerId: 'place_city',
			sourceId: 'openmaptiles',
			sourceLayer: 'place',
			geometryType: 'Point',
			properties: { name: 'Tokyo' },
			geojson: {
				type: 'Feature' as const,
				properties: { name: 'Tokyo' },
				geometry: { type: 'Point', coordinates: [139.767, 35.681] }
			},
			highlightFilter: ['==', ['get', 'name'], 'Tokyo']
		};

		expect(inspectFeatureHighlightKey(feature)).toBe(
			inspectFeatureHighlightKey({
				...feature,
				properties: { name: 'Tokyo' },
				geojson: structuredClone(feature.geojson)
			})
		);
		expect(
			inspectFeatureHighlightKey({
				...feature,
				highlightFilter: ['==', ['get', 'name'], 'Yokohama']
			})
		).not.toBe(inspectFeatureHighlightKey(feature));
	});

	it('deduplicates buffered query results without changing rendered order', () => {
		const feature = {
			id: 42,
			layerId: 'place_city',
			sourceId: 'openmaptiles',
			sourceLayer: 'place',
			geometryType: 'Point',
			properties: { name: 'Tokyo' },
			geojson: {
				type: 'Feature' as const,
				id: 42,
				properties: { name: 'Tokyo' },
				geometry: { type: 'Point', coordinates: [139.767, 35.681] }
			}
		} satisfies InspectedFeature;
		const second = {
			...feature,
			id: 84,
			geojson: { ...feature.geojson, id: 84 }
		} satisfies InspectedFeature;

		expect(dedupeInspectedFeatures([feature, structuredClone(feature), second])).toEqual([
			feature,
			second
		]);
	});
});
