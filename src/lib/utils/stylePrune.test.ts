import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import { parseImportedStyleJSON, parseStyleJSON } from './styleImport.ts';
import { pruneDefaultValues } from './stylePrune.ts';
import { serializeStyle } from './styleSerialize.ts';

const styleWithLine = (layer: Record<string, unknown> = {}): StyleSpecification =>
	({
		version: 8,
		sources: {
			lines: {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			}
		},
		layers: [
			{
				id: 'lines',
				type: 'line',
				source: 'lines',
				...layer
			}
		]
	}) as StyleSpecification;

describe('pruneDefaultValues', () => {
	it('removes default numeric, array, enum, visibility, and transition values', () => {
		const style = styleWithLine({
			layout: {
				'line-cap': 'butt',
				visibility: 'visible'
			},
			paint: {
				'line-opacity': 1,
				'line-translate': [0, 0],
				'line-width-transition': { delay: 0, duration: 300 }
			}
		});

		const pruned = pruneDefaultValues(style);

		expect(pruned.layers[0]).not.toHaveProperty('paint');
		expect(pruned.layers[0]).not.toHaveProperty('layout');
		expect(style.layers[0]).toHaveProperty('paint.line-opacity', 1);
		expect(style.layers[0]).toHaveProperty('layout.visibility', 'visible');
	});

	it('treats omitted transition members as their runtime defaults', () => {
		const style = styleWithLine({
			paint: {
				'line-width-transition': { duration: 300 },
				'line-color-transition': {}
			}
		});

		expect(pruneDefaultValues(style).layers[0]).not.toHaveProperty('paint');
	});

	it('keeps non-default values, expressions, and properties without defaults', () => {
		const expression = ['interpolate', ['linear'], ['zoom'], 0, 1, 22, 1];
		const style = styleWithLine({
			minzoom: 0,
			maxzoom: 24,
			layout: { visibility: 'none' },
			paint: {
				'line-opacity': 0.5,
				'line-translate': [1, 0],
				'line-width': expression,
				'line-width-transition': { duration: 301, delay: 0 }
			}
		});

		const layer = pruneDefaultValues(style).layers[0];

		expect(layer).toMatchObject({ minzoom: 0, maxzoom: 24 });
		expect(layer.layout).toEqual({ visibility: 'none' });
		expect(layer.paint).toEqual({
			'line-opacity': 0.5,
			'line-translate': [1, 0],
			'line-width': expression,
			'line-width-transition': { duration: 301, delay: 0 }
		});
	});

	it('produces a valid, rendering-equivalent style and is idempotent', () => {
		const style = styleWithLine({
			layout: { 'line-cap': 'butt', visibility: 'visible' },
			paint: { 'line-color': '#000000', 'line-opacity': 1, 'line-width': 1 }
		});
		const pruned = pruneDefaultValues(style);

		expect(validateStyleMin(style)).toEqual([]);
		expect(validateStyleMin(pruned)).toEqual([]);
		expect(pruneDefaultValues(pruned)).toEqual(pruned);
	});

	it('prunes only the explicit import boundary, preserving internal parse bytes', () => {
		const style = styleWithLine({ paint: { 'line-width': 1 } });
		const text = serializeStyle(style);
		const internal = parseStyleJSON(text);
		const imported = parseImportedStyleJSON(text);

		expect(internal.ok && serializeStyle(internal.style)).toBe(text);
		expect(imported.ok && imported.style.layers[0]).not.toHaveProperty('paint');
	});
});
