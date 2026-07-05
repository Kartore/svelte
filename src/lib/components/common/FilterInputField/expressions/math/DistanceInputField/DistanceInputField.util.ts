import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isDistanceExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'distance';
};
