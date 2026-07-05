import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isIndexOfExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'index-of';
};
