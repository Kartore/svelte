import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isInterpolateHclExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'interpolate-hcl';
};
