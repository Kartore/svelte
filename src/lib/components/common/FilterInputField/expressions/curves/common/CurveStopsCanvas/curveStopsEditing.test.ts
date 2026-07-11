import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import {
	clampCurveInput,
	getCurveInputBounds,
	getCurveOutputStep,
	roundCurveInput,
	roundCurveOutput
} from './curveStopsEditing.ts';

const expression = [
	'interpolate',
	['linear'],
	['zoom'],
	0,
	1,
	5,
	2,
	10,
	3
] as ExpressionSpecification;

describe('curve stop input editing', () => {
	it('rounds input values to tenths without floating-point noise', () => {
		expect(roundCurveInput(7.249999999)).toBe(7.2);
		expect(roundCurveInput(7.250000001)).toBe(7.3);
	});

	it('keeps a 0.1 margin from adjacent stops', () => {
		expect(getCurveInputBounds(expression, 0, [0, 24])).toEqual({ min: 0, max: 4.9 });
		expect(getCurveInputBounds(expression, 1, [0, 24])).toEqual({ min: 0.1, max: 9.9 });
		expect(getCurveInputBounds(expression, 2, [0, 24])).toEqual({ min: 5.1, max: 24 });
		const decimalStops = [
			'interpolate',
			['linear'],
			['zoom'],
			0.2,
			1,
			0.5,
			2
		] as ExpressionSpecification;
		expect(getCurveInputBounds(decimalStops, 1, [0, 24])).toEqual({ min: 0.3, max: 24 });
	});

	it('clamps after rounding', () => {
		expect(clampCurveInput(-1, { min: 0, max: 4.9 })).toBe(0);
		expect(clampCurveInput(4.96, { min: 0, max: 4.9 })).toBe(4.9);
	});

	it('disables editing when no tenth satisfies both margins', () => {
		const closeStops = [
			'interpolate',
			['linear'],
			['zoom'],
			0,
			1,
			0.05,
			2
		] as ExpressionSpecification;
		expect(getCurveInputBounds(closeStops, 0, [0, 24])).toBeNull();
	});
});

describe('curve stop output editing', () => {
	it('uses one hundredth of the visible span rounded to two significant figures', () => {
		expect(getCurveOutputStep(5.5)).toBe(0.055);
		expect(getCurveOutputStep(550)).toBe(5.5);
		expect(getCurveOutputStep(0)).toBe(0.01);
	});

	it('writes only values snapped to the rounded output step', () => {
		expect(roundCurveOutput(1.927, 5.5)).toBe(1.925);
		expect(roundCurveOutput(527.2, 550)).toBe(528);
	});
});
