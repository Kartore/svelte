import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isFeatureStateExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'feature-state';
};
