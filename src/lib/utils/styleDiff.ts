import type { LayerSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';

import {
	getLayerBindings,
	getStyleVariables,
	parseBindingKey,
	type StyleVariable
} from '#lib/utils/styleVariables.ts';

export type StyleDiffPath = (string | number)[];

export type StylePropertyChange = {
	property: string;
	path: StyleDiffPath;
	before: unknown;
	after: unknown;
};

export type StyleLayerDiffKind = 'added' | 'removed' | 'modified' | 'reordered';

export type StyleLayerDiff = {
	layerId: string;
	kind: StyleLayerDiffKind;
	propertyChanges: StylePropertyChange[];
};

export type StyleVariableDiff = {
	variableId: string;
	name: string;
	kind: 'added' | 'removed' | 'modified';
	before: StyleVariable['value'] | undefined;
	after: StyleVariable['value'] | undefined;
	affectedLayerCount: number;
	affectedPropertyCount: number;
};

export type StyleDiffResult = {
	layers: StyleLayerDiff[];
	variables: StyleVariableDiff[];
	hasChanges: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const valuesEqual = (left: unknown, right: unknown): boolean =>
	JSON.stringify(left) === JSON.stringify(right);

const cloneDiffValue = (value: unknown): unknown =>
	value === undefined ? undefined : JSON.parse(JSON.stringify(value));

const appendValueChanges = (
	property: string,
	before: unknown,
	after: unknown,
	path: StyleDiffPath,
	changes: StylePropertyChange[]
) => {
	if (valuesEqual(before, after)) return;

	if (Array.isArray(before) && Array.isArray(after)) {
		const length = Math.max(before.length, after.length);
		for (let index = 0; index < length; index += 1) {
			appendValueChanges(property, before[index], after[index], [...path, index], changes);
		}
		return;
	}

	if (isRecord(before) && isRecord(after)) {
		const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
		for (const key of keys) {
			appendValueChanges(property, before[key], after[key], [...path, key], changes);
		}
		return;
	}

	changes.push({
		property,
		path,
		before: cloneDiffValue(before),
		after: cloneDiffValue(after)
	});
};

const layerPropertyChanges = (
	before: LayerSpecification,
	after: LayerSpecification
): StylePropertyChange[] => {
	const changes: StylePropertyChange[] = [];
	const beforeRecord = before as unknown as Record<string, unknown>;
	const afterRecord = after as unknown as Record<string, unknown>;
	const topLevelKeys = [...new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)])]
		.filter((key) => key !== 'id')
		.sort();

	for (const key of topLevelKeys) {
		const beforeValue = beforeRecord[key];
		const afterValue = afterRecord[key];
		if ((key === 'paint' || key === 'layout') && (isRecord(beforeValue) || isRecord(afterValue))) {
			const beforeGroup = isRecord(beforeValue) ? beforeValue : {};
			const afterGroup = isRecord(afterValue) ? afterValue : {};
			const propertyKeys = [
				...new Set([...Object.keys(beforeGroup), ...Object.keys(afterGroup)])
			].sort();
			for (const propertyKey of propertyKeys) {
				appendValueChanges(
					`${key}.${propertyKey}`,
					beforeGroup[propertyKey],
					afterGroup[propertyKey],
					[],
					changes
				);
			}
			continue;
		}
		appendValueChanges(key, beforeValue, afterValue, [], changes);
	}
	return changes;
};

const variableUsageCounts = (
	style: StyleSpecification,
	variableId: string
): { affectedLayerCount: number; affectedPropertyCount: number } => {
	const layerIds = new Set<string>();
	let affectedPropertyCount = 0;
	for (const layer of style.layers) {
		for (const [bindingKey, id] of Object.entries(getLayerBindings(layer))) {
			if (id !== variableId || parseBindingKey(bindingKey) === undefined) continue;
			layerIds.add(layer.id);
			affectedPropertyCount += 1;
		}
	}
	return { affectedLayerCount: layerIds.size, affectedPropertyCount };
};

