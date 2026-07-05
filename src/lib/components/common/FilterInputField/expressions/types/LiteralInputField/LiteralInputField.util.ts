import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isLiteralExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'literal';
};
