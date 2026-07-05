import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isLineProgressExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'line-progress';
};
