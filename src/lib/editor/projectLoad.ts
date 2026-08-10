import type { StyleSpecification } from 'maplibre-gl';

import type { StoredFont } from '#lib/stores/fonts';
import type { SpriteIcons } from '#lib/stores/spriteIcons';

import type { EditorProject } from './EditorModule.ts';

export type EditorProjectTarget = {
	replaceStyle: (style: StyleSpecification) => void;
	replaceSpriteIcons: (icons: SpriteIcons) => Promise<void>;
	replaceStoredFonts: (fonts: Record<string, StoredFont>) => Promise<void>;
};

/**
 * 外部プロジェクトをローカル編集状態へ反映する。
 * 資産を先に永続化し、すべて成功した後でスタイルを切り替える。
 */
export const applyProjectLoad = async (
	target: EditorProjectTarget,
	project: EditorProject
): Promise<void> => {
	if (project.assets?.icons !== undefined) {
		await target.replaceSpriteIcons(project.assets.icons);
	}
	if (project.assets?.fonts !== undefined) {
		await target.replaceStoredFonts(project.assets.fonts);
	}
	target.replaceStyle(project.style);
};
