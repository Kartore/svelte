import { describe, expect, it } from 'vitest';

import { spriteDimensionsFromSvg, spriteIdFromFileName, svgDataUrl } from './spriteSvg.ts';

describe('sprite SVG helpers', () => {
	it('uses positive integer width and height attributes directly', () => {
		expect(spriteDimensionsFromSvg('<svg width="32" height="18" viewBox="0 0 64 36" />')).toEqual({
			width: 32,
			height: 18,
			hasIntegerSizeAttributes: true
		});
	});

	it('uses attribute values provisionally and preserves viewBox aspect ratio', () => {
		expect(spriteDimensionsFromSvg('<svg width="2rem" viewBox="0 0 40 20" />')).toEqual({
			width: 2,
			height: 1,
			hasIntegerSizeAttributes: false
		});
	});

	it('falls back to viewBox dimensions', () => {
		expect(spriteDimensionsFromSvg('<svg viewBox="0 0 48 24" />')).toEqual({
			width: 48,
			height: 24,
			hasIntegerSizeAttributes: false
		});
	});

	it('sanitizes file stems and encodes data URLs', () => {
		expect(spriteIdFromFileName('Train stop (east).SVG')).toBe('Train-stop--east-');
		expect(svgDataUrl('<svg fill="#fff" />')).toBe(
			`data:image/svg+xml,${encodeURIComponent('<svg fill="#fff" />')}`
		);
	});
});
