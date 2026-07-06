import { isExpression, latest } from '@maplibre/maplibre-gl-style-spec';
import type { LayerSpecification, SourceSpecification } from '@maplibre/maplibre-gl-style-spec';

export type StylePropertySpec = {
	type: string;
	default?: unknown;
	minimum?: number;
	maximum?: number;
	units?: string;
	values?: Record<string, unknown>;
	value?: string;
	length?: number;
	requires?: unknown[];
	transition?: boolean;
	expression?: { interpolated?: boolean; parameters?: string[] };
	'property-type'?: string;
};

export type LayerPropertyEntry = { key: string; spec: StylePropertySpec };
export type LayerPropertyGroup = 'paint' | 'layout';

export const getLayerProperties = (
	type: LayerSpecification['type'],
	group: LayerPropertyGroup
): LayerPropertyEntry[] => {
	const specGroup = (latest as Record<string, unknown>)[`${group}_${type}`] as
		Record<string, StylePropertySpec> | undefined;

	return Object.entries(specGroup ?? {})
		.map(([key, spec]) => ({ key, spec }))
		.sort((a, b) => {
			if (a.key === 'visibility') return -1;
			if (b.key === 'visibility') return 1;
			return 0;
		});
};

export const getLayerRawPropertyValue = (
	layer: LayerSpecification,
	group: LayerPropertyGroup,
	key: string
): unknown => {
	return (layer[group] as Record<string, unknown> | undefined)?.[key];
};

const getPropertyEntry = (
	layerType: LayerSpecification['type'],
	key: string
): (LayerPropertyEntry & { group: LayerPropertyGroup }) | undefined => {
	for (const group of ['layout', 'paint'] as const) {
		const entry = getLayerProperties(layerType, group).find((property) => property.key === key);
		if (entry) return { ...entry, group };
	}
};

const getLayerEffectivePropertyValue = (layer: LayerSpecification, key: string): unknown => {
	const entry = getPropertyEntry(layer.type, key);
	if (!entry) return undefined;

	return getLayerRawPropertyValue(layer, entry.group, key) ?? entry.spec.default;
};

const isObject = (value: unknown): value is Record<string, unknown> => {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const matchesRequirementValue = (actual: unknown, expected: unknown): boolean => {
	if (isExpression(actual)) return true;
	if (Array.isArray(expected)) {
		return expected.some((value) => Object.is(value, actual));
	}
	return Object.is(actual, expected);
};

const matchesSourceRequirement = (
	layer: LayerSpecification,
	requirement: Record<string, unknown>,
	sources: { [key: string]: SourceSpecification } | undefined
): boolean => {
	if (sources === undefined || !('source' in layer)) return false;

	const source = sources[layer.source];
	if (source === undefined || source.type !== requirement.source) return false;

	const has = requirement.has;
	if (!isObject(has)) return true;

	return Object.entries(has).every(([key, value]) => {
		return Object.is((source as Record<string, unknown>)[key], value);
	});
};

export const isPropertyActive = (
	layer: LayerSpecification,
	requires: unknown[] | undefined,
	sources?: { [key: string]: SourceSpecification }
): boolean => {
	return (requires ?? []).every((requirement) => {
		if (typeof requirement === 'string') {
			const entry = getPropertyEntry(layer.type, requirement);
			return entry
				? getLayerRawPropertyValue(layer, entry.group, requirement) !== undefined
				: false;
		}

		if (!isObject(requirement)) return true;

		if ('source' in requirement) return matchesSourceRequirement(layer, requirement, sources);

		if (typeof requirement['!'] === 'string') {
			const key = requirement['!'];
			const entry = getPropertyEntry(layer.type, key);
			return entry ? getLayerRawPropertyValue(layer, entry.group, key) === undefined : true;
		}

		return Object.entries(requirement).every(([key, expected]) => {
			return matchesRequirementValue(getLayerEffectivePropertyValue(layer, key), expected);
		});
	});
};

export const labelFromPropertyKey = (
	key: string,
	layerType: LayerSpecification['type'],
	stripPrefix?: string
): string => {
	const layerStripped = key.startsWith(`${layerType}-`) ? key.slice(layerType.length + 1) : key;
	const prefixStripped =
		stripPrefix !== undefined && layerStripped.startsWith(stripPrefix)
			? layerStripped.slice(stripPrefix.length)
			: layerStripped;
	// prefix がキー全体と一致した場合 ('visibility' など) は除去せずキー名をラベルにする
	const stripped = prefixStripped === '' ? layerStripped : prefixStripped;
	return stripped
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};
