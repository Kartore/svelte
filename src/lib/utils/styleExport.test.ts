import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import { createDisplayStyle } from '$lib/fonts/displayStyle.ts';
import { GLYPH_PROTOCOL_TEMPLATE } from '$lib/fonts/glyphProtocol.ts';

import { createStyleExport } from './styleExport.ts';

describe('createStyleExport', () => {
	it('preserves a renamed Japanese style name in the JSON and filename', () => {
		const style: StyleSpecification = {
			version: 8,
			name: '日本語スタイル',
			sources: {},
			layers: []
		};

		const result = createStyleExport(style);

		expect(JSON.parse(result.contents)).toMatchObject({ name: '日本語スタイル' });
		expect(result.fileName).toBe('日本語スタイル.json');
	});

	it('does not export the display-only local glyph protocol', () => {
		const style: StyleSpecification = {
			version: 8,
			glyphs: 'https://example.com/{fontstack}/{range}.pbf',
			sources: {},
			layers: []
		};

		const displayStyle = createDisplayStyle(style, true);
		const result = createStyleExport(style);

		expect(displayStyle.glyphs).toBe(GLYPH_PROTOCOL_TEMPLATE);
		expect(result.contents).toContain('https://example.com/{fontstack}/{range}.pbf');
		expect(result.contents).not.toContain('kartore-glyph://');
	});
});
