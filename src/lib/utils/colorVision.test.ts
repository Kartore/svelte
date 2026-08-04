import { describe, expect, it } from 'vitest';

import {
	COLOR_VISION_MATRICES,
	colorVisionMatrixValues,
	findColorVisionWarnings,
	isColorVisionWarningDelta,
	simulateColorVision
} from './colorVision.ts';

describe('color-vision matrices', () => {
	it('exposes SVG-compatible Machado and grayscale matrices', () => {
		for (const matrix of Object.values(COLOR_VISION_MATRICES)) expect(matrix).toHaveLength(20);
		expect(colorVisionMatrixValues('protanopia').split(' ')).toHaveLength(20);
		expect(simulateColorVision('#ff0000', 'protanopia')).toBe('rgb(39, 29, 0)');
		expect(simulateColorVision('not-a-color', 'deuteranopia')).toBeUndefined();
	});
});

describe('color-vision warning detection', () => {
	it('uses inclusive original and exclusive simulated Delta E boundaries', () => {
		expect(isColorVisionWarningDelta(6, 2.499)).toBe(true);
		expect(isColorVisionWarningDelta(5.999, 2.499)).toBe(false);
		expect(isColorVisionWarningDelta(6, 2.5)).toBe(false);
	});

	it('checks every color pair and returns deterministic warnings only', () => {
		const entries = [
			{ id: 'red', label: 'red', color: '#ff0000', layerIds: ['red-layer'] },
			{ id: 'dark-red', label: 'dark red', color: '#cc0000', layerIds: ['dark-red-layer'] },
			{ id: 'white', label: 'white', color: '#ffffff', layerIds: ['white-layer'] }
		];
		const first = findColorVisionWarnings(entries);
		expect(first.length).toBeGreaterThan(0);
		expect(findColorVisionWarnings(entries)).toEqual(first);
		expect(
			first.every(
				({ originalDeltaE, simulatedDeltaE }) => originalDeltaE >= 6 && simulatedDeltaE < 2.5
			)
		).toBe(true);
	});

	it('warns for matched red-green pairs in types 1 and 2, but not blue-yellow', () => {
		const warningModes = (left: string, right: string) =>
			findColorVisionWarnings([
				{ id: 'left', label: 'left', color: left, layerIds: [] },
				{ id: 'right', label: 'right', color: right, layerIds: [] }
			]).map(({ mode }) => mode);

		expect(warningModes('#ff0000', '#002600')).toContain('protanopia');
		expect(warningModes('#ff0000', '#006b00')).toContain('deuteranopia');
		expect(warningModes('#0000ff', '#ffff00')).toEqual([]);
	});
});
