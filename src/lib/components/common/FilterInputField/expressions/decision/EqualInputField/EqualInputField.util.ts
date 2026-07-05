import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isEqualExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === '==';
};
