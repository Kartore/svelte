import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import type { StylePackAssets, StylePackFiles } from './stylePack.ts';
import { createStylePack, readStylePack } from './stylePack.ts';
import { serializeStyleAuxiliary } from './styleSerialize.ts';
import { BINDINGS_METADATA_KEY, VARIABLES_METADATA_KEY } from './styleVariables.ts';

const META = {
	appVersion: '1.2.3',
	createdAt: '2026-07-25T12:34:56.000Z'
};

const style = (): StyleSpecification => ({
	version: 8,
	name: 'Pack test',
	metadata: {
		[VARIABLES_METADATA_KEY]: {
			version: 1,
			variables: [{ id: 'primary', name: 'Primary', type: 'color', value: '#0088cc' }]
		}
	},
	sources: {
		base: { type: 'vector', url: 'https://example.com/source.json' }
	},
	layers: [
		{
			id: 'water',
			type: 'fill',
			source: 'base',
			'source-layer': 'water',
			metadata: {
				[BINDINGS_METADATA_KEY]: {
					'paint:fill-color': 'primary'
				}
			},
			paint: { 'fill-color': '#0088cc' }
		}
	]
});

const fontBytes = (...bytes: number[]): ArrayBuffer => new Uint8Array(bytes).buffer;

const assets = (): StylePackAssets => ({
	icons: {
		marker: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>'
	},
	fonts: {
		'Inter Regular': {
			familyName: 'Inter',
			styleName: 'Regular',
			addedAt: 1_753_446_896_000,
			bytes: fontBytes(0x4f, 0x54, 0x54, 0x4f, 0x01)
		}
	}
});

const fileBytes = (files: StylePackFiles): Record<string, Uint8Array> =>
	Object.fromEntries(
		Object.keys(files)
			.sort()
			.map((path) => {
				const value = files[path];
				return [path, typeof value === 'string' ? new TextEncoder().encode(value) : value];
			})
	);

const metadataValue = (metadata: unknown, key: string): unknown =>
	typeof metadata === 'object' && metadata !== null
		? (metadata as Record<string, unknown>)[key]
		: undefined;

