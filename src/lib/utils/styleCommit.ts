import type { LayerSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';

import {
	SPLIT_STYLE_LAYERS_FILE,
	SPLIT_STYLE_ROOT_FILE,
	SPLIT_STYLE_SOURCES_FILE,
	splitStyle,
	type LayerFileMap,
	type SplitStyleResult
} from './styleSplit.ts';
import {
	styleDiff,
	styleDiffCommitMessage,
	styleDiffPathLabel,
	type StyleDiffResult,
	type StyleLayerDiff
} from './styleDiff.ts';

export type StyleCommitFormat = 'single' | 'split';
export type StyleCommitFileStatus = 'added' | 'modified' | 'removed' | 'renamed';

export type StyleCommitFile = {
	path: string;
	previousPath?: string;
	layerId?: string;
	status: StyleCommitFileStatus;
	summary: string;
};

export type StyleCommitPlan = {
	format: StyleCommitFormat;
	singlePath: string;
	beforeStyle: StyleSpecification;
	currentStyle: StyleSpecification;
	previousLayerFiles: LayerFileMap;
	files: StyleCommitFile[];
	diff: StyleDiffResult;
	message: string;
};

export type StyleCommitOperations = {
	style: StyleSpecification;
	files: { path: string; content: string }[];
	deletions: string[];
	renames: { from: string; to: string }[];
	layerFiles: LayerFileMap;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const basename = (path: string): string => path.split('/').at(-1) ?? path;

const normalizeLayerFiles = (layerFiles: Readonly<LayerFileMap>): LayerFileMap =>
	Object.fromEntries(
		Object.entries(layerFiles).map(([layerId, path]) => [layerId, `layers/${basename(path)}`])
	);

const splitBefore = (
	beforeStyle: StyleSpecification,
	previousLayerFiles: Readonly<LayerFileMap>
): SplitStyleResult =>
	splitStyle(beforeStyle, {
		style: beforeStyle,
		layerFiles: normalizeLayerFiles(previousLayerFiles)
	});

const splitCurrent = (
	beforeStyle: StyleSpecification,
	currentStyle: StyleSpecification,
	previousLayerFiles: Readonly<LayerFileMap>
): SplitStyleResult =>
	splitStyle(currentStyle, {
		style: beforeStyle,
		layerFiles: normalizeLayerFiles(previousLayerFiles)
	});

const valueLabel = (value: unknown): string => {
	if (value === undefined) return '未設定';
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	const serialized = JSON.stringify(value);
	return serialized.length > 28 ? `${serialized.slice(0, 27)}…` : serialized;
};

const summarizeLayerDiff = (layerId: string, diffs: StyleLayerDiff[]): string => {
	const relevant = diffs.filter((entry) => entry.layerId === layerId);
	if (relevant.some(({ kind }) => kind === 'added')) return 'レイヤーを追加';
	if (relevant.some(({ kind }) => kind === 'removed')) return 'レイヤーを削除';
	const modified = relevant.find(({ kind }) => kind === 'modified');
	if (modified) {
		const labels = modified.propertyChanges.slice(0, 2).map((change) => {
			const path = styleDiffPathLabel(change);
			return `${path}: ${valueLabel(change.before)} → ${valueLabel(change.after)}`;
		});
		const remaining = modified.propertyChanges.length - labels.length;
		return `${labels.join('、')}${remaining > 0 ? `、ほか${remaining}件` : ''}`;
	}
	if (relevant.some(({ kind }) => kind === 'reordered')) return 'レイヤー順序を変更';
	return 'レイヤーを更新';
};

const changedRootKeys = (
	beforeStyle: StyleSpecification,
	currentStyle: StyleSpecification
): string[] => {
	const ignored = new Set(['sources', 'layers']);
	const before = beforeStyle as unknown as Record<string, unknown>;
	const current = currentStyle as unknown as Record<string, unknown>;
	return [...new Set([...Object.keys(before), ...Object.keys(current)])]
		.filter(
			(key) => !ignored.has(key) && JSON.stringify(before[key]) !== JSON.stringify(current[key])
		)
		.sort();
};

const rootSummary = (
	beforeStyle: StyleSpecification,
	currentStyle: StyleSpecification,
	diff: StyleDiffResult
): string => {
	if (diff.variables.length === 1) {
		const [variable] = diff.variables;
		return `${variable.name} を ${variable.affectedLayerCount} レイヤーで更新`;
	}
	if (diff.variables.length > 1) return `変数を ${diff.variables.length} 件更新`;
	const keys = changedRootKeys(beforeStyle, currentStyle);
	return keys.length > 0 ? `${keys.slice(0, 3).join('・')} を更新` : 'スタイル設定を更新';
};

const sourceSummary = (
	beforeStyle: StyleSpecification,
	currentStyle: StyleSpecification
): string => {
	const before = beforeStyle.sources as Record<string, unknown>;
	const current = currentStyle.sources as Record<string, unknown>;
	const changed = [...new Set([...Object.keys(before), ...Object.keys(current)])].filter(
		(key) => JSON.stringify(before[key]) !== JSON.stringify(current[key])
	);
	return changed.length === 1 ? `${changed[0]} ソースを更新` : `ソースを ${changed.length} 件更新`;
};

const manifestSummary = (diff: StyleDiffResult): string => {
	const added = diff.layers.filter(({ kind }) => kind === 'added').length;
	const removed = diff.layers.filter(({ kind }) => kind === 'removed').length;
	const reordered = diff.layers.filter(({ kind }) => kind === 'reordered').length;
	const parts = [
		added > 0 ? `${added} 追加` : '',
		removed > 0 ? `${removed} 削除` : '',
		reordered > 0 ? '順序変更' : ''
	].filter(Boolean);
	return parts.length > 0 ? `レイヤー構成: ${parts.join('・')}` : 'レイヤー構成を更新';
};

const pathToLayerId = (layerFiles: Readonly<LayerFileMap>): Map<string, string> =>
	new Map(Object.entries(layerFiles).map(([layerId, path]) => [path, layerId]));

const createSplitFiles = (
	beforeStyle: StyleSpecification,
	currentStyle: StyleSpecification,
	previousLayerFiles: Readonly<LayerFileMap>,
	diff: StyleDiffResult
): StyleCommitFile[] => {
	const previous = splitBefore(beforeStyle, previousLayerFiles);
	const current = splitCurrent(beforeStyle, currentStyle, previousLayerFiles);
	const previousLayers = pathToLayerId(previous.layerFiles);
	const currentLayers = pathToLayerId(current.layerFiles);
	const renameByTarget = new Map(current.renames.map(({ from, to }) => [to, from]));
	const renameSources = new Set(current.renames.map(({ from }) => from));
	const files: StyleCommitFile[] = [];

	for (const [path, content] of Object.entries(current.files)) {
		const previousPath = renameByTarget.get(path);
		const previousContent = previousPath ? previous.files[previousPath] : previous.files[path];
		if (content === previousContent && !previousPath) continue;
		const layerId = currentLayers.get(path);
		let summary: string;
		if (path === SPLIT_STYLE_ROOT_FILE) {
			summary = rootSummary(beforeStyle, currentStyle, diff);
		} else if (path === SPLIT_STYLE_SOURCES_FILE) {
			summary = sourceSummary(beforeStyle, currentStyle);
		} else if (path === SPLIT_STYLE_LAYERS_FILE) {
			summary = manifestSummary(diff);
		} else if (layerId) {
			summary = summarizeLayerDiff(layerId, diff.layers);
		} else {
			summary = 'ファイルを更新';
		}
		files.push({
			path,
			previousPath,
			layerId,
			status: previousPath ? 'renamed' : previousContent === undefined ? 'added' : 'modified',
			summary
		});
	}

	for (const path of current.deletions) {
		if (renameSources.has(path)) continue;
		const layerId = previousLayers.get(path);
		files.push({
			path,
			layerId,
			status: 'removed',
			summary: layerId ? summarizeLayerDiff(layerId, diff.layers) : 'ファイルを削除'
		});
	}
	return files;
};

export const createStyleCommitPlan = ({
	beforeStyle,
	currentStyle,
	previousLayerFiles = {},
	format,
	singlePath = 'style.json'
}: {
	beforeStyle: StyleSpecification;
	currentStyle: StyleSpecification;
	previousLayerFiles?: Readonly<LayerFileMap>;
	format: StyleCommitFormat;
	singlePath?: string;
}): StyleCommitPlan => {
	const before = clone(beforeStyle);
	const current = clone(currentStyle);
	const diff = styleDiff(before, current);
	const files =
		format === 'split'
			? createSplitFiles(before, current, previousLayerFiles, diff)
			: JSON.stringify(before) === JSON.stringify(current)
				? []
				: [
						{
							path: singlePath,
							status: 'modified' as const,
							summary: styleDiffCommitMessage(diff)
						}
					];
	return {
		format,
		singlePath,
		beforeStyle: before,
		currentStyle: current,
		previousLayerFiles: { ...previousLayerFiles },
		files,
		diff,
		message: styleDiffCommitMessage(diff)
	};
};

const insertAtCurrentPosition = (
	layers: LayerSpecification[],
	layer: LayerSpecification,
	currentOrder: string[]
): void => {
	const currentIndex = currentOrder.indexOf(layer.id);
	for (let index = currentIndex - 1; index >= 0; index -= 1) {
		const anchorIndex = layers.findIndex(({ id }) => id === currentOrder[index]);
		if (anchorIndex >= 0) {
			layers.splice(anchorIndex + 1, 0, clone(layer));
			return;
		}
	}
	for (let index = currentIndex + 1; index < currentOrder.length; index += 1) {
		const anchorIndex = layers.findIndex(({ id }) => id === currentOrder[index]);
		if (anchorIndex >= 0) {
			layers.splice(anchorIndex, 0, clone(layer));
			return;
		}
	}
	layers.push(clone(layer));
};

const mergeCurrentOrder = (
	layers: LayerSpecification[],
	beforeOrder: string[],
	currentOrder: string[]
): LayerSpecification[] => {
	const byId = new Map(layers.map((layer) => [layer.id, layer]));
	const currentIds = new Set(currentOrder);
	const ordered = currentOrder.flatMap((id) => {
		const layer = byId.get(id);
		return layer ? [layer] : [];
	});
	const orphans = beforeOrder.filter((id) => byId.has(id) && !currentIds.has(id));

	for (const orphanId of orphans) {
		const layer = byId.get(orphanId);
		if (!layer) continue;
		const beforeIndex = beforeOrder.indexOf(orphanId);
		const nextId = beforeOrder
			.slice(beforeIndex + 1)
			.find((id) => ordered.some((item) => item.id === id));
		if (nextId) {
			ordered.splice(
				ordered.findIndex(({ id }) => id === nextId),
				0,
				layer
			);
		} else {
			ordered.push(layer);
		}
	}
	return ordered;
};

const normalizedSelection = (
	plan: StyleCommitPlan,
	selectedPaths: ReadonlySet<string> | readonly string[]
): Set<string> => {
	const selected = new Set(selectedPaths);
	if (
		plan.files.some(
			(file) =>
				selected.has(file.path) &&
				file.layerId !== undefined &&
				(file.status === 'added' || file.status === 'removed' || file.status === 'renamed')
		)
	) {
		selected.add(SPLIT_STYLE_LAYERS_FILE);
	}
	return selected;
};

export const buildSelectedCommitStyle = (
	plan: StyleCommitPlan,
	selectedPaths: ReadonlySet<string> | readonly string[]
): StyleSpecification => {
	const selected = normalizedSelection(plan, selectedPaths);
	if (selected.size === 0) throw new Error('Select at least one changed file.');
	if (plan.format === 'single') {
		if (!selected.has(plan.singlePath)) throw new Error('Select the changed style file.');
		return clone(plan.currentStyle);
	}

	let result = clone(plan.beforeStyle);
	if (selected.has(SPLIT_STYLE_ROOT_FILE)) {
		const sources = result.sources;
		const layers = result.layers;
		result = clone(plan.currentStyle);
		result.sources = sources;
		result.layers = layers;
	}
	if (selected.has(SPLIT_STYLE_SOURCES_FILE)) {
		result.sources = clone(plan.currentStyle.sources);
	}

	const previous = splitBefore(plan.beforeStyle, plan.previousLayerFiles);
	const current = splitCurrent(plan.beforeStyle, plan.currentStyle, plan.previousLayerFiles);
	const previousLayers = pathToLayerId(previous.layerFiles);
	const currentLayers = pathToLayerId(current.layerFiles);
	const renameByTarget = new Map(current.renames.map(({ from, to }) => [to, from]));
	const beforeById = new Map(plan.beforeStyle.layers.map((layer) => [layer.id, layer]));
	const currentById = new Map(plan.currentStyle.layers.map((layer) => [layer.id, layer]));
	const beforeOrder = plan.beforeStyle.layers.map(({ id }) => id);
	const currentOrder = plan.currentStyle.layers.map(({ id }) => id);
	const layers = result.layers.map(clone);

	for (const file of plan.files) {
		if (!selected.has(file.path) || !file.layerId) continue;
		const currentLayerId = currentLayers.get(file.path);
		if (currentLayerId) {
			const currentLayer = currentById.get(currentLayerId);
			if (!currentLayer) continue;
			const renamedFromPath = renameByTarget.get(file.path);
			const renamedFromId = renamedFromPath ? previousLayers.get(renamedFromPath) : undefined;
			const replaceId = renamedFromId ?? currentLayerId;
			const replaceIndex = layers.findIndex(({ id }) => id === replaceId);
			if (replaceIndex >= 0) {
				layers.splice(replaceIndex, 1, clone(currentLayer));
			} else {
				insertAtCurrentPosition(layers, currentLayer, currentOrder);
			}
			continue;
		}
		const previousLayerId = previousLayers.get(file.path);
		if (!previousLayerId || !beforeById.has(previousLayerId)) continue;
		const removeIndex = layers.findIndex(({ id }) => id === previousLayerId);
		if (removeIndex >= 0) layers.splice(removeIndex, 1);
	}

	result.layers = selected.has(SPLIT_STYLE_LAYERS_FILE)
		? mergeCurrentOrder(layers, beforeOrder, currentOrder)
		: layers;
	return result;
};

export const createStyleCommitOperations = (
	plan: StyleCommitPlan,
	selectedPaths: ReadonlySet<string> | readonly string[]
): StyleCommitOperations => {
	const style = buildSelectedCommitStyle(plan, selectedPaths);
	if (plan.format === 'single') {
		return {
			style,
			files: [],
			deletions: [],
			renames: [],
			layerFiles: {}
		};
	}
	const previous = splitBefore(plan.beforeStyle, plan.previousLayerFiles);
	const committed = splitCurrent(plan.beforeStyle, style, plan.previousLayerFiles);
	const files = Object.entries(committed.files)
		.filter(([path, content]) => previous.files[path] !== content)
		.map(([path, content]) => ({ path, content }));
	if (files.length === 0 && committed.deletions.length === 0 && committed.renames.length === 0) {
		throw new Error('The selected files contain no changes.');
	}
	return {
		style,
		files,
		deletions: committed.deletions,
		renames: committed.renames,
		layerFiles: committed.layerFiles
	};
};
