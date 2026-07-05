import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isDowncaseExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'downcase';
};
