import type { StyleSpecification } from 'maplibre-gl';

import { GLYPH_PROTOCOL_TEMPLATE } from './glyphProtocol.ts';

export const createDisplayStyle = (
	style: StyleSpecification,
	hasLocalFonts: boolean
): StyleSpecification => (hasLocalFonts ? { ...style, glyphs: GLYPH_PROTOCOL_TEMPLATE } : style);
