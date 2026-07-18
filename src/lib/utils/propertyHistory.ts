import type { StyleSpecification } from 'maplibre-gl';

import type { StyleHistoryRevision } from '$lib/editor/EditorModule.ts';

export type PropertyHistoryGroup = 'paint' | 'layout' | 'filter';

export type PropertyRevisionValue = {
	revision: StyleHistoryRevision;
	/** layer が存在しない revision は layer-missing、読込失敗は error */
	state: 'value' | 'layer-missing' | 'error';
	/** state=value のとき。未設定プロパティは undefined */
	value?: unknown;
	error?: string;
};

export type PropertyHistoryEntry = {
	revision: StyleHistoryRevision;
	/** undefined は未設定 (デフォルト) */
	value: unknown;
	kind: 'changed' | 'oldest-loaded' | 'layer-missing' | 'error';
	error?: string;
};

/** style からプロパティ値を取り出す。layer が無ければ found=false */
export const extractPropertyValue = (
	style: StyleSpecification,
	layerId: string,
	group: PropertyHistoryGroup,
	key: string
): { found: boolean; value: unknown } => {
	const layer = style.layers.find((candidate) => candidate.id === layerId);
	if (!layer) return { found: false, value: undefined };
	if (group === 'filter') {
		return { found: true, value: 'filter' in layer ? layer.filter : undefined };
	}

	return {
		found: true,
		value: (layer[group] as Record<string, unknown> | undefined)?.[key]
	};
};

const valuesEqual = (left: unknown, right: unknown): boolean =>
	JSON.stringify(left) === JSON.stringify(right);

/**
 * 新しい順のリビジョン値から、実際に値が切り替わった境界だけを取り出す。
 * error は比較から除外しつつ行として残し、layer-missing で探索を打ち切る。
 */
export const computeHistoryEntries = (
	values: PropertyRevisionValue[],
	hasNext: boolean
): PropertyHistoryEntry[] => {
	const entries: Array<{ index: number; entry: PropertyHistoryEntry }> = [];
	const comparable: Array<{ index: number; item: PropertyRevisionValue }> = [];
	let layerMissingIndex = -1;

	for (let index = 0; index < values.length; index += 1) {
		const item = values[index];
		if (item.state === 'layer-missing') {
			layerMissingIndex = index;
			entries.push({
				index,
				entry: {
					revision: item.revision,
					value: undefined,
					kind: 'layer-missing'
				}
			});
			break;
		}

		if (item.state === 'error') {
			entries.push({
				index,
				entry: {
					revision: item.revision,
					value: undefined,
					kind: 'error',
					error: item.error ?? 'Could not load this revision.'
				}
			});
			continue;
		}

		comparable.push({ index, item });
	}

	for (let index = 0; index < comparable.length; index += 1) {
		const current = comparable[index];
		const older = comparable[index + 1];
		if (older && valuesEqual(current.item.value, older.item.value)) continue;

		entries.push({
			index: current.index,
			entry: {
				revision: current.item.revision,
				value: current.item.value,
				kind: older || layerMissingIndex !== -1 || !hasNext ? 'changed' : 'oldest-loaded'
			}
		});
	}

	return entries.sort((left, right) => left.index - right.index).map(({ entry }) => entry);
};
