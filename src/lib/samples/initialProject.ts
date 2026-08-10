import initialProjectUrl from './initial.kartore?url';

import type { EditorProject } from '#lib/editor/EditorModule.ts';
import { readStylePack } from '#lib/utils/stylePack.ts';
import { readStylePackArchive } from '#lib/utils/stylePackArchive.ts';

/** 同梱した initial.kartore を通常のスタイルパックと同じ経路で読み込む。 */
export const loadInitialProject = async (request: typeof fetch = fetch): Promise<EditorProject> => {
	const response = await request(initialProjectUrl);
	if (!response.ok) {
		throw new Error(`initial.kartore could not be loaded (${response.status}).`);
	}
	const opened = readStylePack(readStylePackArchive(new Uint8Array(await response.arrayBuffer())));
	if (opened.warnings.length > 0) {
		throw new Error(`initial.kartore is invalid: ${opened.warnings.join(' ')}`);
	}
	return { style: opened.style, assets: opened.assets };
};
