import type {
	ExpressionSpecification,
	InterpolationSpecification,
	LayerSpecification,
	StyleSpecification
} from '@maplibre/maplibre-gl-style-spec';

import { replaceArgAt } from '#lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
import { replaceLayerData } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';

export const VARIABLES_METADATA_KEY = 'kartore:variables';
export const BINDINGS_METADATA_KEY = 'kartore:bindings';

export type StyleVariable =
	| { id: string; name: string; type: 'color'; value: string }
	| { id: string; name: string; type: 'number'; value: number }
	| { id: string; name: string; type: 'interpolation'; value: InterpolationSpecification };

export type StyleVariableType = StyleVariable['type'];

export const isLegacyVariableName = (name: string): boolean => name.startsWith('$');

export const suggestModernVariableName = (name: string): string =>
	isLegacyVariableName(name) ? name.slice(1).replace(/\./g, '/') || 'variable' : name;

/** バインド対象。slot 省略時はプロパティ値そのもの (literal) */
export type PropertyBindingTarget = {
	group: 'paint' | 'layout';
	key: string;
	/** 'interpolation' = interpolate 式の第 1 引数 (補間方法) */
	slot?: 'interpolation';
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value);

const isInterpolation = (value: unknown): value is InterpolationSpecification => {
	if (!Array.isArray(value)) return false;
	if (value[0] === 'linear') return value.length === 1;
	if (value[0] === 'exponential') {
		return value.length === 2 && isFiniteNumber(value[1]);
	}
	return value[0] === 'cubic-bezier' && value.length === 5 && value.slice(1).every(isFiniteNumber);
};

const isStyleVariable = (value: unknown): value is StyleVariable => {
	if (
		!isRecord(value) ||
		typeof value.id !== 'string' ||
		value.id === '' ||
		typeof value.name !== 'string' ||
		value.name === ''
	) {
		return false;
	}
	if (value.type === 'color') return typeof value.value === 'string';
	if (value.type === 'number') return isFiniteNumber(value.value);
	return value.type === 'interpolation' && isInterpolation(value.value);
};

const cloneStyle = (style: StyleSpecification): StyleSpecification =>
	JSON.parse(JSON.stringify(style)) as StyleSpecification;

const withStyleVariables = (
	style: StyleSpecification,
	variables: StyleVariable[]
): StyleSpecification => {
	const metadata = isRecord(style.metadata) ? { ...style.metadata } : {};
	if (variables.length > 0) {
		metadata[VARIABLES_METADATA_KEY] = {
			version: 1,
			variables
		};
	} else {
		delete metadata[VARIABLES_METADATA_KEY];
	}

	const nextStyle = { ...style };
	if (Object.keys(metadata).length > 0) {
		nextStyle.metadata = metadata;
	} else {
		delete nextStyle.metadata;
	}
	return nextStyle;
};

export const replaceStyleVariables = (
	style: StyleSpecification,
	variables: StyleVariable[]
): StyleSpecification => applyVariableBindings(withStyleVariables(style, variables));

const withLayerBindings = (
	layer: LayerSpecification,
	bindings: Record<string, string>
): LayerSpecification => {
	const metadata = isRecord(layer.metadata) ? { ...layer.metadata } : {};
	if (Object.keys(bindings).length > 0) {
		metadata[BINDINGS_METADATA_KEY] = bindings;
	} else {
		delete metadata[BINDINGS_METADATA_KEY];
	}

	const nextLayer = { ...layer };
	if (Object.keys(metadata).length > 0) {
		nextLayer.metadata = metadata;
	} else {
		delete nextLayer.metadata;
	}
	return nextLayer;
};

const getPropertyValue = (layer: LayerSpecification, target: PropertyBindingTarget): unknown => {
	const group = layer[target.group] as UnknownRecord | undefined;
	return group?.[target.key];
};

const isInterpolateExpression = (value: unknown): value is ExpressionSpecification =>
	Array.isArray(value) &&
	(value[0] === 'interpolate' || value[0] === 'interpolate-hcl' || value[0] === 'interpolate-lab');

const valuesEqual = (left: unknown, right: unknown): boolean =>
	JSON.stringify(left) === JSON.stringify(right);

export const bindingKeyOf = (target: PropertyBindingTarget): string =>
	target.slot ? `${target.group}:${target.key}@${target.slot}` : `${target.group}:${target.key}`;

export const parseBindingKey = (raw: string): PropertyBindingTarget | undefined => {
	const match = /^(paint|layout):([^:@]+)(?:@(interpolation))?$/.exec(raw);
	if (!match) return undefined;
	const [, group, key, slot] = match;
	return {
		group: group as PropertyBindingTarget['group'],
		key,
		...(slot === 'interpolation' ? { slot } : {})
	};
};

/** metadata から定義一覧を読む。形式不正な要素は黙って捨てる (防御的パース) */
export const getStyleVariables = (style: StyleSpecification): StyleVariable[] => {
	if (!isRecord(style.metadata)) return [];
	const data = style.metadata[VARIABLES_METADATA_KEY];
	if (!isRecord(data) || data.version !== 1 || !Array.isArray(data.variables)) return [];
	return data.variables.filter(isStyleVariable);
};

export const getLayerBindings = (layer: LayerSpecification): Record<string, string> => {
	if (!isRecord(layer.metadata)) return {};
	const data = layer.metadata[BINDINGS_METADATA_KEY];
	if (!isRecord(data)) return {};
	return Object.fromEntries(
		Object.entries(data).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
	);
};

