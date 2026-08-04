import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';

import {
	getLayerProperties,
	labelFromPropertyKey,
	type LayerPropertyGroup,
	type StylePropertySpec
} from './layerSpec.ts';

export type PropertyRequirement = {
	raw: unknown;
	message: string;
};

export type PropertyCatalogItem = {
	key: string;
	group: LayerPropertyGroup;
	label: string;
	description: string;
	defaultValue: unknown;
	spec: StylePropertySpec;
	requirements: PropertyRequirement[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const requirementMessage = (requirement: unknown): string => {
	if (typeof requirement === 'string') {
		return `Requires ${requirement} to be configured.`;
	}
	if (!isRecord(requirement)) return 'Has an additional style-spec requirement.';
	if (typeof requirement['!'] === 'string') {
		return `Cannot be used together with ${requirement['!']}.`;
	}
	if (typeof requirement.source === 'string') {
		const sourceMessage = `Requires a ${requirement.source} source`;
		if (!isRecord(requirement.has)) return `${sourceMessage}.`;
		const flags = Object.entries(requirement.has)
			.map(([key, value]) => `${key}=${JSON.stringify(value)}`)
			.join(', ');
		return `${sourceMessage} with ${flags}.`;
	}
	const conditions = Object.entries(requirement)
		.map(([key, value]) => `${key}=${JSON.stringify(value)}`)
		.join(', ');
	return `Requires ${conditions}.`;
};

export const extractPropertyRequirements = (
	requires: unknown[] | undefined
): PropertyRequirement[] =>
	(requires ?? []).map((raw) => ({ raw, message: requirementMessage(raw) }));

const propertyDescription = (key: string, spec: StylePropertySpec): string => {
	if (spec.doc) return spec.doc;
	const type = spec.type === 'resolvedImage' ? 'image' : spec.type;
	const units = spec.units ? ` in ${spec.units}` : '';
	return `${labelFromPropertyKey(key)} is a ${type} value${units}.`;
};

export const getLayerPropertyCatalog = (
	layerType: LayerSpecification['type'],
	groups: LayerPropertyGroup[] = ['layout', 'paint']
): PropertyCatalogItem[] =>
	groups.flatMap((group) =>
		getLayerProperties(layerType, group).map(({ key, spec }) => ({
			key,
			group,
			label: labelFromPropertyKey(key, layerType),
			description: propertyDescription(key, spec),
			defaultValue: spec.default,
			spec,
			requirements: extractPropertyRequirements(spec.requires)
		}))
	);

export const getPropertyInitialValue = (item: PropertyCatalogItem): unknown => {
	if (item.defaultValue !== undefined) return structuredClone(item.defaultValue);
	if (item.spec.type === 'number') return 0;
	if (item.spec.type === 'boolean') return false;
	if (item.spec.type === 'color') return '#000000';
	if (item.spec.type === 'enum') return Object.keys(item.spec.values ?? {})[0] ?? '';
	if (item.spec.type === 'array') return [];
	return '';
};
