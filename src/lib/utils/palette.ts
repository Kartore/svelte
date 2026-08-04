import type { LayerSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';

import { getLayerBindings, parseBindingKey } from '#lib/utils/styleVariables.ts';
import { getLayerProperties } from '#lib/utils/layerSpec.ts';
import { toOKLCH, tryParseColor } from '#lib/utils/color.ts';

export const COLOR_MERGE_DELTA_E = 2.5;

export type StyleColorUsage = {
	layerId: string;
	group: 'paint' | 'layout';
	propertyKey: string;
	color: string;
	canonicalColor: string;
	inExpression: boolean;
	boundVariableId?: string;
};

export type LiteralColorEntry = {
	color: string;
	canonicalColor: string;
	usages: StyleColorUsage[];
	directUsages: StyleColorUsage[];
	expressionUsages: StyleColorUsage[];
};

export const canonicalizeStyleColor = (value: string): string | undefined =>
	tryParseColor(value)?.toFormat('rgba').toString('hexa');

const expressionColors = (value: unknown): string[] => {
	if (typeof value === 'string') return canonicalizeStyleColor(value) ? [value] : [];
	if (Array.isArray(value)) return value.flatMap(expressionColors);
	if (typeof value !== 'object' || value === null) return [];
	return Object.values(value).flatMap(expressionColors);
};

const colorPropertyKeys = (layer: LayerSpecification, group: 'paint' | 'layout'): Set<string> =>
	new Set(
		getLayerProperties(layer.type, group)
			.filter(({ spec }) => spec.type === 'color' || spec.type === 'colorArray')
			.map(({ key }) => key)
	);

export const extractStyleColorUsages = (style: StyleSpecification): StyleColorUsage[] => {
	const usages: StyleColorUsage[] = [];
	for (const layer of style.layers) {
		for (const group of ['paint', 'layout'] as const) {
			const properties = layer[group] as Record<string, unknown> | undefined;
			if (!properties) continue;
			const colorKeys = colorPropertyKeys(layer, group);
			const bindings = getLayerBindings(layer);
			for (const [propertyKey, value] of Object.entries(properties)) {
				if (!colorKeys.has(propertyKey)) continue;
				const boundVariableId = bindings[`${group}:${propertyKey}`];
				if (typeof value === 'string') {
					const normalized = canonicalizeStyleColor(value);
					if (!normalized) continue;
					usages.push({
						layerId: layer.id,
						group,
						propertyKey,
						color: value,
						canonicalColor: normalized,
						inExpression: false,
						...(boundVariableId ? { boundVariableId } : {})
					});
					continue;
				}
				const seen = new Set<string>();
				for (const color of expressionColors(value)) {
					const normalized = canonicalizeStyleColor(color);
					if (!normalized || seen.has(normalized)) continue;
					seen.add(normalized);
					usages.push({
						layerId: layer.id,
						group,
						propertyKey,
						color,
						canonicalColor: normalized,
						inExpression: true,
						...(boundVariableId ? { boundVariableId } : {})
					});
				}
			}
		}
	}
	return usages;
};

export const extractLiteralColors = (style: StyleSpecification): LiteralColorEntry[] => {
	const groups = new Map<string, StyleColorUsage[]>();
	for (const usage of extractStyleColorUsages(style)) {
		if (usage.boundVariableId) continue;
		groups.set(usage.canonicalColor, [...(groups.get(usage.canonicalColor) ?? []), usage]);
	}
	return [...groups]
		.map(([normalized, usages]) => ({
			color: usages[0].color,
			canonicalColor: normalized,
			usages,
			directUsages: usages.filter(({ inExpression }) => !inExpression),
			expressionUsages: usages.filter(({ inExpression }) => inExpression)
		}))
		.sort((left, right) => right.usages.length - left.usages.length);
};

export const variableBindingLocationCount = (style: StyleSpecification): number =>
	style.layers.reduce(
		(count, layer) =>
			count +
			Object.keys(getLayerBindings(layer)).filter((key) => parseBindingKey(key) !== undefined)
				.length,
		0
	);

export const oklchDeltaE = (left: string, right: string): number => {
	const leftColor = tryParseColor(left);
	const rightColor = tryParseColor(right);
	if (!leftColor || !rightColor) return Number.POSITIVE_INFINITY;
	const [leftL, leftC, leftH] = toOKLCH(leftColor);
	const [rightL, rightC, rightH] = toOKLCH(rightColor);
	const leftRadians = (leftH * Math.PI) / 180;
	const rightRadians = (rightH * Math.PI) / 180;
	const leftA = leftC * Math.cos(leftRadians);
	const leftB = leftC * Math.sin(leftRadians);
	const rightA = rightC * Math.cos(rightRadians);
	const rightB = rightC * Math.sin(rightRadians);
	return Math.hypot(leftL - rightL, leftA - rightA, leftB - rightB) * 100;
};

export const isColorWithinDeltaE = (
	left: string,
	right: string,
	threshold = COLOR_MERGE_DELTA_E
): boolean => oklchDeltaE(left, right) <= threshold;

export const replaceDirectColorUsages = (
	style: StyleSpecification,
	usages: StyleColorUsage[],
	nextColor: string
): StyleSpecification => {
	const targets = new Map(
		usages
			.filter(({ inExpression }) => !inExpression)
			.map((usage) => [`${usage.layerId}\0${usage.group}\0${usage.propertyKey}`, usage])
	);
	return {
		...style,
		layers: style.layers.map((layer) => {
			let nextLayer = layer;
			for (const group of ['paint', 'layout'] as const) {
				const properties = layer[group] as Record<string, unknown> | undefined;
				if (!properties) continue;
				for (const propertyKey of Object.keys(properties)) {
					if (!targets.has(`${layer.id}\0${group}\0${propertyKey}`)) continue;
					nextLayer = {
						...nextLayer,
						[group]: {
							...(nextLayer[group] as Record<string, unknown> | undefined),
							[propertyKey]: nextColor
						}
					} as LayerSpecification;
				}
			}
			return nextLayer;
		})
	};
};

export type VariableUsageTarget = {
	layerId: string;
	group: 'paint' | 'layout';
	propertyKey: string;
	slot?: 'interpolation';
};

export const variableUsageTargets = (
	style: StyleSpecification,
	variableId: string
): VariableUsageTarget[] =>
	style.layers.flatMap((layer) =>
		Object.entries(getLayerBindings(layer)).flatMap(([bindingKey, id]) => {
			if (id !== variableId) return [];
			const target = parseBindingKey(bindingKey);
			return target
				? [
						{
							layerId: layer.id,
							group: target.group,
							propertyKey: target.key,
							...(target.slot ? { slot: target.slot } : {})
						}
					]
				: [];
		})
	);