/** 追加または id 一致の置換。置換時は applyVariableBindings まで行う */
export const upsertVariable = (
	style: StyleSpecification,
	variable: StyleVariable
): StyleSpecification => {
	const variables = getStyleVariables(style);
	const index = variables.findIndex((current) => current.id === variable.id);
	const nextVariables =
		index === -1
			? [...variables, variable]
			: variables.map((current) => (current.id === variable.id ? variable : current));
	return applyVariableBindings(withStyleVariables(style, nextVariables));
};

/** 定義と全レイヤーの該当バインドを取り除く。実体値はそのまま残る (= Figma の detach) */
export const deleteVariable = (
	style: StyleSpecification,
	variableId: string
): StyleSpecification => {
	const nextStyle = withStyleVariables(
		style,
		getStyleVariables(style).filter((variable) => variable.id !== variableId)
	);
	return {
		...nextStyle,
		layers: nextStyle.layers.map((layer) =>
			withLayerBindings(
				layer,
				Object.fromEntries(
					Object.entries(getLayerBindings(layer)).filter(([, id]) => id !== variableId)
				)
			)
		)
	};
};

/** バインドを記録し、同時に変数の現在値をプロパティへ実体化する */
export const bindProperty = (
	style: StyleSpecification,
	layerId: string,
	target: PropertyBindingTarget,
	variableId: string
): StyleSpecification => {
	const variable = getStyleVariables(style).find((current) => current.id === variableId);
	if (
		variable === undefined ||
		(target.slot === 'interpolation'
			? variable.type !== 'interpolation'
			: variable.type === 'interpolation') ||
		!style.layers.some((layer) => layer.id === layerId)
	) {
		return style;
	}

	const nextStyle = {
		...style,
		layers: style.layers.map((layer) =>
			layer.id === layerId
				? withLayerBindings(layer, {
						...getLayerBindings(layer),
						[bindingKeyOf(target)]: variableId
					})
				: layer
		)
	};
	return applyVariableBindings(nextStyle);
};

/** バインド記録のみ削除。実体値は残す */
export const unbindProperty = (
	style: StyleSpecification,
	layerId: string,
	target: PropertyBindingTarget
): StyleSpecification => ({
	...style,
	layers: style.layers.map((layer) => {
		if (layer.id !== layerId) return layer;
		const bindings = getLayerBindings(layer);
		delete bindings[bindingKeyOf(target)];
		return withLayerBindings(layer, bindings);
	})
});

/** 全レイヤーの全バインドを変数の現在値で上書きする。dangling バインドは無視する */
export const applyVariableBindings = (style: StyleSpecification): StyleSpecification => {
	let nextStyle = cloneStyle(style);
	const variables = new Map(
		getStyleVariables(nextStyle).map((variable) => [variable.id, variable])
	);

	for (const layer of [...nextStyle.layers]) {
		for (const [rawTarget, variableId] of Object.entries(getLayerBindings(layer))) {
			const target = parseBindingKey(rawTarget);
			const variable = variables.get(variableId);
			if (target === undefined || variable === undefined) continue;

			let materializedValue: unknown;
			if (target.slot === 'interpolation') {
				const propertyValue = getPropertyValue(layer, target);
				if (variable.type !== 'interpolation' || !isInterpolateExpression(propertyValue)) {
					continue;
				}
				materializedValue = replaceArgAt(propertyValue, 1, variable.value);
			} else {
				if (variable.type === 'interpolation') continue;
				materializedValue = variable.value;
			}

			nextStyle = replaceLayerData(
				nextStyle,
				layer,
				target.group as never,
				target.key as never,
				materializedValue as never
			) as StyleSpecification;
		}
	}
	return nextStyle;
};

/** import 時の正規化: dangling / 不正なバインドを刈り取り、実体値を再適用する */
export const normalizeStyleVariables = (style: StyleSpecification): StyleSpecification => {
	const variables = getStyleVariables(style);
	const variableIds = new Set(variables.map((variable) => variable.id));
	const nextStyle = {
		...withStyleVariables(style, variables),
		layers: style.layers.map((layer) =>
			withLayerBindings(
				layer,
				Object.fromEntries(
					Object.entries(getLayerBindings(layer)).filter(
						([rawTarget, variableId]) =>
							parseBindingKey(rawTarget) !== undefined && variableIds.has(variableId)
					)
				)
			)
		)
	};
	return applyVariableBindings(nextStyle);
};

export const countVariableUsages = (style: StyleSpecification, variableId: string): number =>
	style.layers.reduce(
		(count, layer) =>
			count +
			Object.entries(getLayerBindings(layer)).filter(
				([rawTarget, id]) => parseBindingKey(rawTarget) !== undefined && id === variableId
			).length,
		0
	);

/** バインド先の実体値が変数値と一致しているか (JSON 比較) */
export const getBindingStatus = (
	layer: LayerSpecification,
	target: PropertyBindingTarget,
	variables: StyleVariable[]
): { variable: StyleVariable; stale: boolean } | undefined => {
	const variableId = getLayerBindings(layer)[bindingKeyOf(target)];
	const variable = variables.find((current) => current.id === variableId);
	if (variable === undefined) return undefined;

	const propertyValue = getPropertyValue(layer, target);
	if (target.slot === 'interpolation') {
		if (variable.type !== 'interpolation' || !isInterpolateExpression(propertyValue)) {
			return undefined;
		}
		return {
			variable,
			stale: !valuesEqual(propertyValue[1], variable.value)
		};
	}
	if (variable.type === 'interpolation') return undefined;
	return {
		variable,
		stale: !valuesEqual(propertyValue, variable.value)
	};
};
