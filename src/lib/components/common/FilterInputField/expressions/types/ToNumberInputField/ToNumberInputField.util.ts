import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isToNumberExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'to-number';
};
