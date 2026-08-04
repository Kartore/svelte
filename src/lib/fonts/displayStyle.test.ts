import type { StyleSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import { GLYPH_PROTOCOL_TEMPLATE } from './glyphProtocol.ts';
import { createDisplayStyle } from './displayStyle.ts';

const style = (): StyleSpecification => ({
	version: 8,
	glyphs: 'https://example.com/{fontstack}/{range}.pbf',
	sources: {},
	layers: []
});

describe('createDisplayStyle', () => {
	it('replaces glyphs only in a display copy when local fonts exist', () => {
		const original = style();
		const displayed = createDisplayStyle(original, true);

		expect(displayed).not.toBe(original);
		expect(displayed.glyphs).toBe(GLYPH_PROTOCOL_TEMPLATE);
		expect(original.glyphs).toBe('https://example.com/{fontstack}/{range}.pbf');
	});

	it('keeps the original style when no local fonts exist', () => {
		const original = style();
		expect(createDisplayStyle(original, false)).toBe(original);
	});

	it('adapts migrated icon-image string expressions only in the display copy', () => {
		const original: StyleSpecification = {
			...style(),
			layers: [
				{
					id: 'poi',
					type: 'symbol',
					source: 'pois',
					layout: {
						'icon-image': ['match', ['get', 'kind'], 'cafe', 'coffee', 'marker']
					}
				}
			],
			sources: {
				pois: {
					type: 'geojson',
					data: { type: 'FeatureCollection', features: [] }
				}
			}
		};

		const displayed = createDisplayStyle(original, false);
		const displayedLayer = displayed.layers[0] as SymbolLayerSpecification;
		const originalLayer = original.layers[0] as SymbolLayerSpecification;

		expect(displayed).not.toBe(original);
		expect(displayedLayer.layout?.['icon-image']).toEqual([
			'match',
			['get', 'kind'],
			'cafe',
			['image', 'coffee'],
			['image', 'marker']
		]);
		expect(originalLayer.layout?.['icon-image']).toEqual([
			'match',
			['get', 'kind'],
			'cafe',
			'coffee',
			'marker'
		]);
	});

	it('keeps zoom expressions at the top level while adapting their image outputs', () => {
		const original: StyleSpecification = {
			...style(),
			layers: [
				{
					id: 'city',
					type: 'symbol',
					source: 'places',
					layout: {
						'icon-image': ['step', ['zoom'], 'dot', 8, '']
					}
				}
			],
			sources: {
				places: {
					type: 'geojson',
					data: { type: 'FeatureCollection', features: [] }
				}
			}
		};

		const displayedLayer = createDisplayStyle(original, false)
			.layers[0] as SymbolLayerSpecification;
		expect(displayedLayer.layout?.['icon-image']).toEqual([
			'step',
			['zoom'],
			['image', 'dot'],
			8,
			['image', '__kartore_empty_icon__']
		]);
	});
});
