import {
	createExpression,
	latest,
	type ExpressionSpecification,
	type StylePropertySpecification
} from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import type { ExpressionSuggestions } from '$lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';

import { literalToSuggestedExpression, selectSuggestedProperty } from './expressionSeed.ts';

const stylePropertySpecification = (value: unknown): StylePropertySpecification =>
	value as StylePropertySpecification;

const suggestions = (
	fields: ExpressionSuggestions['propertyKeys'],
	values: Record<string, (string | number | boolean)[]> = {}
): ExpressionSuggestions => ({
	propertyKeys: fields,
	getValueSuggestions: (key) => values[key] ?? []
});

describe('expressionSeed', () => {
	it('uses a related TileJSON string field for a text property and keeps the literal fallback', () => {
		const result = literalToSuggestedExpression('Untitled', {
			propertyKey: 'text-field',
			propertySpec: latest.layout_symbol['text-field'],
			suggestions: suggestions([
				{ name: 'class', type: 'String', origin: 'tilejson' },
				{ name: 'name', type: 'String', origin: 'both', sampleCount: 4 }
			])
		});

		expect(result).toEqual(['coalesce', ['get', 'name'], 'Untitled']);
		expect(
			createExpression(
				result,
				'layout.text-field',
				stylePropertySpecification(latest.layout_symbol['text-field'])
			).result
		).toBe('success');
	});

	it('selects a numeric field for a numeric property', () => {
		const result = literalToSuggestedExpression(2, {
			propertyKey: 'line-width',
			propertySpec: latest.paint_line['line-width'],
			suggestions: suggestions([
				{ name: 'name', type: 'String' },
				{ name: 'width', type: 'Number', origin: 'tilejson' }
			])
		});

		expect(result).toEqual(['coalesce', ['get', 'width'], 2]);
		expect(
			createExpression(
				result,
				'paint.line-width',
				stylePropertySpecification(latest.paint_line['line-width'])
			).result
		).toBe('success');
	});

	it('uses an explicit color conversion only for a color-related string field', () => {
		const sourceSuggestions = suggestions([
			{ name: 'name', type: 'String' },
			{ name: 'stroke_color', type: 'String', origin: 'both', sampleCount: 2 }
		]);
		const result = literalToSuggestedExpression('#336699', {
			propertyKey: 'fill-color',
			propertySpec: latest.paint_fill['fill-color'],
			suggestions: sourceSuggestions
		});

		expect(result).toEqual(['to-color', ['get', 'stroke_color'], '#336699']);
		expect(
			createExpression(
				result,
				'paint.fill-color',
				stylePropertySpecification(latest.paint_fill['fill-color'])
			).result
		).toBe('success');
	});

	it('does not treat an unrelated string field as a color', () => {
		const sourceSuggestions = suggestions([{ name: 'name', type: 'String' }]);
		expect(
			selectSuggestedProperty(
				latest.paint_fill['fill-color'],
				'fill-color',
				'#336699',
				sourceSuggestions
			)
		).toBeUndefined();
		expect(
			literalToSuggestedExpression('#336699', {
				propertyKey: 'fill-color',
				propertySpec: latest.paint_fill['fill-color'],
				suggestions: sourceSuggestions
			})
		).toEqual(['coalesce', '#336699']);
	});

	it('infers field types from loaded feature values when TileJSON has no type', () => {
		const result = literalToSuggestedExpression(false, {
			propertySpec: { type: 'boolean' },
			suggestions: suggestions([{ name: 'active', origin: 'features' }], {
				active: [true, false]
			})
		});

		expect(result).toEqual(['coalesce', ['get', 'active'], false]);
	});

	it('preserves complex literals without source suggestions', () => {
		const result = literalToSuggestedExpression([4, 8], {
			propertySpec: latest.layout_symbol['icon-offset']
		});
		expect(result).toEqual(['coalesce', ['literal', [4, 8]]]);
		expect(
			createExpression(
				result as ExpressionSpecification,
				'layout.icon-offset',
				stylePropertySpecification(latest.layout_symbol['icon-offset'])
			).result
		).toBe('success');
	});
});
