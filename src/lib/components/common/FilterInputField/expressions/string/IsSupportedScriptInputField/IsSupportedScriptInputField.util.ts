import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isIsSupportedScriptExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'is-supported-script';
};
