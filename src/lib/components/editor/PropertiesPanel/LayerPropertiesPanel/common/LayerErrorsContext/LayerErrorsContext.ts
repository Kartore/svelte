import { getContext, setContext } from 'svelte';

import type { LayerValidationError } from '$lib/utils/styleValidation.ts';

export type LayerErrorsContext = {
	readonly errors: LayerValidationError[];
};

const KEY = Symbol('layer-errors');

export const provideLayerErrors = (getErrors: () => LayerValidationError[]): void => {
	setContext<LayerErrorsContext>(KEY, {
		get errors() {
			return getErrors();
		}
	});
};

export const useLayerErrors = (): LayerErrorsContext =>
	getContext<LayerErrorsContext | undefined>(KEY) ?? { errors: [] };
