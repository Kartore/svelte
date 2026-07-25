import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

import {
	serializeStyleAuxiliary,
	serializeStyleLayer,
	serializeStyleRoot,
	serializeStyleSources
} from './styleSerialize.ts';

export const SPLIT_STYLE_ROOT_FILE = 'style.json';
export const SPLIT_STYLE_SOURCES_FILE = 'sources.json';
export const SPLIT_STYLE_LAYERS_FILE = 'layers.json';
export const SPLIT_STYLE_LAYERS_DIRECTORY = 'layers';

export type LayerFileMap = Record<string, string>;

export type StyleFileRename = {
	from: string;
	to: string;
};

export type PreviousStyleSplit = {
	style: StyleSpecification;
	layerFiles: Readonly<LayerFileMap>;
};

export type SplitStyleResult = {
	files: Record<string, string>;
	layerFiles: LayerFileMap;
	renames: StyleFileRename[];
	deletions: string[];
};

export type AssembleStyleResult = {
	style: StyleSpecification;
	warnings: string[];
};

const FORBIDDEN_BASENAME_CHARACTERS = /[\\/:*?"<>|]/g;
const compareKeys = (left: string, right: string): number =>
	left < right ? -1 : left > right ? 1 : 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const layerPath = (basename: string): string => `${SPLIT_STYLE_LAYERS_DIRECTORY}/${basename}`;

const basenameOf = (path: string): string => path.split('/').at(-1) ?? path;

export const sanitizeLayerBasename = (layerId: string): string => {
	const sanitized = layerId.replace(FORBIDDEN_BASENAME_CHARACTERS, '_').replace(/^\./, '_');
	return sanitized || 'layer';
};

const allocateBasename = (layerId: string, used: Set<string>): string => {
	const stem = sanitizeLayerBasename(layerId);
	let candidate = `${stem}.json`;
	let suffix = 2;
	while (used.has(candidate)) {
		candidate = `${stem}-${suffix}.json`;
		suffix += 1;
	}
	used.add(candidate);
	return candidate;
};

const layerFingerprint = (layer: LayerSpecification): string => {
	const withoutId = { ...layer } as Record<string, unknown>;
	Reflect.deleteProperty(withoutId, 'id');
	return serializeStyleLayer({ id: '', ...withoutId } as LayerSpecification);
};

const layerIdentitySignature = (layer: LayerSpecification): string =>
	JSON.stringify([
		layer.type,
		'source' in layer ? layer.source : undefined,
		'source-layer' in layer ? layer['source-layer'] : undefined
	]);

const inferLayerIdRenames = (
	style: StyleSpecification,
	previous: PreviousStyleSplit
): Map<string, string> => {
	const currentIds = new Set(style.layers.map((layer) => layer.id));
	const previousIds = new Set(Object.keys(previous.layerFiles));
	const oldLayers = previous.style.layers.filter(
		(layer) => previousIds.has(layer.id) && !currentIds.has(layer.id)
	);
	const newLayers = style.layers.filter((layer) => !previousIds.has(layer.id));
	const matches = new Map<string, string>();
	const unmatchedOld = new Set(oldLayers.map((layer) => layer.id));
	const unmatchedNew = new Set(newLayers.map((layer) => layer.id));

	const matchUnique = (keyOf: (layer: LayerSpecification) => string) => {
		const oldByKey = new Map<string, LayerSpecification[]>();
		const newByKey = new Map<string, LayerSpecification[]>();
		for (const layer of oldLayers) {
			if (!unmatchedOld.has(layer.id)) continue;
			const key = keyOf(layer);
			oldByKey.set(key, [...(oldByKey.get(key) ?? []), layer]);
		}
		for (const layer of newLayers) {
			if (!unmatchedNew.has(layer.id)) continue;
			const key = keyOf(layer);
			newByKey.set(key, [...(newByKey.get(key) ?? []), layer]);
		}
		for (const [key, candidates] of oldByKey) {
			const replacements = newByKey.get(key);
			if (candidates.length !== 1 || replacements?.length !== 1) continue;
			const [oldLayer] = candidates;
			const [newLayer] = replacements;
			matches.set(newLayer.id, oldLayer.id);
			unmatchedOld.delete(oldLayer.id);
			unmatchedNew.delete(newLayer.id);
		}
	};

	// ID だけが変わった通常ケースは、並び替えと同時でも内容 fingerprint で確実に対応できる。
	matchUnique(layerFingerprint);

	// 保存までに同じレイヤーの内容も編集された場合は、type/source/source-layer と位置を使う。
	const previousIndex = new Map(previous.style.layers.map((layer, index) => [layer.id, index]));
	const currentIndex = new Map(style.layers.map((layer, index) => [layer.id, index]));
	for (const newLayer of newLayers) {
		if (!unmatchedNew.has(newLayer.id)) continue;
		const candidates = oldLayers.filter(
			(oldLayer) =>
				unmatchedOld.has(oldLayer.id) &&
				layerIdentitySignature(oldLayer) === layerIdentitySignature(newLayer)
		);
		if (candidates.length === 0) continue;
		const newIndex = currentIndex.get(newLayer.id) ?? 0;
		const ranked = candidates
			.map((oldLayer) => ({
				layer: oldLayer,
				distance: Math.abs((previousIndex.get(oldLayer.id) ?? 0) - newIndex)
			}))
			.sort(
				(left, right) =>
					left.distance - right.distance || compareKeys(left.layer.id, right.layer.id)
			);
		if (ranked.length > 1 && ranked[0].distance === ranked[1].distance) continue;
		const oldLayer = ranked[0].layer;
		matches.set(newLayer.id, oldLayer.id);
		unmatchedOld.delete(oldLayer.id);
		unmatchedNew.delete(newLayer.id);
	}

	return matches;
};

/**
 * StyleSpecification を分割保存ファイル群へ変換する。
 * previous を渡すと既存 basename を保持し、ID 変更・削除をファイル操作として返す。
 */
export const splitStyle = (
	style: StyleSpecification,
	previous?: PreviousStyleSplit
): SplitStyleResult => {
	if (new Set(style.layers.map((layer) => layer.id)).size !== style.layers.length) {
		throw new Error('Cannot split style: layer ids must be unique.');
	}

	const files: Record<string, string> = {};
	const layerFiles: LayerFileMap = {};
	const renames: StyleFileRename[] = [];
	const deletions: string[] = [];
	const previousBasenames = new Map<string, string>();
	const usedBasenames = new Set<string>();

	if (previous) {
		for (const [id, path] of Object.entries(previous.layerFiles)) {
			const basename = basenameOf(path);
			previousBasenames.set(id, basename);
			usedBasenames.add(basename);
		}
	}

	const inferredRenames = previous
		? inferLayerIdRenames(style, previous)
		: new Map<string, string>();
	const consumedPreviousIds = new Set<string>();

	for (const layer of style.layers) {
		const existingBasename = previousBasenames.get(layer.id);
		let basename: string;
		if (existingBasename) {
			basename = existingBasename;
			consumedPreviousIds.add(layer.id);
		} else {
			const previousId = inferredRenames.get(layer.id);
			const previousBasename = previousId ? previousBasenames.get(previousId) : undefined;
			if (previousId && previousBasename) {
				consumedPreviousIds.add(previousId);
				usedBasenames.delete(previousBasename);
				basename = allocateBasename(layer.id, usedBasenames);
				if (basename !== previousBasename) {
					renames.push({
						from: layerPath(previousBasename),
						to: layerPath(basename)
					});
				}
			} else {
				basename = allocateBasename(layer.id, usedBasenames);
			}
		}

		const path = layerPath(basename);
		layerFiles[layer.id] = path;
		files[path] = serializeStyleLayer(layer);
	}

	if (previous) {
		const previousIdsInOrder = previous.style.layers.map((layer) => layer.id);
		const extraPreviousIds = Object.keys(previous.layerFiles)
			.filter((id) => !previousIdsInOrder.includes(id))
			.sort(compareKeys);
		for (const id of [...previousIdsInOrder, ...extraPreviousIds]) {
			if (consumedPreviousIds.has(id)) continue;
			const basename = previousBasenames.get(id);
			if (basename) deletions.push(layerPath(basename));
		}
	}

	const styleRoot = { ...style } as Record<string, unknown>;
	Reflect.deleteProperty(styleRoot, 'sources');
	Reflect.deleteProperty(styleRoot, 'layers');
	files[SPLIT_STYLE_ROOT_FILE] = serializeStyleRoot(styleRoot);
	files[SPLIT_STYLE_SOURCES_FILE] = serializeStyleSources(style.sources);
	files[SPLIT_STYLE_LAYERS_FILE] = serializeStyleAuxiliary(
		style.layers.map((layer) => basenameOf(layerFiles[layer.id]))
	);

	const orderedFiles: Record<string, string> = {
		[SPLIT_STYLE_ROOT_FILE]: files[SPLIT_STYLE_ROOT_FILE],
		[SPLIT_STYLE_SOURCES_FILE]: files[SPLIT_STYLE_SOURCES_FILE],
		[SPLIT_STYLE_LAYERS_FILE]: files[SPLIT_STYLE_LAYERS_FILE]
	};
	for (const layer of style.layers) {
		const path = layerFiles[layer.id];
		orderedFiles[path] = files[path];
	}

	return { files: orderedFiles, layerFiles, renames, deletions };
};

const parseFile = (files: Readonly<Record<string, string>>, path: string): unknown => {
	const content = files[path];
	if (content === undefined) throw new Error(`Split style file is missing: ${path}`);
	try {
		return JSON.parse(content) as unknown;
	} catch (error) {
		throw new Error(
			`Invalid JSON in ${path}: ${error instanceof Error ? error.message : String(error)}`,
			{ cause: error }
		);
	}
};

const parseLayerManifest = (value: unknown): string[] => {
	if (
		!Array.isArray(value) ||
		value.some(
			(entry) =>
				typeof entry !== 'string' ||
				entry.length === 0 ||
				!entry.endsWith('.json') ||
				entry.startsWith('.') ||
				entry.includes('/') ||
				entry.includes('\\')
		)
	) {
		throw new Error('Invalid layers.json: expected an array of layer basenames.');
	}
	if (new Set(value).size !== value.length) {
		throw new Error('Invalid layers.json: layer basenames must be unique.');
	}
	return value;
};

/**
 * 相対 path → JSON content の辞書から分割スタイルを結合する。
 * migrate / validate は呼び出し側が結合後の JSON を parseStyleJSON に渡して行う。
 */
export const assembleStyle = (files: Readonly<Record<string, string>>): AssembleStyleResult => {
	const root = parseFile(files, SPLIT_STYLE_ROOT_FILE);
	if (!isRecord(root)) throw new Error('Invalid style.json: expected an object.');
	if ('layers' in root || 'sources' in root) {
		throw new Error('Invalid split style.json: sources and layers must be stored separately.');
	}

	const sources = parseFile(files, SPLIT_STYLE_SOURCES_FILE);
	if (!isRecord(sources)) throw new Error('Invalid sources.json: expected an object.');
	const manifest = parseLayerManifest(parseFile(files, SPLIT_STYLE_LAYERS_FILE));
	const layers: LayerSpecification[] = [];
	const ids = new Set<string>();

	for (const basename of manifest) {
		const path = layerPath(basename);
		const layer = parseFile(files, path);
		if (!isRecord(layer) || typeof layer.id !== 'string') {
			throw new Error(`Invalid layer file ${path}: a string id is required.`);
		}
		if (ids.has(layer.id)) {
			throw new Error(`Duplicate layer id in split style: ${layer.id}`);
		}
		ids.add(layer.id);
		layers.push(layer as LayerSpecification);
	}

	const referencedPaths = new Set(manifest.map(layerPath));
	const warnings = Object.keys(files)
		.filter((path) => path.startsWith(`${SPLIT_STYLE_LAYERS_DIRECTORY}/`))
		.filter((path) => !referencedPaths.has(path))
		.sort(compareKeys)
		.map((path) => `Ignoring unreferenced layer file: ${path}`);

	return {
		style: {
			...root,
			sources,
			layers
		} as StyleSpecification,
		warnings
	};
};
