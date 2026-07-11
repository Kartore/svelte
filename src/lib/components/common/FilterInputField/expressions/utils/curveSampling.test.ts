import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import { sampleCurveExpression } from './curveSampling.ts';

describe('sampleCurveExpression', () => {
	it('uses the supplied domain for zoom curves', () => {
		const expression = [
			'interpolate',
			['linear'],
			['zoom'],
			0,
			0,
			24,
			1
		] as ExpressionSpecification;

		const result = sampleCurveExpression(expression, 4, [12, 18]);

		expect(result?.domain).toEqual([12, 18]);
		expect(result?.samples.map(({ x }) => x)).toEqual([12, 13.5, 15, 16.5, 18]);
	});

	it('ignores the supplied domain for data-driven curves', () => {
		const expression = [
			'interpolate',
			['linear'],
			['get', 'value'],
			10,
			0,
			20,
			1
		] as ExpressionSpecification;

		expect(sampleCurveExpression(expression, 4, [0, 24])?.domain).toEqual([10, 20]);
	});
});