describe('stylePack', () => {
	it('round-trips style, sprite sources, and all stored fonts', () => {
		const inputStyle = style();
		const inputAssets = assets();
		const opened = readStylePack(createStylePack(inputStyle, inputAssets, META));

		expect(opened.warnings).toEqual([]);
		expect(opened.style).toEqual(inputStyle);
		expect(opened.assets).toEqual(inputAssets);
	});

	it('always stores the style in split form and omits generated assets', () => {
		const files = createStylePack(style(), assets(), META);

		expect(files).toHaveProperty('style/style.json');
		expect(files).toHaveProperty('style/sources.json');
		expect(files).toHaveProperty('style/layers.json');
		expect(files).toHaveProperty('style/layers/water.json');
		expect(files).not.toHaveProperty('style.json');
		expect(Object.keys(files).some((path) => path.endsWith('.png') || path.endsWith('.pbf'))).toBe(
			false
		);
	});

	it('accepts a project without registered icons or fonts', () => {
		const emptyAssets: StylePackAssets = { icons: {}, fonts: {} };

		const opened = readStylePack(createStylePack(style(), emptyAssets, META));

		expect(opened.assets).toEqual(emptyAssets);
		expect(
			JSON.parse(createStylePack(style(), emptyAssets, META)['assets/fonts.json'] as string)
		).toMatchObject({ version: 1, fonts: {} });
	});

	it('preserves style-variable metadata and layer bindings through pack splitting', () => {
		const input = style();
		const opened = readStylePack(createStylePack(input, assets(), META)).style;

		expect(metadataValue(opened.metadata, VARIABLES_METADATA_KEY)).toEqual(
			metadataValue(input.metadata, VARIABLES_METADATA_KEY)
		);
		expect(metadataValue(opened.layers[0].metadata, BINDINGS_METADATA_KEY)).toEqual(
			metadataValue(input.layers[0].metadata, BINDINGS_METADATA_KEY)
		);
	});

	it('uses deterministic sanitized names and resolves collisions', () => {
		const files = createStylePack(
			style(),
			{
				icons: {
					'icon/a': '<svg id="a"/>',
					icon_a: '<svg id="b"/>'
				},
				fonts: {
					'font/a': {
						familyName: 'One',
						styleName: 'Regular',
						addedAt: 1,
						bytes: fontBytes(0x4f, 0x54, 0x54, 0x4f)
					},
					font_a: {
						familyName: 'Two',
						styleName: 'Regular',
						addedAt: 2,
						bytes: fontBytes(0x4f, 0x54, 0x54, 0x4f)
					}
				}
			},
			META
		);

		expect(JSON.parse(files['assets/sprites.json'] as string).icons).toEqual({
			'icon/a': 'icon_a.svg',
			icon_a: 'icon_a-2.svg'
		});
		expect(JSON.parse(files['assets/fonts.json'] as string).fonts).toMatchObject({
			'font/a': { file: 'font_a.otf' },
			font_a: { file: 'font_a-2.otf' }
		});
	});

	it('rejects a missing font file referenced by fonts.json', () => {
		const files = createStylePack(style(), assets(), META);
		delete files['assets/fonts/Inter Regular.otf'];

		expect(() => readStylePack(files)).toThrow(
			'Style pack file is missing: assets/fonts/Inter Regular.otf'
		);
	});

	it('warns for extra files and ignores them', () => {
		const files = createStylePack(style(), assets(), META);
		files['notes/readme.txt'] = 'not part of the pack';
		files['style/unknown.bin'] = Uint8Array.from([0xff, 0xfe]);

		const opened = readStylePack(files);

		expect(opened.warnings).toContain('Ignoring extra style pack file: notes/readme.txt');
		expect(opened.warnings).toContain('Ignoring extra style pack file: style/unknown.bin');
		expect(opened.style).toEqual(style());
	});

	it('rejects a newer formatVersion', () => {
		const files = createStylePack(style(), assets(), META);
		files['manifest.json'] = serializeStyleAuxiliary({
			formatVersion: 2,
			appVersion: META.appVersion,
			createdAt: META.createdAt
		});

		expect(() => readStylePack(files)).toThrow(
			'This style pack was created by a newer version of Kartore.'
		);
	});

	it('detects OpenType, TrueType, and unknown font extensions', () => {
		const files = createStylePack(
			style(),
			{
				icons: {},
				fonts: {
					OpenType: {
						familyName: 'OpenType',
						styleName: 'Regular',
						addedAt: 1,
						bytes: fontBytes(0x4f, 0x54, 0x54, 0x4f)
					},
					TrueType: {
						familyName: 'TrueType',
						styleName: 'Regular',
						addedAt: 2,
						bytes: fontBytes(0x00, 0x01, 0x00, 0x00)
					},
					Unknown: {
						familyName: 'Unknown',
						styleName: 'Regular',
						addedAt: 3,
						bytes: fontBytes(0x77, 0x4f, 0x46, 0x46)
					}
				}
			},
			META
		);

		expect(JSON.parse(files['assets/fonts.json'] as string).fonts).toMatchObject({
			OpenType: { file: 'OpenType.otf' },
			TrueType: { file: 'TrueType.ttf' },
			Unknown: { file: 'Unknown.bin' }
		});
	});

	it('normalizes generated paths to NFC', () => {
		const decomposed = 'Cafe\u0301';
		const files = createStylePack(
			style(),
			{
				icons: { [decomposed]: '<svg />' },
				fonts: {}
			},
			META
		);

		expect(Object.keys(files)).toContain('assets/sprites/Café.svg');
		expect(Object.keys(files)).not.toContain(`assets/sprites/${decomposed}.svg`);
	});

	it('emits byte-identical file maps after save, open, and save', () => {
		const first = createStylePack(style(), assets(), META);
		const opened = readStylePack(first);
		const second = createStylePack(opened.style, opened.assets, META);

		expect(fileBytes(second)).toEqual(fileBytes(first));
	});

	it('is independent of icon and font object insertion order', () => {
		const input = assets();
		const reordered: StylePackAssets = {
			icons: Object.fromEntries(Object.entries(input.icons).reverse()),
			fonts: Object.fromEntries(Object.entries(input.fonts).reverse())
		};

		expect(fileBytes(createStylePack(style(), reordered, META))).toEqual(
			fileBytes(createStylePack(style(), input, META))
		);
	});
});
