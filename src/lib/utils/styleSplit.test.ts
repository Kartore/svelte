import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import { osmLibertyMigrated } from '#lib/samples/osm-liberty.ts';

import { parseStyleJSON } from './styleImport.ts';
import { assembleStyle, sanitizeLayerBasename, splitStyle } from './styleSplit.ts';
import { BINDINGS_METADATA_KEY, VARIABLES_METADATA_KEY } from './styleVariables.ts';

const metadataStyle = (): StyleSpecification => ({
	version: 8,
	name: 'Variables',
	metadata: {
		owner: 'kartore',
		[VARIABLES_METADATA_KEY]: {
			version: 1,
			variables: [{ id: 'primary', name: 'Primary', type: 'color', value: '#00aaff' }]
		}
	},
	sources: {
		base: {
			type: 'vector',
			url: 'https://example.com/source.json'
		}
	},
	layers: [
		{
			id: 'water',
			type: 'fill',
			source: 'base',
			'source-layer': 'water',
			metadata: {
				owner: 'kartore',
				[BINDINGS_METADATA_KEY]: {
					'paint:fill-color': 'primary'
				}
			},
			paint: {
				'fill-color': '#00aaff'
			}
		}
	]
});

const metadataValue = (metadata: unknown, key: string): unknown =>
	typeof metadata === 'object' && metadata !== null
		? (metadata as Record<string, unknown>)[key]
		: undefined;

describe('splitStyle and assembleStyle', () => {
	it('round-trips the production-scale OSM Liberty style', () => {
		const split = splitStyle(osmLibertyMigrated);
		const assembled = assembleStyle(split.files);

		expect(assembled.warnings).toEqual([]);
		expect(assembled.style).toEqual(osmLibertyMigrated);
		expect(parseStyleJSON(JSON.stringify(assembled.style)).ok).toBe(true);
	});

	it('round-trips style-variable metadata and bindings without loss', () => {
		const style = metadataStyle();
		const split = splitStyle(style);
		const assembled = assembleStyle(split.files).style;

		expect(assembled).toEqual(style);
		expect(metadataValue(assembled.metadata, VARIABLES_METADATA_KEY)).toEqual(
			metadataValue(style.metadata, VARIABLES_METADATA_KEY)
		);
		expect(metadataValue(assembled.layers[0].metadata, BINDINGS_METADATA_KEY)).toEqual(
			metadataValue(style.layers[0].metadata, BINDINGS_METADATA_KEY)
		);
	});

	it('round-trips empty layers and unknown root keys', () => {
		const style = {
			version: 8,
			sources: {},
			layers: [],
			'z-unknown': { nested: true }
		} as unknown as StyleSpecification;

		const split = splitStyle(style);
		const assembled = assembleStyle(split.files);

		expect(assembled.style).toEqual(style);
		expect(JSON.parse(split.files['style.json'])).not.toHaveProperty('sources');
		expect(JSON.parse(split.files['style.json'])).not.toHaveProperty('layers');
		expect(JSON.parse(split.files['layers.json'])).toEqual([]);
	});

	it('sanitizes forbidden and leading characters and resolves basename collisions', () => {
		const style = {
			version: 8,
			sources: {},
			layers: [
				{ id: 'road/water', type: 'background' },
				{ id: 'road:water', type: 'background' },
				{ id: '.hidden', type: 'background' },
				{ id: '', type: 'background' }
			]
		} as StyleSpecification;

		const split = splitStyle(style);

		expect(sanitizeLayerBasename('road/water')).toBe('road_water');
		expect(split.layerFiles).toEqual({
			'road/water': 'layers/road_water.json',
			'road:water': 'layers/road_water-2.json',
			'.hidden': 'layers/_hidden.json',
			'': 'layers/layer.json'
		});
		expect(JSON.parse(split.files['layers.json'])).toEqual([
			'road_water.json',
			'road_water-2.json',
			'_hidden.json',
			'layer.json'
		]);
	});

	it('preserves existing basenames and reports rename and deletion operations', () => {
		const previousStyle = {
			version: 8,
			sources: {
				base: { type: 'vector', url: 'https://example.com/source.json' }
			},
			layers: [
				{ id: 'water', type: 'fill', source: 'base', paint: { 'fill-color': '#00aaff' } },
				{ id: 'road', type: 'line', source: 'base', paint: { 'line-color': '#333333' } },
				{ id: 'labels', type: 'symbol', source: 'base' }
			]
		} satisfies StyleSpecification;
		const currentStyle = {
			...previousStyle,
			layers: [
				{ id: 'road', type: 'line', source: 'base', paint: { 'line-color': '#ff0000' } },
				{ id: 'ocean', type: 'fill', source: 'base', paint: { 'fill-color': '#0077cc' } }
			]
		} satisfies StyleSpecification;

		const split = splitStyle(currentStyle, {
			style: previousStyle,
			layerFiles: {
				water: 'styles/basic/layers/custom-water.json',
				road: 'styles/basic/layers/custom-road.json',
				labels: 'styles/basic/layers/labels.json'
			}
		});

		expect(split.layerFiles.road).toBe('layers/custom-road.json');
		expect(split.layerFiles.ocean).toBe('layers/ocean.json');
		expect(split.renames).toEqual([{ from: 'layers/custom-water.json', to: 'layers/ocean.json' }]);
		expect(split.deletions).toEqual(['layers/labels.json']);
	});

	it('returns byte-identical files for the same style', () => {
		const style = metadataStyle();

		expect(splitStyle(style).files).toEqual(splitStyle(structuredClone(style)).files);
	});

	it('rejects missing manifest files and duplicate layer ids', () => {
		const split = splitStyle(metadataStyle());
		const missing = { ...split.files };
		delete missing['layers/water.json'];

		expect(() => assembleStyle(missing)).toThrow('Split style file is missing: layers/water.json');

		const duplicateManifest = {
			...split.files,
			'layers.json': '["water.json", "water-copy.json"]\n',
			'layers/water-copy.json': split.files['layers/water.json']
		};
		expect(() => assembleStyle(duplicateManifest)).toThrow(
			'Duplicate layer id in split style: water'
		);
	});

	it('warns for orphan layer files but ignores reserved asset paths', () => {
		const split = splitStyle(metadataStyle());
		const assembled = assembleStyle({
			...split.files,
			'layers/orphan.json': '{"id":"orphan","type":"background"}\n',
			'assets/icon.svg': '<svg />',
			'manifest.json': '{}\n'
		});

		expect(assembled.warnings).toEqual(['Ignoring unreferenced layer file: layers/orphan.json']);
	});
});
