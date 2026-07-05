import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isGeometryTypeExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'geometry-type';
};
