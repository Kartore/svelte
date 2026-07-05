import type maplibregl from 'maplibre-gl';
import { getContext, setContext } from 'svelte';

export class BackgroundMapContext {
	map = $state<maplibregl.Map | null>(null);
	zoom = $state<number | undefined>(undefined);
	pitch = $state(0);
	bearing = $state(0);
}

const KEY = Symbol('background-map');

export const provideBackgroundMap = (): BackgroundMapContext =>
	setContext(KEY, new BackgroundMapContext());

export const useBackgroundMap = (): BackgroundMapContext => getContext(KEY);
