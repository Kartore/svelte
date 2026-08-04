import {
	isExpression,
	type LayerSpecification,
	type StyleSpecification
} from '@maplibre/maplibre-gl-style-spec';

const spritePropertyKeys = new Set([
	'icon-image',
	'background-pattern',
	'fill-pattern',
	'line-pattern',
	'fill-extrusion-pattern'
]);

export const valueContainsString = (value: unknown, target: string): boolean => {
	if (value === target) return true;
	if (Array.isArray(value)) return value.some((item) => valueContainsString(item, target));
	if (typeof value !== 'object' || value === null) return false;
	return Object.values(value).some((item) => valueContainsString(item, target));
};

export const spriteUsageLayerIds = (style: StyleSpecification, spriteId: string): string[] =>
	style.layers
		.filter((layer) =>
			(['layout', 'paint'] as const).some((group) =>
				Object.entries(layer[group] ?? {}).some(
					([key, value]) => spritePropertyKeys.has(key) && valueContainsString(value, spriteId)
				)
			)
		)
		.map((layer) => layer.id);

const textFontStrings = (value: unknown): string[] => {
	if (!Array.isArray(value)) return [];
	if (isExpression(value)) {
		if (value[0] === 'literal') return textFontStrings(value[1]);
		return value.slice(1).flatMap((item) => (Array.isArray(item) ? textFontStrings(item) : []));
	}
	if (value.every((item) => typeof item === 'string')) return value;
	return value.flatMap((item) => (Array.isArray(item) ? textFontStrings(item) : []));
};

export const layerTextFontStacks = (layer: LayerSpecification): string[] => {
	const textFont = (layer.layout as Record<string, unknown> | undefined)?.['text-font'];
	return [...new Set(textFontStrings(textFont))];
};

export const fontUsageLayerIds = (style: StyleSpecification, fontstack: string): string[] =>
	style.layers
		.filter((layer) => layerTextFontStacks(layer).includes(fontstack))
		.map((layer) => layer.id);

export const referencedFontStacks = (style: StyleSpecification): string[] => [
	...new Set(style.layers.flatMap(layerTextFontStacks))
];
