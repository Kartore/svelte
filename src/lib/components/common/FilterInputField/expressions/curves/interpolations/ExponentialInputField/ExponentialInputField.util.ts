import type { InterpolationSpecification } from '@maplibre/maplibre-gl-style-spec';

export const isExponentialInterpolationSpecification = (input: InterpolationSpecification) => {
	return Array.isArray(input) && input[0] === 'exponential';
};
