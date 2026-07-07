import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';

export const GROUP_METADATA_KEY = 'kartore:group';

// $state の deep proxy は structuredClone できない (DataCloneError) ため、
// 呼び出し元を問わず安全な JSON ベースのクローンを使う (スタイルは JSON 化可能なデータのみ)
const cloneLayers = (layers: LayerSpecification[]): LayerSpecification[] => {
	return JSON.parse(JSON.stringify(layers)) as LayerSpecification[];
};

export const getLayerGroup = (layer: LayerSpecification): string | undefined => {
	const metadata = layer.metadata;
	if (typeof metadata !== 'object' || metadata === null) return undefined;
	const group = (metadata as Record<string, unknown>)[GROUP_METADATA_KEY];
	return typeof group === 'string' && group !== '' ? group : undefined;
};

/** Maputnik の layerPrefix と同等: id の先頭セグメントをグループ候補名として取り出す */
export const layerIdPrefix = (id: string): string => {
	return id.replace(' ', '-').replace('_', '-').split('-')[0];
};

/**
 * 隣接して同じ id 接頭辞を持つ 2 レイヤー以上の run に kartore:group を付与する。
 * 既に kartore:group を持つレイヤーは変更せず、run の境界として扱う
 */
export const groupLayersByIdPrefix = (
	layers: LayerSpecification[]
): { layers: LayerSpecification[]; groupCount: number } => {
	const nextLayers = cloneLayers(layers);
	let groupCount = 0;
	let runStart = 0;

	const applyRun = (endExclusive: number) => {
		if (endExclusive - runStart < 2) return;
		const prefix = layerIdPrefix(nextLayers[runStart].id);
		for (let i = runStart; i < endExclusive; i++) {
			setLayerGroup(nextLayers[i], prefix);
		}
		groupCount += 1;
	};

	for (let index = 1; index <= nextLayers.length; index++) {
		const current = index < nextLayers.length ? nextLayers[index] : undefined;
		const previous = nextLayers[index - 1];
		const continues =
			current !== undefined &&
			getLayerGroup(current) === undefined &&
			getLayerGroup(previous) === undefined &&
			layerIdPrefix(current.id) === layerIdPrefix(previous.id);
		if (!continues) {
			if (getLayerGroup(previous) === undefined) {
				applyRun(index);
			}
			runStart = index;
		}
	}

	return { layers: nextLayers, groupCount };
};

export type LayerTreeRow =
	| { kind: 'group'; name: string; startIndex: number; layerIndexes: number[] }
	| { kind: 'layer'; layerIndex: number; group: string | undefined };

/** layers を表示行 (グループヘッダー + レイヤー行) に変換する。collapsed 判定は呼び出し側 */
export const buildLayerTreeRows = (layers: LayerSpecification[]): LayerTreeRow[] => {
	const rows: LayerTreeRow[] = [];
	let index = 0;

	while (index < layers.length) {
		const group = getLayerGroup(layers[index]);
		if (group === undefined) {
			rows.push({ kind: 'layer', layerIndex: index, group });
			index += 1;
			continue;
		}

		const startIndex = index;
		const layerIndexes: number[] = [];
		while (index < layers.length && getLayerGroup(layers[index]) === group) {
			layerIndexes.push(index);
			index += 1;
		}

		rows.push({ kind: 'group', name: group, startIndex, layerIndexes });
		for (const layerIndex of layerIndexes) {
			rows.push({ kind: 'layer', layerIndex, group });
		}
	}

	return rows;
};

const setLayerGroup = (layer: LayerSpecification, group: string | undefined): void => {
	if (group !== undefined) {
		layer.metadata = {
			...(typeof layer.metadata === 'object' && layer.metadata !== null ? layer.metadata : {}),
			[GROUP_METADATA_KEY]: group
		};
		return;
	}

	if (typeof layer.metadata !== 'object' || layer.metadata === null) return;
	delete (layer.metadata as Record<string, unknown>)[GROUP_METADATA_KEY];
	if (Object.keys(layer.metadata).length === 0) {
		delete layer.metadata;
	}
};

/**
 * グループヘッダー行へのドロップ: グループ先頭の「直前」に挿入する。
 * 除去によるインデックスずれを補正する
 */
const insertionIndexBeforeGroup = (
	activeLayerIndex: number,
	groupStartIndex: number,
	length: number
): number => {
	const adjustedIndex = groupStartIndex > activeLayerIndex ? groupStartIndex - 1 : groupStartIndex;
	return Math.max(0, Math.min(adjustedIndex, length));
};

/**
 * レイヤー行へのドロップ: over 行の位置に着地させる (dnd の arrayMove 相当)。
 * 除去前インデックスをそのまま使うことで、下方向は over の直後・上方向は直前に入り、
 * ドラッグ中の transform プレビューと結果が一致する
 */
const insertionIndexAtLayer = (targetLayerIndex: number, length: number): number => {
	return Math.max(0, Math.min(targetLayerIndex, length));
};

/**
 * ドラッグ結果を解決する純関数。
 * 表示行リストと「どの layer を、どの表示行位置へ動かすか」から
 * 新しい layers 配列 (順序変更 + kartore:group の付け替え込み) を返す
 */
export const resolveLayerDrop = (
	layers: LayerSpecification[],
	rows: LayerTreeRow[],
	activeLayerIndex: number,
	overRowIndex: number
): LayerSpecification[] => {
	const overRow = rows[overRowIndex];
	if (overRow === undefined || layers[activeLayerIndex] === undefined) {
		return layers;
	}

	const nextLayers = cloneLayers(layers);
	const [activeLayer] = nextLayers.splice(activeLayerIndex, 1);
	const insertIndex =
		overRow.kind === 'group'
			? insertionIndexBeforeGroup(activeLayerIndex, overRow.startIndex, nextLayers.length)
			: insertionIndexAtLayer(overRow.layerIndex, nextLayers.length);

	nextLayers.splice(insertIndex, 0, activeLayer);

	if (overRow.kind === 'group') {
		setLayerGroup(activeLayer, undefined);
		return nextLayers;
	}

	const previousGroup = insertIndex > 0 ? getLayerGroup(nextLayers[insertIndex - 1]) : undefined;
	const nextGroup =
		insertIndex < nextLayers.length - 1 ? getLayerGroup(nextLayers[insertIndex + 1]) : undefined;
	const activeGroup = getLayerGroup(activeLayer);
	const overGroup = overRow.group;

	if (previousGroup !== undefined && previousGroup === nextGroup) {
		setLayerGroup(activeLayer, previousGroup);
	} else if (
		activeGroup !== undefined &&
		activeGroup === overGroup &&
		(previousGroup === activeGroup || nextGroup === activeGroup)
	) {
		setLayerGroup(activeLayer, activeGroup);
	} else {
		setLayerGroup(activeLayer, undefined);
	}

	return nextLayers;
};
