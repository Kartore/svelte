import type maplibregl from 'maplibre-gl';
import { getContext, setContext } from 'svelte';

import type { FilterHighlightRequest } from '#lib/utils/filterHighlight.ts';

export class BackgroundMapContext {
	map = $state<maplibregl.Map | null>(null);
	zoom = $state<number | undefined>(undefined);
	longitude = $state(139.767);
	latitude = $state(35.681);
	pitch = $state(0);
	bearing = $state(0);
	filterHighlight = $state.raw<FilterHighlightRequest | null>(null);
}

const KEY = Symbol('background-map');

export const provideBackgroundMap = (): BackgroundMapContext =>
	setContext(KEY, new BackgroundMapContext());

export const useBackgroundMap = (): BackgroundMapContext => getContext(KEY);
