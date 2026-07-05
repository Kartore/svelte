import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isConcatExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'concat';
};
