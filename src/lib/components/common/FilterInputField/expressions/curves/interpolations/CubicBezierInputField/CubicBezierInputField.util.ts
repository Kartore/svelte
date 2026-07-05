import type { InterpolationSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isCubicBezierInterpolationSpecification = (input: InterpolationSpecification) => {
	return Array.isArray(input) && input[0] === 'cubic-bezier';
};
