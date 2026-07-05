import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isMaxExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'max';
};
