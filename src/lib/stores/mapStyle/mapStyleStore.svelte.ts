import type { StyleSpecification } from 'maplibre-gl';

import type { MapStyleStoreAdapter } from './MapStyleStoreAdapter.ts';

export type MapStyleStoreOptions = {
	adapter: MapStyleStoreAdapter;
	initialStyle: StyleSpecification;
};

export type SetMapStyleAction =
	StyleSpecification | ((current: StyleSpecification) => StyleSpecification);

export class MapStyleStore {
	#adapter: MapStyleStoreAdapter;

	mapStyle = $state() as StyleSpecification;
	isLoading = $state(true);
	isSaving = $state(false);
	loadError = $state<Error | null>(null);
	saveError = $state<Error | null>(null);

	constructor({ adapter, initialStyle }: MapStyleStoreOptions) {
		this.#adapter = adapter;
		this.mapStyle = initialStyle;
		void this.#load(initialStyle);
	}

	async #load(initialStyle: StyleSpecification) {
		try {
			const loadedStyle = await this.#adapter.load();
			this.mapStyle = loadedStyle ?? initialStyle;
		} catch (error) {
			this.loadError = error instanceof Error ? error : new Error(String(error));
		} finally {
			this.isLoading = false;
		}
	}

	setMapStyle = (value: SetMapStyleAction) => {
		// StyleSpecification は再帰 union のため Snapshot<T> の型展開を避けて widening する
		const currentStyle = $state.snapshot(this.mapStyle as object) as StyleSpecification;
		const nextStyle = typeof value === 'function' ? value(currentStyle) : value;
		this.mapStyle = nextStyle;
		void this.#save($state.snapshot(this.mapStyle as object) as StyleSpecification);
	};

	async #save(style: StyleSpecification) {
		this.isSaving = true;
		this.saveError = null;
		try {
			await this.#adapter.save(style);
		} catch (error) {
			this.saveError = error instanceof Error ? error : new Error(String(error));
		} finally {
			this.isSaving = false;
		}
	}
}
