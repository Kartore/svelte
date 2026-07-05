import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isAcosExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'acos';
};
