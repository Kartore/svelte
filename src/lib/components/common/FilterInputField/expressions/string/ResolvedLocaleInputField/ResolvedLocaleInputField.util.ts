import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isResolvedLocaleExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'resolved-locale';
};
