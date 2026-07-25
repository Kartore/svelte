import type { StyleSpecification } from 'maplibre-gl';

import type { StoredFont } from '$lib/stores/fonts';
import type { SpriteIcons } from '$lib/stores/spriteIcons';

import { parseStyleJSON } from './styleImport.ts';
import {
	allocateSanitizedBasename,
	assembleStyle,
	SPLIT_STYLE_LAYERS_DIRECTORY,
	SPLIT_STYLE_LAYERS_FILE,
	SPLIT_STYLE_ROOT_FILE,
	SPLIT_STYLE_SOURCES_FILE,
	splitStyle
} from './styleSplit.ts';
import { serializeStyle, serializeStyleAuxiliary } from './styleSerialize.ts';

export type StylePackAssets = {
	icons: SpriteIcons;
	fonts: Record<string, StoredFont>;
};

export type StylePackFiles = Record<string, string | Uint8Array>;

type StylePackMeta = {
	appVersion: string;
	createdAt: string;
};

type SpriteIndex = {
	version: 1;
	icons: Record<string, string>;
};

type FontIndexEntry = {
	file: string;
	familyName: string;
	styleName: string;
	addedAt: number;
};

type FontIndex = {
	version: 1;
	fonts: Record<string, FontIndexEntry>;
};

const FORMAT_VERSION = 1;
const MANIFEST_FILE = 'manifest.json';
const STYLE_DIRECTORY = 'style';
const SPRITE_INDEX_FILE = 'assets/sprites.json';
const SPRITE_DIRECTORY = 'assets/sprites';
const FONT_INDEX_FILE = 'assets/fonts.json';
const FONT_DIRECTORY = 'assets/fonts';

const compareKeys = (left: string, right: string): number =>
	left < right ? -1 : left > right ? 1 : 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const packPath = (...parts: string[]): string => parts.join('/').normalize('NFC');

const normalizePackFiles = (
	files: Readonly<StylePackFiles>
): Readonly<Record<string, string | Uint8Array>> => {
	const normalized: StylePackFiles = {};
	for (const [path, value] of Object.entries(files)) {
		if (
			path.length === 0 ||
			path.startsWith('/') ||
			path.includes('\\') ||
			path.split('/').some((part) => part === '' || part === '.' || part === '..')
		) {
			throw new Error(`Invalid style pack path: ${path}`);
		}
		const normalizedPath = path.normalize('NFC');
		if (normalizedPath in normalized) {
			throw new Error(`Duplicate style pack path after NFC normalization: ${normalizedPath}`);
		}
		normalized[normalizedPath] = value;
	}
	return normalized;
};

const readTextFile = (
	files: Readonly<Record<string, string | Uint8Array>>,
	path: string
): string => {
	const value = files[path];
	if (value === undefined) throw new Error(`Style pack file is missing: ${path}`);
	if (typeof value === 'string') return value;
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(value);
	} catch (error) {
		throw new Error(
			`Style pack text file is not valid UTF-8: ${path}: ${
				error instanceof Error ? error.message : String(error)
			}`,
			{ cause: error }
		);
	}
};

const readJsonFile = (
	files: Readonly<Record<string, string | Uint8Array>>,
	path: string
): unknown => {
	try {
		return JSON.parse(readTextFile(files, path)) as unknown;
	} catch (error) {
		if (error instanceof Error && error.message.startsWith('Style pack')) throw error;
		throw new Error(
			`Invalid JSON in style pack file ${path}: ${
				error instanceof Error ? error.message : String(error)
			}`,
			{ cause: error }
		);
	}
};

const requireIndexFileName = (value: unknown, indexPath: string): string => {
	if (
		typeof value !== 'string' ||
		value.length === 0 ||
		value.startsWith('.') ||
		value.includes('/') ||
		value.includes('\\')
	) {
		throw new Error(`Invalid file reference in ${indexPath}.`);
	}
	return value.normalize('NFC');
};

const isLayerBasename = (value: unknown): value is string =>
	typeof value === 'string' &&
	value.length > 0 &&
	value.endsWith('.json') &&
	!value.startsWith('.') &&
	!value.includes('/') &&
	!value.includes('\\');

const copiedArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	return copy.buffer;
};

