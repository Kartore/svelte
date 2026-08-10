import type { Component } from 'svelte';
import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

import type { StoredFont } from '#lib/stores/fonts';
import type { SpriteIcons } from '#lib/stores/spriteIcons';

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
	listRevisions: (options: {
		page: number;
		perPage?: number;
		/** 対応する provider は当該レイヤーを触った revision のみに絞る */
		scope?: { layerId: string };
	}) => Promise<StyleHistoryPage>;
	loadStyleAtRevision: (revisionId: string) => Promise<StyleSpecification>;
	/** 分割形式のみ。null はその revision にレイヤーが存在しないことを表す */
	loadLayerAtRevision?: (revisionId: string, layerId: string) => Promise<LayerSpecification | null>;
};

export type SaveProvider = {
	/** getter で実装し、リアクティブに評価できるようにする */
	readonly available: boolean;
	save: () => void | Promise<void>;
};

export type NewStyleHandler = () => void;

/** 外部ソースからエディタへ読み込むプロジェクト。省略した資産種別は現在値を保持する。 */
export type EditorProject = {
	style: StyleSpecification;
	assets?: {
		icons?: SpriteIcons;
		fonts?: Record<string, StoredFont>;
	};
};

export type EditorApi = {
	/** ホストアプリの package version。パック manifest など外部出力の生成元バージョン */
	readonly appVersion: string;
	/** store.mapStyle を返す。$derived / $effect 内で呼べばリアクティブに追跡される */
	getStyle: () => StyleSpecification;
	setStyle: (style: StyleSpecification) => void;
	/** 外部プロジェクトを読み込む。指定された資産はアップロード済みローカル資産として全置換する。 */
	loadProject: (project: EditorProject) => Promise<void>;
	/** ローカル sprite 元 SVG の現在値を返す */
	getSpriteIcons: () => SpriteIcons;
	/** ローカル sprite 元 SVG をマージせず全置換する */
	replaceSpriteIcons: (icons: SpriteIcons) => Promise<void>;
	/** 登録済みローカルフォントを bytes 込みですべて返す */
	getStoredFonts: () => Promise<Record<string, StoredFont>>;
	/** 登録済みローカルフォントをマージせず全置換する */
	replaceStoredFonts: (fonts: Record<string, StoredFont>) => Promise<void>;
	setPreview: (preview: EditorPreview | null) => void;
	getPreview: () => EditorPreview | null;
	/** アダプタが履歴プロバイダを登録する */
	registerStyleHistoryProvider: (provider: StyleHistoryProvider) => void;
	/** アダプタが保存プロバイダを登録する */
	registerSaveProvider: (provider: SaveProvider) => void;
	/** 新規スタイル作成時に、現在のファイル等との接続を解除するハンドラを登録する */
	registerNewStyleHandler: (handler: NewStyleHandler) => void;
	/** アダプタが登録した Rail 項目の SecondColumn を開く */
	openRailItem: (moduleId: string, railItemId: string) => void;
};

export type EditorModulePage = {
	/** URL は `/${module.id}/${path}` になる (モジュール id で自動的に名前空間化) */
	path: string;
	component: Component;
};

export type EditorMenuId = 'file' | 'edit' | 'view';

export type EditorRailPlacement = 'main' | 'bottom';

export type EditorModuleRailItem = {
	/** module id 内で一意な識別子。ホストが module id と組み合わせて名前空間化する */
	id: string;
	label: string;
	/** Rail に表示する Phosphor アイコン */
	icon: Component;
	/** 項目の選択時に SecondColumn としてマウントされるコンポーネント */
	secondColumn: Component;
	/** bottom は設定ボタンの直前、それ以外は組み込み編集モードの後ろに表示する */
	placement?: EditorRailPlacement;
};

// この型を変更したら、すべてのアダプタの types/host-app.d.ts も更新すること。
export type EditorModule = {
	id: string;
	/**
	 * @deprecated `menuSections` / `headerStatus` へ移行すること。File の有効なメニューセクションが
	 * 無い場合は File メニュー末尾のフォールバックセクションに描画される。
	 */
	headerAction?: Component;
	/** 各メニュー末尾に区切り線付きで差し込まれる項目群 */
	menuSections?: Partial<Record<EditorMenuId, Component>>;
	/** トップバーのファイル名表示領域に並ぶ小さな状態表示 */
	headerStatus?: Component;
	/** +page.svelte 直下にマウントされるダイアログ・オーバーレイ */
	overlays?: Component[];
	/** Rail と SecondColumn に追加する adapter 固有の編集モード */
	railItems?: EditorModuleRailItem[];
	/** エディタ外のスタンドアロンページ (diff ビューア等)。setup は呼ばれない */
	pages?: EditorModulePage[];
	/** 起動時フック。返り値は setContext(`module:${id}`) で配られる */
	setup?: (editor: EditorApi) => unknown;
};
