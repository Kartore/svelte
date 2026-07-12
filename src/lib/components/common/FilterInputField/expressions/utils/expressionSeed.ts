import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

import type {
	ExpressionPropertySuggestion,
	ExpressionSuggestionValue,
	ExpressionSuggestions
} from '$lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';
import type { StylePropertySpec } from '$lib/utils/layerSpec.ts';

type ExpressionValueKind = 'array' | 'boolean' | 'color' | 'number' | 'string' | 'unknown';

type SuggestedExpressionOptions = {
	propertyKey?: string;
	propertySpec?: StylePropertySpec;
	suggestions?: ExpressionSuggestions;
};

const STYLE_PREFIXES = new Set([
	'background',
	'circle',
	'fill',
	'heatmap',
	'hillshade',
	'icon',
	'line',
	'raster',
	'symbol',
	'text'
]);

const RELATED_FIELD_TOKENS: Record<string, string[]> = {
	color: ['colour', 'fill', 'hex', 'rgb', 'stroke'],
	field: ['label', 'name', 'text', 'title'],
	height: ['elevation', 'height', 'level', 'z'],
	image: ['icon', 'image', 'marker', 'sprite'],
	opacity: ['alpha', 'opacity'],
	offset: ['offset', 'x', 'y'],
	radius: ['radius', 'size'],
	rotate: ['angle', 'bearing', 'rotation'],
	size: ['height', 'radius', 'size', 'width'],
	sort: ['order', 'priority', 'rank'],
	width: ['weight', 'width']
};

const tokenize = (value: string): string[] => {
	return value
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter(Boolean);
};

const getPropertyTokens = (propertyKey: string | undefined): string[] => {
	const tokens = tokenize(propertyKey ?? '');
	return tokens.length > 1 && STYLE_PREFIXES.has(tokens[0]) ? tokens.slice(1) : tokens;
};

const getSpecKind = (
	propertySpec: StylePropertySpec | undefined,
	value: unknown
): ExpressionValueKind => {
	switch (propertySpec?.type) {
		case 'boolean':
			return 'boolean';
		case 'color':
			return 'color';
		case 'number':
			return 'number';
		case 'enum':
		case 'formatted':
		case 'resolvedImage':
			return 'string';
		case 'array':
		case 'colorArray':
		case 'numberArray':
		case 'padding':
		case 'variableAnchorOffsetCollection':
			return 'array';
	}

	if (Array.isArray(value)) return 'array';
	if (typeof value === 'boolean') return 'boolean';
	if (typeof value === 'number') return 'number';
	if (typeof value === 'string') return 'string';
	return 'unknown';
};

const normalizeFieldType = (type: string | undefined): ExpressionValueKind => {
	const normalized = type?.toLowerCase();
	if (!normalized) return 'unknown';
	if (/(bool)/.test(normalized)) return 'boolean';
	if (/(double|float|int|number|numeric)/.test(normalized)) return 'number';
	if (/(array|list)/.test(normalized)) return 'array';
	if (/(char|string|text)/.test(normalized)) return 'string';
	return 'unknown';
};

const inferValueKind = (values: ExpressionSuggestionValue[]): ExpressionValueKind => {
	const kinds = new Set(values.map((value) => typeof value));
	if (kinds.size !== 1) return 'unknown';
	const [kind] = kinds;
	return kind === 'boolean' || kind === 'number' || kind === 'string' ? kind : 'unknown';
};

const isCompatible = (
	propertyKind: ExpressionValueKind,
	fieldKind: ExpressionValueKind
): boolean => {
	if (propertyKind === 'unknown') return fieldKind !== 'unknown';
	if (propertyKind === 'color') return fieldKind === 'string';
	return propertyKind === fieldKind;
};

const getSemanticScore = (propertyTokens: string[], fieldName: string): number => {
	if (propertyTokens.length === 0) return 0;
	const fieldTokens = new Set(tokenize(fieldName));
	let score = 0;
	for (const propertyToken of propertyTokens) {
		if (fieldTokens.has(propertyToken)) score += 40;
		for (const relatedToken of RELATED_FIELD_TOKENS[propertyToken] ?? []) {
			if (fieldTokens.has(relatedToken)) score += 18;
		}
	}
	return score;
};

const getFieldKind = (
	field: ExpressionPropertySuggestion,
	suggestions: ExpressionSuggestions
): ExpressionValueKind => {
	const declaredKind = normalizeFieldType(field.type);
	return declaredKind === 'unknown'
		? inferValueKind(suggestions.getValueSuggestions(field.name))
		: declaredKind;
};

export const selectSuggestedProperty = (
	propertySpec: StylePropertySpec | undefined,
	propertyKey: string | undefined,
	value: unknown,
	suggestions: ExpressionSuggestions | undefined
): ExpressionPropertySuggestion | undefined => {
	if (!suggestions) return undefined;
	const propertyKind = getSpecKind(propertySpec, value);
	const propertyTokens = getPropertyTokens(propertyKey);

	const candidates = suggestions.propertyKeys
		.map((field) => {
			const fieldKind = getFieldKind(field, suggestions);
			const semanticScore = getSemanticScore(propertyTokens, field.name);
			return {
				field,
				fieldKind,
				semanticScore,
				score:
					(isCompatible(propertyKind, fieldKind) ? 50 : 0) +
					semanticScore +
					(field.origin === 'tilejson' || field.origin === 'both' ? 4 : 0) +
					Math.min(field.sampleCount ?? 0, 5)
			};
		})
		.filter(({ fieldKind, semanticScore }) => {
			if (!isCompatible(propertyKind, fieldKind)) return false;
			// A generic string field is not a safe color source. Require a color-related name.
			return propertyKind !== 'color' || semanticScore > 0;
		})
		.sort((a, b) => b.score - a.score || a.field.name.localeCompare(b.field.name));

	return candidates[0]?.field;
};

const asExpressionLiteral = (value: unknown): unknown => {
	const normalized = value === undefined ? '' : value;
	return normalized !== null && typeof normalized === 'object'
		? (['literal', normalized] as ExpressionSpecification)
		: normalized;
};

/**
 * Seeds a property expression with source data when TileJSON/loaded-tile metadata
 * offers a compatible field. The current literal remains the fallback, so missing
 * feature properties do not change the rendered value. Without a useful field,
 * start with a value-preserving coalesce instead of a meaningless primitive cast.
 */
export const literalToSuggestedExpression = (
	value: unknown,
	options: SuggestedExpressionOptions = {}
): ExpressionSpecification => {
	const fallback = asExpressionLiteral(value);
	const kind = getSpecKind(options.propertySpec, value);
	const field = selectSuggestedProperty(
		options.propertySpec,
		options.propertyKey,
		value,
		options.suggestions
	);

	if (!field) return ['coalesce', fallback] as ExpressionSpecification;
	const get = ['get', field.name] as ExpressionSpecification;
	return kind === 'color'
		? (['to-color', get, fallback] as ExpressionSpecification)
		: (['coalesce', get, fallback] as ExpressionSpecification);
};
