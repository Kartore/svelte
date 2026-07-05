import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isObjectExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'object';
};
