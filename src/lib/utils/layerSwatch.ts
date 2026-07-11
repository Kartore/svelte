import type { ExpressionSpecification, LayerSpecification } from '@maplibre/maplibre-gl-style-spec';

import { sampleCurveExpression } from '$lib/components/common/FilterInputField/expressions/utils/curveSampling.ts';

const swatchProperty = (layer: LayerSpecification): string | undefined => {
	switch (layer.type) {
		case 'fill':
			return 'fill-color';
		case 'line':
			return 'line-color';
		case 'symbol':
			return 'text-color';
		case 'circle':
			return 'circle-color';
		case 'fill-extrusion':
			return 'fill-extrusion-color';
		case 'background':
			return 'background-color';
		default:
			return undefined;
	}
};

/** レイヤー一覧の 11px スウォッチに使う代表色を解決する。 */
export const resolveLayerSwatchColor = (layer: LayerSpecification): string | undefined => {
	const property = swatchProperty(layer);
	if (property === undefined) return undefined;

	const value = (layer.paint as Record<string, unknown> | undefined)?.[property];
	if (typeof value === 'string') return value;
	if (!Array.isArray(value)) return undefined;

	const sampling = sampleCurveExpression(value as ExpressionSpecification);
	if (sampling?.outputType !== 'color' || sampling.samples.length === 0) return undefined;
	const middleSample = sampling.samples[Math.floor(sampling.samples.length / 2)];
	return typeof middleSample.output === 'string' ? middleSample.output : undefined;
};
