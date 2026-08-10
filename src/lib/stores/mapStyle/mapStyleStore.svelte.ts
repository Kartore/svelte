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
	#saveTimer: ReturnType<typeof setTimeout> | null = null;
	#transientBase: StyleSpecification | null = null;

	mapStyle = $state() as StyleSpecification;
	isLoading = $state(true);
	isSaving = $state(false);
	loadError = $state<Error | null>(null);
	saveError = $state<Error | null>(null);
	/** adapter に保存済みスタイルがなく、初期プロジェクトの復元が必要か。 */
	needsInitialProject = true;
	/** 初回ロードが成功・失敗のどちらかで完了した時点で解決する。 */
	readonly ready: Promise<void>;

	constructor({ adapter, initialStyle }: MapStyleStoreOptions) {
		this.#adapter = adapter;
		this.mapStyle = initialStyle;
		this.ready = this.#load(initialStyle);
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
			this.needsInitialProject = loadedStyle === null;
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
		const historyBase = this.#transientBase ?? currentStyle;
		const hadTransientUpdate = this.#transientBase !== null;
		this.#transientBase = null;

		const now = performance.now();
		if (hadTransientUpdate || now - this.#lastPushAt > COALESCE_MS) {
			// updater は currentStyle を破壊的に変更できるため、実行前に履歴を clone する
			this.#past = [...this.#past.slice(-(MAX_HISTORY - 1)), structuredClone(historyBase)];
		}
		this.#lastPushAt = now;
		this.#future = [];

		const nextStyle = typeof value === 'function' ? value(currentStyle) : value;
		this.mapStyle = nextStyle;
		this.#scheduleSave();
	};

	/** 外部プロジェクトの style で置換し、以前のプロジェクトに属する undo 履歴を破棄する。 */
	replaceMapStyle = (style: StyleSpecification) => {
		this.#transientBase = null;
		this.#past = [];
		this.#future = [];
		this.#lastPushAt = 0;
		this.needsInitialProject = false;
		this.mapStyle = style;
		this.#scheduleSave();
	};

	/**
	 * 地図へ即時反映するが、履歴と永続化は更新しない。
	 * 最初の一時更新時点を保持し、commitStyle で 1 履歴エントリとして確定する。
	 */
	setStyleTransient = (value: SetMapStyleAction) => {
		const currentStyle = $state.snapshot(this.mapStyle as object) as StyleSpecification;
		this.#transientBase ??= structuredClone(currentStyle);
		this.mapStyle = typeof value === 'function' ? value(currentStyle) : value;
	};

	/** 一連の一時更新を 1 回の undo で戻せる変更として確定する。 */
	commitStyle = (value?: SetMapStyleAction) => {
		if (this.#transientBase === null) {
			if (value !== undefined) this.setMapStyle(value);
			return;
		}

		if (value !== undefined) {
			const currentStyle = $state.snapshot(this.mapStyle as object) as StyleSpecification;
			this.mapStyle = typeof value === 'function' ? value(currentStyle) : value;
		}

		const base = this.#transientBase;
		this.#transientBase = null;
		const currentStyle = $state.snapshot(this.mapStyle as object) as StyleSpecification;
		if (JSON.stringify(base) === JSON.stringify(currentStyle)) return;
		this.#past = [...this.#past.slice(-(MAX_HISTORY - 1)), base];
		this.#future = [];
		this.#lastPushAt = performance.now();
		this.#scheduleSave();
	};

	/** 確定前の live 値を捨て、一時更新開始時点へ戻す。 */
	cancelStyleTransient = () => {
		if (this.#transientBase === null) return;
		this.mapStyle = this.#transientBase;
		this.#transientBase = null;
	};

	undo = () => {
		if (this.#transientBase !== null) {
			this.cancelStyleTransient();
			return;
		}
		const previous = this.#past.at(-1);
		if (!previous) return;
		const currentStyle = $state.snapshot(this.mapStyle as object) as StyleSpecification;
		this.#past = this.#past.slice(0, -1);
		this.#future = [...this.#future, currentStyle];
		this.#lastPushAt = 0;
		this.mapStyle = previous;
		this.#scheduleSave();
	};

	redo = () => {
		this.#transientBase = null;
		const next = this.#future.at(-1);
		if (!next) return;
		const currentStyle = $state.snapshot(this.mapStyle as object) as StyleSpecification;
		this.#future = this.#future.slice(0, -1);
		this.#past = [...this.#past.slice(-(MAX_HISTORY - 1)), currentStyle];
		this.#lastPushAt = 0;
		this.mapStyle = next;
		this.#scheduleSave();
	};

	#scheduleSave() {
		if (this.#saveTimer !== null) clearTimeout(this.#saveTimer);
		this.#saveTimer = setTimeout(() => {
			this.#saveTimer = null;
			void this.#save($state.snapshot(this.mapStyle as object) as StyleSpecification);
		}, COALESCE_MS);
	}

	flushSave = () => {
		if (this.#saveTimer === null) return;
		clearTimeout(this.#saveTimer);
		this.#saveTimer = null;
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
