import { isExpression, latest } from '@maplibre/maplibre-gl-style-spec';
import type { LayerSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';

type JsonObject = Record<string, unknown>;
type PropertyReference = { default?: unknown; transition?: boolean };

const reference = latest as unknown as Record<string, unknown>;
const DEFAULT_TRANSITION = { duration: 300, delay: 0 } as const;

const isObject = (value: unknown): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const deepEqual = (left: unknown, right: unknown): boolean => {
	if (Object.is(left, right)) return true;
	if (Array.isArray(left) || Array.isArray(right)) {
		return (
			Array.isArray(left) &&
			Array.isArray(right) &&
			left.length === right.length &&
			left.every((value, index) => deepEqual(value, right[index]))
		);
	}
	if (!isObject(left) || !isObject(right)) return false;

	const leftKeys = Object.keys(left).sort();
	const rightKeys = Object.keys(right).sort();
	return (
		leftKeys.length === rightKeys.length &&
		leftKeys.every((key, index) => key === rightKeys[index] && deepEqual(left[key], right[key]))
	);
};

const propertyReference = (
	layerType: string,
	group: 'paint' | 'layout',
	key: string
): PropertyReference | undefined => {
	const section = reference[`${group}_${layerType}`];
	if (!isObject(section)) return undefined;
	const property = section[key];
	return isObject(property) ? (property as PropertyReference) : undefined;
};

const isDefaultTransition = (
	layerType: string,
	group: 'paint' | 'layout',
	key: string,
	value: unknown
): boolean => {
	if (!key.endsWith('-transition') || !isObject(value)) return false;
	const propertyKey = key.slice(0, -'-transition'.length);
	if (!propertyReference(layerType, group, propertyKey)?.transition) return false;
	if (Object.keys(value).some((field) => field !== 'duration' && field !== 'delay')) return false;

	return (
		(value.duration ?? DEFAULT_TRANSITION.duration) === DEFAULT_TRANSITION.duration &&
		(value.delay ?? DEFAULT_TRANSITION.delay) === DEFAULT_TRANSITION.delay
	);
};

const pruneGroup = (
	layerType: string,
	group: 'paint' | 'layout',
	properties: JsonObject
): JsonObject | undefined => {
	const next: JsonObject = {};
	for (const [key, value] of Object.entries(properties)) {
		if (isDefaultTransition(layerType, group, key, value)) continue;
		const property = propertyReference(layerType, group, key);
		const isLiteral = !Array.isArray(value) || !isExpression(value);
		if (isLiteral && property && 'default' in property && deepEqual(value, property.default)) {
			continue;
		}
		next[key] = value;
	}
	return Object.keys(next).length > 0 ? next : undefined;
};

const pruneLayer = (layer: LayerSpecification): LayerSpecification => {
	const source = layer as LayerSpecification & { paint?: JsonObject; layout?: JsonObject };
	const next = { ...source } as LayerSpecification & { paint?: JsonObject; layout?: JsonObject };

	if (source.paint) {
		const paint = pruneGroup(source.type, 'paint', source.paint);
		if (paint) next.paint = paint;
		else delete next.paint;
	}
	if (source.layout) {
		const layout = pruneGroup(source.type, 'layout', source.layout);
		if (layout) next.layout = layout;
		else delete next.layout;
	}

	return next;
};

/**
 * runtime style spec の既定値と同値な layer paint/layout の literal だけを削除する。
 * 入力は変更せず、永続保存には使わない import/export 境界向けの純関数。
 */
export const pruneDefaultValues = (style: StyleSpecification): StyleSpecification => ({
	...style,
	layers: style.layers.map(pruneLayer)
});
