import { latest } from '@maplibre/maplibre-gl-style-spec';
import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import { getLayerPropertyCatalog } from './propertyCatalog.ts';

const REQUIRED_LAYER_TYPES: LayerSpecification['type'][] = [
	'line',
	'fill',
	'symbol',
	'circle',
	'raster',
	'background',
	'heatmap',
	'fill-extrusion',
	'hillshade'
];

describe('property catalog against the installed MapLibre style spec', () => {
	it.each(REQUIRED_LAYER_TYPES)('covers every layout/paint property for %s', (layerType) => {
		const catalog = getLayerPropertyCatalog(layerType);
		const expected = ['layout', 'paint'].flatMap((group) =>
			Object.keys(
				((latest as Record<string, unknown>)[`${group}_${layerType}`] as
					Record<string, unknown> | undefined) ?? {}
			).map((key) => `${group}:${key}`)
		);

		expect(catalog.map((item) => `${item.group}:${item.key}`).sort()).toEqual(expected.sort());
	});

	it.each(REQUIRED_LAYER_TYPES)('uses the exact spec default for %s', (layerType) => {
		for (const item of getLayerPropertyCatalog(layerType)) {
			const specGroup = (latest as Record<string, unknown>)[`${item.group}_${layerType}`] as Record<
				string,
				{ default?: unknown }
			>;
			expect(item.defaultValue).toEqual(specGroup[item.key].default);
		}
	});

	it('extracts the GeoJSON lineMetrics requirement for line-gradient', () => {
		const gradient = getLayerPropertyCatalog('line').find((item) => item.key === 'line-gradient');

		expect(gradient).toBeDefined();
		expect(gradient?.requirements.some(({ message }) => message.includes('lineMetrics=true'))).toBe(
			true
		);
	});
});
