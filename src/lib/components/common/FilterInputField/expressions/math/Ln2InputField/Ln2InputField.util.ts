import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isLn2ExpressionSpecification = (input: ExpressionSpecification) => {
	return Array.isArray(input) && input[0] === 'ln2';
};
