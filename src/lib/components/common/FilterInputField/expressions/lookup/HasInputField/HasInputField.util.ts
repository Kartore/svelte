import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isHasExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'has';
};
