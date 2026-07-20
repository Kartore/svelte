import {
	createExpression,
	latest,
	type ExpressionSpecification,
	type StylePropertySpecification
} from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import {
	literalToExpression,
	literalToZoomInterpolate,
	removeArgsOrCollapse,
	valueToExpression
} from './expressionEdit.ts';

const expression = (value: unknown[]): ExpressionSpecification => value as ExpressionSpecification;
const stylePropertySpecification = (value: unknown): StylePropertySpecification =>
	value as StylePropertySpecification;

describe('expressionEdit', () => {
	it('wraps primitive and null values without changing their resolved value', () => {
		expect(literalToExpression('fallback')).toEqual(['string', 'fallback']);
		expect(literalToExpression(3)).toEqual(['number', 3]);
		expect(literalToExpression(false)).toEqual(['boolean', false]);
		expect(literalToExpression(null)).toEqual(['literal', null]);
	});

	it('keeps an existing expression when converting a value', () => {
		const child = expression(['get', 'name']);
		expect(valueToExpression(child)).toBe(child);
	});

	it('preserves array literals when converting a property to zoom interpolation', () => {
		const interpolate = literalToZoomInterpolate([4, 8]);
		expect(interpolate).toEqual([
			'interpolate',
			['linear'],
			['zoom'],
			0,
			['literal', [4, 8]],
			22,
			['literal', [4, 8]]
		]);
		expect(
			createExpression(
				interpolate,
				'layout.icon-offset',
				stylePropertySpecification(latest.layout_symbol['icon-offset'])
			).result
		).toBe('success');
	});

	it('removes arguments while the operator remains above its minimum arity', () => {
		expect(
			removeArgsOrCollapse(
				expression(['case', true, 'yes', false, 'no', 'fallback']),
				1,
				2,
				'fallback'
			)
		).toEqual(['case', false, 'no', 'fallback']);
	});

	it('collapses the final case branch to its fallback', () => {
		expect(
			removeArgsOrCollapse(expression(['case', true, 'yes', 'fallback']), 1, 2, 'fallback')
		).toEqual(['string', 'fallback']);
	});

	it('collapses a two-argument operator to its remaining value', () => {
		expect(removeArgsOrCollapse(expression(['+', 1, 2]), 1, 1, 2)).toEqual(['number', 2]);
	});

	it('does not recreate the same assertion when its final literal is removed', () => {
		expect(removeArgsOrCollapse(expression(['number', 2]), 1, 1, 2)).toEqual(['literal', 2]);
		expect(removeArgsOrCollapse(expression(['string', 'value']), 1, 1, 'value')).toEqual([
			'literal',
			'value'
		]);
	});

	it('collapses step to its default after its final required stop is removed', () => {
		expect(removeArgsOrCollapse(expression(['step', ['zoom'], 0, 10, 1]), 3, 2, 0, 4)).toEqual([
			'number',
			0
		]);
	});

	it('collapses interpolate to its output after its final stop is removed', () => {
		expect(
			removeArgsOrCollapse(expression(['interpolate', ['linear'], ['zoom'], 0, 0]), 3, 2, 0)
		).toEqual(['number', 0]);
	});
});
