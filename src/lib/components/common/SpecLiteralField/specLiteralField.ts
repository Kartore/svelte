import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

import { isExpression } from '$lib/components/common/FilterInputField/expressions/utils/isExpression.ts';
import type { StylePropertySpec } from '$lib/utils/layerSpec.ts';

export type SpecLiteralFieldKind =
	'color' | 'number' | 'number-array' | 'number-list' | 'padding' | 'variable-anchor-offset';

export const getSpecLiteralFieldKind = (
	spec: StylePropertySpec,
	value: unknown
): SpecLiteralFieldKind | undefined => {
	if (spec.type === 'color' || (spec.type === 'colorArray' && typeof value !== 'object')) {
		return 'color';
	}
	if (spec.type === 'number' || (spec.type === 'numberArray' && typeof value !== 'object')) {
		return 'number';
	}
	if (spec.type === 'array' && spec.value === 'number') {
		return spec.length === 2 || spec.length === 4 ? 'number-array' : 'number-list';
	}
	if (spec.type === 'padding') return 'padding';
	if (spec.type === 'variableAnchorOffsetCollection') return 'variable-anchor-offset';
	return undefined;
};

export type EditableExpressionLiteral = {
	value: unknown;
	wrapped: boolean;
};

/** A curve output is editable as a property literal unless it is a nested expression. */
export const getEditableExpressionLiteral = (
	value: unknown
): EditableExpressionLiteral | undefined => {
	if (Array.isArray(value) && value[0] === 'literal') {
		return { value: value[1], wrapped: true };
	}
	return isExpression(value) ? undefined : { value, wrapped: false };
};

export const replaceEditableExpressionLiteral = (
	current: EditableExpressionLiteral,
	next: unknown
): unknown => (current.wrapped ? (['literal', next] as ExpressionSpecification) : next);
