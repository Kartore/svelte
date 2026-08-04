import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import {
	fontUsageLayerIds,
	layerTextFontStacks,
	referencedFontStacks,
	spriteUsageLayerIds
} from './assetUsage.ts';

const style = (): StyleSpecification => ({
	version: 8,
	sources: {
		fixture: {
			type: 'geojson',
			data: { type: 'FeatureCollection', features: [] }
		}
	},
	layers: [
		{
			id: 'direct-icon',
			type: 'symbol',
			source: 'fixture',
			layout: {
				'icon-image': 'station',
				'text-font': ['Roboto Regular', 'Noto Sans Regular']
			}
		},
		{
			id: 'expression-icon',
			type: 'symbol',
			source: 'fixture',
			layout: {
				'icon-image': ['case', ['get', 'major'], 'station', 'stop'],
				'text-font': [
					'case',
					['get', 'jp'],
					['literal', ['Noto Sans Regular']],
					['literal', ['Roboto Regular']]
				]
			}
		},
		{
			id: 'pattern',
			type: 'fill',
			source: 'fixture',
			paint: { 'fill-pattern': 'station' }
		}
	]
});

describe('asset usage scanning', () => {
	it('finds sprite references in direct values, expressions, and pattern properties', () => {
		expect(spriteUsageLayerIds(style(), 'station')).toEqual([
			'direct-icon',
			'expression-icon',
			'pattern'
		]);
		expect(spriteUsageLayerIds(style(), 'stop')).toEqual(['expression-icon']);
	});

	it('extracts literal fontstacks and maps them back to layer usages', () => {
		expect(layerTextFontStacks(style().layers[0])).toEqual(['Roboto Regular', 'Noto Sans Regular']);
		expect(referencedFontStacks(style())).toEqual(['Roboto Regular', 'Noto Sans Regular']);
		expect(fontUsageLayerIds(style(), 'Noto Sans Regular')).toEqual([
			'direct-icon',
			'expression-icon'
		]);
	});
});