const fontExtension = (bytes: Uint8Array): '.otf' | '.ttf' | '.bin' => {
	if (
		bytes.byteLength >= 4 &&
		bytes[0] === 0x4f &&
		bytes[1] === 0x54 &&
		bytes[2] === 0x54 &&
		bytes[3] === 0x4f
	) {
		return '.otf';
	}
	if (
		bytes.byteLength >= 4 &&
		bytes[0] === 0x00 &&
		bytes[1] === 0x01 &&
		bytes[2] === 0x00 &&
		bytes[3] === 0x00
	) {
		return '.ttf';
	}
	return '.bin';
};

/** プロジェクト状態を zip 化前の決定的なファイルマップへ変換する。 */
export const createStylePack = (
	style: StyleSpecification,
	assets: StylePackAssets,
	meta: StylePackMeta
): StylePackFiles => {
	const files: StylePackFiles = {};
	files[MANIFEST_FILE] = serializeStyleAuxiliary({
		formatVersion: FORMAT_VERSION,
		appVersion: meta.appVersion,
		createdAt: meta.createdAt
	});

	const split = splitStyle(style);
	for (const [path, content] of Object.entries(split.files)) {
		files[packPath(STYLE_DIRECTORY, path)] = content;
	}

	const spriteFiles = new Set<string>();
	const spriteIndex: SpriteIndex = { version: 1, icons: {} };
	for (const name of Object.keys(assets.icons).sort(compareKeys)) {
		const file = allocateSanitizedBasename(name, '.svg', spriteFiles);
		spriteIndex.icons[name] = file;
		files[packPath(SPRITE_DIRECTORY, file)] = assets.icons[name];
	}
	files[SPRITE_INDEX_FILE] = serializeStyleAuxiliary(spriteIndex);

	const fontFiles = new Set<string>();
	const fontIndex: FontIndex = { version: 1, fonts: {} };
	for (const name of Object.keys(assets.fonts).sort(compareKeys)) {
		const font = assets.fonts[name];
		const bytes = new Uint8Array(font.bytes);
		const file = allocateSanitizedBasename(name, fontExtension(bytes), fontFiles);
		fontIndex.fonts[name] = {
			file,
			familyName: font.familyName,
			styleName: font.styleName,
			addedAt: font.addedAt
		};
		files[packPath(FONT_DIRECTORY, file)] = bytes.slice();
	}
	files[FONT_INDEX_FILE] = serializeStyleAuxiliary(fontIndex);

	return files;
};

const readManifest = (
	files: Readonly<Record<string, string | Uint8Array>>
): { formatVersion: 1; appVersion: string; createdAt: string } => {
	const manifest = readJsonFile(files, MANIFEST_FILE);
	if (
		!isRecord(manifest) ||
		typeof manifest.formatVersion !== 'number' ||
		typeof manifest.appVersion !== 'string' ||
		typeof manifest.createdAt !== 'string'
	) {
		throw new Error('Invalid manifest.json in style pack.');
	}
	if (manifest.formatVersion > FORMAT_VERSION) {
		throw new Error('This style pack was created by a newer version of Kartore.');
	}
	if (manifest.formatVersion !== FORMAT_VERSION) {
		throw new Error(`Unsupported style pack formatVersion: ${manifest.formatVersion}`);
	}
	return manifest as { formatVersion: 1; appVersion: string; createdAt: string };
};

const readSpriteIndex = (
	files: Readonly<Record<string, string | Uint8Array>>,
	expectedPaths: Set<string>
): SpriteIcons => {
	const index = readJsonFile(files, SPRITE_INDEX_FILE);
	if (!isRecord(index) || index.version !== 1 || !isRecord(index.icons)) {
		throw new Error('Invalid assets/sprites.json in style pack.');
	}

	const icons: SpriteIcons = {};
	for (const name of Object.keys(index.icons).sort(compareKeys)) {
		const file = requireIndexFileName(index.icons[name], SPRITE_INDEX_FILE);
		const path = packPath(SPRITE_DIRECTORY, file);
		expectedPaths.add(path);
		icons[name] = readTextFile(files, path);
	}
	return icons;
};

