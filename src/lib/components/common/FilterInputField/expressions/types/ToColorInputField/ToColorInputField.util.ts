import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isToColorExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'to-color';
};
