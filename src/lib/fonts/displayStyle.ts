import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

import { GLYPH_PROTOCOL_TEMPLATE } from './glyphProtocol.ts';

type StyleExpression = unknown[];

const emptyIconName = '__kartore_empty_icon__';
const asResolvedIcon = (value: unknown): unknown => {
	if (Array.isArray(value) && value[0] === 'image') return value;
	if (typeof value === 'string') return ['image', value || emptyIconName];
	return ['image', ['to-string', value]];
};

const asResolvedIconExpression = (expression: StyleExpression): StyleExpression => {
	const [operator, ...args] = expression;

	switch (operator) {
		case 'match':
			return [
				operator,
				args[0],
				...args
					.slice(1, -1)
					.map((value, index) => (index % 2 === 1 ? asResolvedIcon(value) : value)),
				asResolvedIcon(args.at(-1))
			];
		case 'case':
			return [
				operator,
				...args
					.slice(0, -1)
					.map((value, index) => (index % 2 === 1 ? asResolvedIcon(value) : value)),
				asResolvedIcon(args.at(-1))
			];
		case 'step':
			return [
				operator,
				args[0],
				asResolvedIcon(args[1]),
				...args.slice(2).map((value, index) => (index % 2 === 1 ? asResolvedIcon(value) : value))
			];
		case 'interpolate':
		case 'interpolate-hcl':
		case 'interpolate-lab':
			return [
				operator,
				args[0],
				args[1],
				...args.slice(2).map((value, index) => (index % 2 === 1 ? asResolvedIcon(value) : value))
			];
		case 'coalesce':
			return [operator, ...args.map(asResolvedIcon)];
		default:
			return asResolvedIcon(expression) as StyleExpression;
	}
};

const withResolvedIconImage = (layer: LayerSpecification): LayerSpecification => {
	if (layer.type !== 'symbol' || !Array.isArray(layer.layout?.['icon-image'])) return layer;
	if (layer.layout['icon-image'][0] === 'image') return layer;

	return {
		...layer,
		layout: {
			...layer.layout,
			// MapLibre GL JS 5 resolves icon-image expressions as a dedicated image type.
			// The style-spec migrator still emits string expressions, so adapt only the preview copy.
			'icon-image': asResolvedIconExpression(layer.layout['icon-image']) as never
		}
	};
};

export const createDisplayStyle = (
	style: StyleSpecification,
	hasLocalFonts: boolean
): StyleSpecification => {
	let layersChanged = false;
	const layers = style.layers.map((layer) => {
		const displayed = withResolvedIconImage(layer);
		layersChanged ||= displayed !== layer;
		return displayed;
	});

	if (!hasLocalFonts && !layersChanged) return style;

	return {
		...style,
		...(hasLocalFonts ? { glyphs: GLYPH_PROTOCOL_TEMPLATE } : {}),
		...(layersChanged ? { layers } : {})
	};
};
