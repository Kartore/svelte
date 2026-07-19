import type { StyleSpecification } from 'maplibre-gl';
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
});
