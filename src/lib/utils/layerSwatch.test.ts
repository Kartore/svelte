import type { ExpressionSpecification, LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import { sampleCurveExpression } from '$lib/components/common/FilterInputField/expressions/utils/curveSampling.ts';

import { resolveLayerSwatchColor } from './layerSwatch.ts';

const paintedLayer = (
	type: LayerSpecification['type'],
	property: string,
	value: unknown
): LayerSpecification =>
	({
		id: `${type}-layer`,
		type,
		paint: { [property]: value }
	}) as LayerSpecification;

describe('resolveLayerSwatchColor', () => {
	it.each([
		['fill', 'fill-color'],
		['line', 'line-color'],
		['symbol', 'text-color'],
		['circle', 'circle-color'],
		['fill-extrusion', 'fill-extrusion-color'],
		['background', 'background-color']
	] as const)('reads the representative %s paint property', (type, property) => {
		expect(resolveLayerSwatchColor(paintedLayer(type, property, '#123456'))).toBe('#123456');
	});

	it('uses the middle sample of a color curve', () => {
		const expression = [
			'interpolate',
			['linear'],
			['zoom'],
			0,
			'#000000',
			24,
			'#ffffff'
		] as ExpressionSpecification;
		const sampling = sampleCurveExpression(expression);
		const expected = sampling?.samples[Math.floor(sampling.samples.length / 2)].output;

		expect(resolveLayerSwatchColor(paintedLayer('fill', 'fill-color', expression))).toBe(expected);
		expect(expected).not.toBe('#000000');
		expect(expected).not.toBe('#ffffff');
	});

	it.each(['heatmap', 'raster', 'hillshade', 'color-relief'] as const)(
		'keeps the type icon for %s layers',
		(type) => {
			expect(resolveLayerSwatchColor(paintedLayer(type, 'fill-color', '#123456'))).toBeUndefined();
		}
	);

	it('keeps the type icon for unsupported expressions and missing colors', () => {
		expect(
			resolveLayerSwatchColor(
				paintedLayer('fill', 'fill-color', ['case', true, '#000000', '#ffffff'])
			)
		).toBeUndefined();
		expect(resolveLayerSwatchColor(paintedLayer('fill', 'fill-opacity', 0.5))).toBeUndefined();
	});
});
