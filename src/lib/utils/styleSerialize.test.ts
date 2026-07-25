import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import { BINDINGS_METADATA_KEY, VARIABLES_METADATA_KEY } from './styleVariables.ts';
import { serializeStyle } from './styleSerialize.ts';

const reverseObjectKeys = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(reverseObjectKeys);
	if (typeof value !== 'object' || value === null) return value;
	return Object.fromEntries(
		Object.entries(value)
			.reverse()
			.map(([key, child]) => [key, reverseObjectKeys(child)])
	);
};

const metadataValue = (metadata: unknown, key: string): unknown =>
	typeof metadata === 'object' && metadata !== null
		? (metadata as Record<string, unknown>)[key]
		: undefined;

const styleWithMetadata = (): StyleSpecification =>
	({
		'z-root': true,
		layers: [
			{
				'z-layer': true,
				paint: {
					'z-paint': 'unknown',
					'fill-color': ['get', 'color'],
					'fill-opacity': 0.75,
					'fill-antialias': true
				},
				metadata: {
					zebra: true,
					[BINDINGS_METADATA_KEY]: {
						'paint:fill-opacity': 'opacity',
						'paint:fill-color': 'primary'
					},
					alpha: true
				},
				type: 'fill',
				id: 'land'
			}
		],
		sources: {
			zebra: { tiles: ['https://example.com/{z}/{x}/{y}.pbf'], type: 'vector' },
			alpha: { url: 'https://example.com/source.json', type: 'vector' }
		},
		metadata: {
			zebra: true,
			[VARIABLES_METADATA_KEY]: {
				variables: [{ value: '#00aaff', type: 'color', name: 'Primary', id: 'primary' }],
				version: 1
			},
			alpha: true
		},
		version: 8
	}) as unknown as StyleSpecification;

describe('serializeStyle', () => {
	it('uses style-spec key order and dictionary order for metadata, sources, and unknown keys', () => {
		const serialized = serializeStyle(styleWithMetadata());

		expect(serialized.indexOf('"version"')).toBeLessThan(serialized.indexOf('"metadata"'));
		expect(serialized.indexOf('"metadata"')).toBeLessThan(serialized.indexOf('"sources"'));
		expect(serialized.indexOf('"sources"')).toBeLessThan(serialized.indexOf('"layers"'));
		expect(serialized.indexOf('"layers"')).toBeLessThan(serialized.indexOf('"z-root"'));

		const rootMetadata = serialized.slice(
			serialized.indexOf('"metadata"'),
			serialized.indexOf('"sources"')
		);
		expect(rootMetadata.indexOf('"alpha"')).toBeLessThan(
			rootMetadata.indexOf(`"${VARIABLES_METADATA_KEY}"`)
		);
		expect(rootMetadata.indexOf(`"${VARIABLES_METADATA_KEY}"`)).toBeLessThan(
			rootMetadata.indexOf('"zebra"')
		);

		const sources = serialized.slice(
			serialized.indexOf('"sources"'),
			serialized.indexOf('"layers"')
		);
		expect(sources.indexOf('"alpha"')).toBeLessThan(sources.indexOf('"zebra"'));
		expect(sources.indexOf('"type"')).toBeLessThan(sources.indexOf('"url"'));

		const layer = serialized.slice(serialized.indexOf('"layers"'));
		expect(layer.indexOf('"id"')).toBeLessThan(layer.indexOf('"type"'));
		expect(layer.indexOf('"type"')).toBeLessThan(layer.indexOf('"metadata"'));
		expect(layer.indexOf('"metadata"')).toBeLessThan(layer.indexOf('"paint"'));
		expect(layer.indexOf('"paint"')).toBeLessThan(layer.indexOf('"z-layer"'));

		const paint = layer.slice(layer.indexOf('"paint"'));
		expect(paint.indexOf('"fill-antialias"')).toBeLessThan(paint.indexOf('"fill-opacity"'));
		expect(paint.indexOf('"fill-opacity"')).toBeLessThan(paint.indexOf('"fill-color"'));
		expect(paint.indexOf('"fill-color"')).toBeLessThan(paint.indexOf('"z-paint"'));
	});

	it('inlines only short primitive arrays and uses tabs, LF, and one trailing newline', () => {
		const style = {
			version: 8,
			center: [139.7, 35.7],
			sources: {},
			layers: [
				{
					id: 'road',
					type: 'line',
					source: 'roads',
					paint: {
						'line-color': ['get', 'color'],
						'line-dasharray': Array.from({ length: 30 }, (_, index) => index)
					}
				}
			]
		} as StyleSpecification;

		const serialized = serializeStyle(style);

		expect(serialized).toContain('"center": [139.7, 35.7]');
		expect(serialized).toContain('"line-color": ["get", "color"]');
		expect(serialized).toContain('"line-dasharray": [\n');
		expect(serialized).toContain('\n\t\t\t\t\t0,\n\t\t\t\t\t1,');
		expect(serialized).not.toContain('\r');
		expect(serialized.endsWith('\n')).toBe(true);
		expect(serialized.endsWith('\n\n')).toBe(false);
	});

	it('emits byte-identical output for styles with different object insertion order', () => {
		const style = styleWithMetadata();
		const reordered = reverseObjectKeys(style) as StyleSpecification;

		expect(reordered).toEqual(style);
		expect(serializeStyle(reordered)).toBe(serializeStyle(style));
		expect(new TextEncoder().encode(serializeStyle(reordered))).toEqual(
			new TextEncoder().encode(serializeStyle(style))
		);
	});

	it('preserves style-variable definitions and layer bindings', () => {
		const style = styleWithMetadata();
		const parsed = JSON.parse(serializeStyle(style)) as StyleSpecification;

		expect(metadataValue(parsed.metadata, VARIABLES_METADATA_KEY)).toEqual(
			metadataValue(style.metadata, VARIABLES_METADATA_KEY)
		);
		expect(metadataValue(parsed.layers[0].metadata, BINDINGS_METADATA_KEY)).toEqual(
			metadataValue(style.layers[0].metadata, BINDINGS_METADATA_KEY)
		);
	});
});
