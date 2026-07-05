import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isFloorExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'floor';
};
