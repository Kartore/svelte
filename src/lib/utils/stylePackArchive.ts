import { strToU8, unzipSync, zipSync, type Zippable } from 'fflate';

import type { StylePackFiles } from './stylePack.ts';

const FONT_DIRECTORY_PREFIX = 'assets/fonts/';
const FIXED_ZIP_MTIME = new Date(1980, 0, 1, 0, 0, 0);

const comparePaths = (left: string, right: string): number =>
	left < right ? -1 : left > right ? 1 : 0;

const archiveBytes = (value: string | Uint8Array): Uint8Array =>
	typeof value === 'string' ? strToU8(value) : value;

/** 決定的な path 順・mtime で .kartore ファイルを生成する。 */
export const createStylePackArchive = (files: StylePackFiles): Uint8Array => {
	const archive: Zippable = {};
	for (const path of Object.keys(files).sort(comparePaths)) {
		const normalizedPath = path.normalize('NFC');
		if (normalizedPath in archive) {
			throw new Error(`Duplicate archive path after NFC normalization: ${normalizedPath}`);
		}
		archive[normalizedPath] = [
			archiveBytes(files[path]),
			{
				level: normalizedPath.startsWith(FONT_DIRECTORY_PREFIX) ? 0 : 6,
				mtime: FIXED_ZIP_MTIME
			}
		];
	}
	return zipSync(archive, { level: 6, mtime: FIXED_ZIP_MTIME });
};

/** .kartore ファイルを展開し、ディレクトリエントリを除いたファイルマップを返す。 */
export const readStylePackArchive = (bytes: Uint8Array): StylePackFiles => {
	const entries = unzipSync(bytes);
	const files: StylePackFiles = {};
	for (const path of Object.keys(entries).sort(comparePaths)) {
		if (path.endsWith('/')) continue;
		const normalizedPath = path.normalize('NFC');
		if (normalizedPath in files) {
			throw new Error(`Duplicate archive path after NFC normalization: ${normalizedPath}`);
		}
		files[normalizedPath] = entries[path];
	}
	return files;
};
