import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isCosExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'cos';
};