const readFontIndex = (
	files: Readonly<Record<string, string | Uint8Array>>,
	expectedPaths: Set<string>
): Record<string, StoredFont> => {
	const index = readJsonFile(files, FONT_INDEX_FILE);
	if (!isRecord(index) || index.version !== 1 || !isRecord(index.fonts)) {
		throw new Error('Invalid assets/fonts.json in style pack.');
	}

	const fonts: Record<string, StoredFont> = {};
	for (const name of Object.keys(index.fonts).sort(compareKeys)) {
		const metadata = index.fonts[name];
		if (
			!isRecord(metadata) ||
			typeof metadata.familyName !== 'string' ||
			typeof metadata.styleName !== 'string' ||
			typeof metadata.addedAt !== 'number' ||
			!Number.isFinite(metadata.addedAt)
		) {
			throw new Error(`Invalid font metadata for "${name}" in ${FONT_INDEX_FILE}.`);
		}
		const file = requireIndexFileName(metadata.file, FONT_INDEX_FILE);
		const path = packPath(FONT_DIRECTORY, file);
		expectedPaths.add(path);
		const bytes = files[path];
		if (bytes === undefined) throw new Error(`Style pack file is missing: ${path}`);
		if (!(bytes instanceof Uint8Array)) {
			throw new Error(`Style pack font file must be binary: ${path}`);
		}
		fonts[name] = {
			familyName: metadata.familyName,
			styleName: metadata.styleName,
			addedAt: metadata.addedAt,
			bytes: copiedArrayBuffer(bytes)
		};
	}
	return fonts;
};

/** ファイルマップからプロジェクト状態を復元する。検証エラーは throw する。 */
export const readStylePack = (
	inputFiles: StylePackFiles
): { style: StyleSpecification; assets: StylePackAssets; warnings: string[] } => {
	const files = normalizePackFiles(inputFiles);
	readManifest(files);

	const expectedPaths = new Set<string>([
		MANIFEST_FILE,
		packPath(STYLE_DIRECTORY, SPLIT_STYLE_ROOT_FILE),
		packPath(STYLE_DIRECTORY, SPLIT_STYLE_SOURCES_FILE),
		packPath(STYLE_DIRECTORY, SPLIT_STYLE_LAYERS_FILE),
		SPRITE_INDEX_FILE,
		FONT_INDEX_FILE
	]);
	const styleFiles: Record<string, string> = {
		[SPLIT_STYLE_ROOT_FILE]: readTextFile(files, packPath(STYLE_DIRECTORY, SPLIT_STYLE_ROOT_FILE)),
		[SPLIT_STYLE_SOURCES_FILE]: readTextFile(
			files,
			packPath(STYLE_DIRECTORY, SPLIT_STYLE_SOURCES_FILE)
		),
		[SPLIT_STYLE_LAYERS_FILE]: readTextFile(
			files,
			packPath(STYLE_DIRECTORY, SPLIT_STYLE_LAYERS_FILE)
		)
	};
	const layerManifest = readJsonFile(files, packPath(STYLE_DIRECTORY, SPLIT_STYLE_LAYERS_FILE));
	if (Array.isArray(layerManifest)) {
		for (const basename of layerManifest) {
			if (!isLayerBasename(basename)) continue;
			const relativePath = packPath(SPLIT_STYLE_LAYERS_DIRECTORY, basename);
			styleFiles[relativePath] = readTextFile(files, packPath(STYLE_DIRECTORY, relativePath));
		}
	}
	for (const path of Object.keys(files).sort(compareKeys)) {
		if (!path.startsWith(`${STYLE_DIRECTORY}/${SPLIT_STYLE_LAYERS_DIRECTORY}/`)) continue;
		const relativePath = path.slice(STYLE_DIRECTORY.length + 1);
		if (!(relativePath in styleFiles)) styleFiles[relativePath] = '';
		expectedPaths.add(path);
	}

	const assembled = assembleStyle(styleFiles);
	const parsed = parseStyleJSON(serializeStyle(assembled.style));
	if (!parsed.ok) throw new Error(`Invalid style in style pack: ${parsed.error}`);

	const icons = readSpriteIndex(files, expectedPaths);
	const fonts = readFontIndex(files, expectedPaths);
	const extraWarnings = Object.keys(files)
		.filter((path) => !expectedPaths.has(path))
		.sort(compareKeys)
		.map((path) => `Ignoring extra style pack file: ${path}`);

	return {
		style: parsed.style,
		assets: { icons, fonts },
		warnings: [...assembled.warnings, ...parsed.warnings, ...extraWarnings]
	};
};
