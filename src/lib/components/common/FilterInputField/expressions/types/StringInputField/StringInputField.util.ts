import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isStringExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'string';
};
