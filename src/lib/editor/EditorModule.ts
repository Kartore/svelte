import type { Component } from 'svelte';
import type { StyleSpecification } from 'maplibre-gl';

export type EditorPreview = {
	style: StyleSpecification;
	label: string;
};

export type EditorApi = {
	/** store.mapStyle を返す。$derived / $effect 内で呼べばリアクティブに追跡される */
	getStyle: () => StyleSpecification;
	setStyle: (style: StyleSpecification) => void;
	setPreview: (preview: EditorPreview | null) => void;
	getPreview: () => EditorPreview | null;
};

export type EditorModulePage = {
	/** URL は `/${module.id}/${path}` になる (モジュール id で自動的に名前空間化) */
	path: string;
	component: Component;
};

// この型を変更したら、すべてのアダプタの types/host-app.d.ts も更新すること。
export type EditorModule = {
	id: string;
	/** NavigationPanel ヘッダー右端 (Import ボタンの隣) に並ぶボタン */
	headerAction?: Component;
	/** +page.svelte 直下にマウントされるダイアログ・オーバーレイ */
	overlays?: Component[];
	/** エディタ外のスタンドアロンページ (diff ビューア等)。setup は呼ばれない */
	pages?: EditorModulePage[];
	/** 起動時フック。返り値は setContext(`module:${id}`) で配られる */
	setup?: (editor: EditorApi) => unknown;
};
