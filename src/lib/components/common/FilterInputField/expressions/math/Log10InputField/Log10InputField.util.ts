import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isLog10ExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'log10';
};
