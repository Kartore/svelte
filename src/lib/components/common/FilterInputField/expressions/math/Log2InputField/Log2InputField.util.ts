import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isLog2ExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'log2';
};
