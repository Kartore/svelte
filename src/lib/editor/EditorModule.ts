import type { Component } from 'svelte';
import type { StyleSpecification } from 'maplibre-gl';

export type EditorPreview = {
	style: StyleSpecification;
	label: string;
};

/** スタイルファイルの 1 リビジョン (アダプタ側では git コミット等に対応) */
export type StyleHistoryRevision = {
	/** リビジョン識別子 (コミット SHA 等)。loadStyleAtRevision に渡す */
	id: string;
	/** コミットメッセージ等の説明文 (全文)。表示側で 1 行目に切る */
	message: string;
	authorName: string;
	/** 外部アカウントを解決できた場合のみ */
	authorLogin?: string;
	avatarUrl?: string;
	/** ISO 8601 */
	authoredAt: string;
	/** リビジョンの外部ページ */
	htmlUrl?: string;
};

export type StyleHistoryPage = {
	revisions: StyleHistoryRevision[];
	hasNext: boolean;
};

export type StyleHistoryProvider = {
	/** getter で実装し、リアクティブに評価できるようにする */
	readonly available: boolean;
	/** 履歴の対象を表すラベル。available=false なら null */
	readonly label: string | null;
	/** 新しい順。page は 1 始まり */
	listRevisions: (options: { page: number; perPage?: number }) => Promise<StyleHistoryPage>;
	loadStyleAtRevision: (revisionId: string) => Promise<StyleSpecification>;
};

export type EditorApi = {
	/** store.mapStyle を返す。$derived / $effect 内で呼べばリアクティブに追跡される */
	getStyle: () => StyleSpecification;
	setStyle: (style: StyleSpecification) => void;
	setPreview: (preview: EditorPreview | null) => void;
	getPreview: () => EditorPreview | null;
	/** アダプタが履歴プロバイダを登録する */
	registerStyleHistoryProvider: (provider: StyleHistoryProvider) => void;
};

export type EditorModulePage = {
	/** URL は `/${module.id}/${path}` になる (モジュール id で自動的に名前空間化) */
	path: string;
	component: Component;
};

// この型を変更したら、すべてのアダプタの types/host-app.d.ts も更新すること。
export type EditorModule = {
	id: string;
	/**
	 * @deprecated `menuSection` / `headerStatus` へ移行すること。`menuSection` が無い場合は
	 * File メニュー末尾のフォールバックセクションに描画される。
	 */
	headerAction?: Component;
	/** File メニューに差し込まれる項目群 */
	menuSection?: Component;
	/** NavigationPanel のメニュー行右端に並ぶ小さな状態表示 */
	headerStatus?: Component;
	/** +page.svelte 直下にマウントされるダイアログ・オーバーレイ */
	overlays?: Component[];
	/** エディタ外のスタンドアロンページ (diff ビューア等)。setup は呼ばれない */
	pages?: EditorModulePage[];
	/** 起動時フック。返り値は setContext(`module:${id}`) で配られる */
	setup?: (editor: EditorApi) => unknown;
};
