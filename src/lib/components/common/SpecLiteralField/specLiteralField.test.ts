import { describe, expect, it } from 'vitest';

import type { StylePropertySpec } from '$lib/utils/layerSpec.ts';

import {
	getEditableExpressionLiteral,
	getSpecLiteralFieldKind,
	replaceEditableExpressionLiteral
} from './specLiteralField.ts';

const spec = (value: Partial<StylePropertySpec>): StylePropertySpec => ({
	type: 'number',
	...value
});

describe('specLiteralField', () => {
	it('selects the sidebar input kind from the property specification', () => {
		expect(getSpecLiteralFieldKind(spec({ type: 'color' }), '#fff')).toBe('color');
		expect(getSpecLiteralFieldKind(spec({ type: 'number' }), 2)).toBe('number');
		expect(
			getSpecLiteralFieldKind(spec({ type: 'array', value: 'number', length: 2 }), [1, 2])
		).toBe('number-array');
		expect(getSpecLiteralFieldKind(spec({ type: 'padding' }), [1, 2, 3, 4])).toBe('padding');
		expect(
			getSpecLiteralFieldKind(spec({ type: 'variableAnchorOffsetCollection' }), ['top', [0, 1]])
		).toBe('variable-anchor-offset');
	});

	it('unwraps literal expressions while leaving nested expressions to the expression editor', () => {
		expect(getEditableExpressionLiteral(['literal', [1, 2]])).toEqual({
			value: [1, 2],
			wrapped: true
		});
		expect(getEditableExpressionLiteral([1, 2])).toEqual({ value: [1, 2], wrapped: false });
		expect(getEditableExpressionLiteral(['get', 'offset'])).toBeUndefined();
	});

	it('keeps the literal wrapper when a sidebar input updates a curve output', () => {
		const current = getEditableExpressionLiteral(['literal', [1, 2]]);
		expect(current).toBeDefined();
		expect(replaceEditableExpressionLiteral(current!, [3, 4])).toEqual(['literal', [3, 4]]);
	});
});
