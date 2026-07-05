import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isPiExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'pi';
};
