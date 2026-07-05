import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isGreaterThanOrEqualExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === '>=';
};
