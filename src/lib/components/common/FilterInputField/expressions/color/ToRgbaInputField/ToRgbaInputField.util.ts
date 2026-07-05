import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isToRgbaExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'to-rgba';
};
