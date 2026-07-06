import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';

export const GROUP_METADATA_KEY = 'kartore:group';

export const getLayerGroup = (layer: LayerSpecification): string | undefined => {
	const metadata = layer.metadata;
	if (typeof metadata !== 'object' || metadata === null) return undefined;
	const group = (metadata as Record<string, unknown>)[GROUP_METADATA_KEY];
	return typeof group === 'string' && group !== '' ? group : undefined;
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

const insertionIndexAfterMove = (
	activeLayerIndex: number,
	targetLayerIndex: number,
	length: number
): number => {
	const adjustedIndex =
		targetLayerIndex > activeLayerIndex ? targetLayerIndex - 1 : targetLayerIndex;
	return Math.max(0, Math.min(adjustedIndex, length - 1));
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

	const nextLayers = structuredClone(layers);
	const [activeLayer] = nextLayers.splice(activeLayerIndex, 1);
	const targetLayerIndex = overRow.kind === 'group' ? overRow.startIndex : overRow.layerIndex;
	const insertIndex = insertionIndexAfterMove(
		activeLayerIndex,
		targetLayerIndex,
		nextLayers.length
	);

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