const variableDiffs = (
	before: StyleSpecification,
	after: StyleSpecification
): StyleVariableDiff[] => {
	const beforeVariables = new Map(
		getStyleVariables(before).map((variable) => [variable.id, variable])
	);
	const afterVariables = new Map(
		getStyleVariables(after).map((variable) => [variable.id, variable])
	);
	const ids = [...new Set([...beforeVariables.keys(), ...afterVariables.keys()])].sort();
	const changes: StyleVariableDiff[] = [];

	for (const id of ids) {
		const beforeVariable = beforeVariables.get(id);
		const afterVariable = afterVariables.get(id);
		if (
			beforeVariable &&
			afterVariable &&
			valuesEqual(beforeVariable.value, afterVariable.value) &&
			beforeVariable.name === afterVariable.name
		) {
			continue;
		}
		const usageStyle = afterVariable ? after : before;
		const usageCounts = variableUsageCounts(usageStyle, id);
		changes.push({
			variableId: id,
			name: afterVariable?.name ?? beforeVariable?.name ?? id,
			kind: beforeVariable ? (afterVariable ? 'modified' : 'removed') : 'added',
			before: cloneDiffValue(beforeVariable?.value) as StyleVariable['value'] | undefined,
			after: cloneDiffValue(afterVariable?.value) as StyleVariable['value'] | undefined,
			...usageCounts
		});
	}
	return changes;
};

export const styleDiff = (
	before: StyleSpecification,
	after: StyleSpecification
): StyleDiffResult => {
	const beforeLayers = new Map(before.layers.map((layer) => [layer.id, layer]));
	const afterLayers = new Map(after.layers.map((layer) => [layer.id, layer]));
	const layers: StyleLayerDiff[] = [];

	for (const layer of before.layers) {
		if (afterLayers.has(layer.id)) continue;
		layers.push({
			layerId: layer.id,
			kind: 'removed',
			propertyChanges: [
				{ property: 'layer', path: [], before: cloneDiffValue(layer), after: undefined }
			]
		});
	}
	for (const layer of after.layers) {
		if (beforeLayers.has(layer.id)) continue;
		layers.push({
			layerId: layer.id,
			kind: 'added',
			propertyChanges: [
				{ property: 'layer', path: [], before: undefined, after: cloneDiffValue(layer) }
			]
		});
	}
	for (const layer of after.layers) {
		const previous = beforeLayers.get(layer.id);
		if (!previous) continue;
		const propertyChanges = layerPropertyChanges(previous, layer);
		if (propertyChanges.length > 0) {
			layers.push({ layerId: layer.id, kind: 'modified', propertyChanges });
		}
	}

	const commonIds = new Set(before.layers.map(({ id }) => id).filter((id) => afterLayers.has(id)));
	const beforeOrder = before.layers.map(({ id }) => id).filter((id) => commonIds.has(id));
	const afterOrder = after.layers.map(({ id }) => id).filter((id) => commonIds.has(id));
	if (!valuesEqual(beforeOrder, afterOrder)) {
		for (const [afterIndex, layerId] of afterOrder.entries()) {
			const beforeIndex = beforeOrder.indexOf(layerId);
			if (beforeIndex === afterIndex) continue;
			layers.push({
				layerId,
				kind: 'reordered',
				propertyChanges: [{ property: 'order', path: [], before: beforeIndex, after: afterIndex }]
			});
		}
	}

	const variables = variableDiffs(before, after);
	return {
		layers,
		variables,
		hasChanges: layers.length > 0 || variables.length > 0
	};
};

export const styleDiffPathLabel = (change: StylePropertyChange): string =>
	`${change.property}${change.path.map((part) => (typeof part === 'number' ? `[${part}]` : `.${part}`)).join('')}`;

export const styleDiffCommitMessage = (diff: StyleDiffResult): string => {
	const added = diff.layers.filter(({ kind }) => kind === 'added');
	const removed = diff.layers.filter(({ kind }) => kind === 'removed');
	const modified = diff.layers.filter(({ kind }) => kind === 'modified');
	const reordered = diff.layers.some(({ kind }) => kind === 'reordered');
	if (diff.variables.length === 1 && added.length === 0 && removed.length === 0) {
		const [variable] = diff.variables;
		return `Update ${variable.name} across ${variable.affectedLayerCount} layers`;
	}
	if (added.length === 1 && removed.length === 0 && modified.length === 0) {
		return `Add ${added[0].layerId} layer`;
	}
	if (removed.length === 1 && added.length === 0 && modified.length === 0) {
		return `Remove ${removed[0].layerId} layer`;
	}
	if (modified.length === 1 && added.length === 0 && removed.length === 0 && !reordered) {
		return `Update ${modified[0].layerId} layer`;
	}
	if (reordered && added.length === 0 && removed.length === 0 && modified.length === 0) {
		return 'Reorder style layers';
	}
	const changedLayerIds = new Set(diff.layers.map(({ layerId }) => layerId));
	return changedLayerIds.size > 0
		? `Update ${changedLayerIds.size} style layers`
		: 'Update map style';
};
