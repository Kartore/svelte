import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import { getLayerZoomRangeLabel, isLayerOutsideZoomRange } from './layerSpec.ts';

const rangedLayer = (minzoom?: number, maxzoom?: number): LayerSpecification => ({
	id: 'ranged',
	type: 'background',
	...(minzoom === undefined ? {} : { minzoom }),
	...(maxzoom === undefined ? {} : { maxzoom })
});

describe('layer zoom range presentation', () => {
	it('uses inclusive minzoom and exclusive maxzoom boundaries', () => {
		const layer = rangedLayer(10, 15);

		expect(isLayerOutsideZoomRange(layer, 9.99)).toBe(true);
		expect(isLayerOutsideZoomRange(layer, 10)).toBe(false);
		expect(isLayerOutsideZoomRange(layer, 14.99)).toBe(false);
		expect(isLayerOutsideZoomRange(layer, 15)).toBe(true);
	});

	it('does not dim layers without an explicit range or before map zoom is available', () => {
		expect(isLayerOutsideZoomRange(rangedLayer(), 25)).toBe(false);
		expect(isLayerOutsideZoomRange(rangedLayer(10, 15), undefined)).toBe(false);
	});

	it('formats missing range ends with the editor zoom defaults', () => {
		expect(getLayerZoomRangeLabel(rangedLayer(undefined, 10))).toBe('z0–10');
		expect(getLayerZoomRangeLabel(rangedLayer(5, undefined))).toBe('z5–24');
		expect(getLayerZoomRangeLabel(rangedLayer())).toBeUndefined();
	});
});
