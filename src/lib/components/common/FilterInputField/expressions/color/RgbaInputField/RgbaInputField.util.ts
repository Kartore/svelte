import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isRgbaExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'rgba';
};
