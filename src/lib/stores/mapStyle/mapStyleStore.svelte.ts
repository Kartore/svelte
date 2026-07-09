import type { StyleSpecification } from 'maplibre-gl';

import type { MapStyleStoreAdapter } from './MapStyleStoreAdapter.ts';

export type MapStyleStoreOptions = {
	adapter: MapStyleStoreAdapter;
	initialStyle: StyleSpecification;
};

export type SetMapStyleAction =
	StyleSpecification | ((current: StyleSpecification) => StyleSpecification);

const MAX_HISTORY = 100;
const COALESCE_MS = 500;

export class MapStyleStore {
	#adapter: MapStyleStoreAdapter;
	#past = $state<StyleSpecification[]>([]);
	#future = $state<StyleSpecification[]>([]);
	#lastPushAt = 0;

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

	get canUndo() {
		return this.#past.length > 0;
	}

	get canRedo() {
		return this.#future.length > 0;
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
		const historyEntry = structuredClone(currentStyle);
		const nextStyle = typeof value === 'function' ? value(currentStyle) : value;

		const now = performance.now();
		if (now - this.#lastPushAt > COALESCE_MS) {
			this.#past = [...this.#past.slice(-(MAX_HISTORY - 1)), historyEntry];
		}
		this.#lastPushAt = now;
		this.#future = [];

		this.mapStyle = nextStyle;
		void this.#save($state.snapshot(this.mapStyle as object) as StyleSpecification);
	};

	undo = () => {
		const previous = this.#past.at(-1);
		if (!previous) return;
		const currentStyle = $state.snapshot(this.mapStyle as object) as StyleSpecification;
		this.#past = this.#past.slice(0, -1);
		this.#future = [...this.#future, currentStyle];
		this.#lastPushAt = 0;
		this.mapStyle = previous;
		void this.#save($state.snapshot(this.mapStyle as object) as StyleSpecification);
	};

	redo = () => {
		const next = this.#future.at(-1);
		if (!next) return;
		const currentStyle = $state.snapshot(this.mapStyle as object) as StyleSpecification;
		this.#future = this.#future.slice(0, -1);
		this.#past = [...this.#past.slice(-(MAX_HISTORY - 1)), currentStyle];
		this.#lastPushAt = 0;
		this.mapStyle = next;
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
