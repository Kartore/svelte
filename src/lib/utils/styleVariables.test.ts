import type { ExpressionSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import {
	applyVariableBindings,
	BINDINGS_METADATA_KEY,
	bindingKeyOf,
	bindProperty,
	countVariableUsages,
	deleteVariable,
	getBindingStatus,
	getLayerBindings,
	getStyleVariables,
	normalizeStyleVariables,
	parseBindingKey,
	type StyleVariable,
	unbindProperty,
	upsertVariable,
	VARIABLES_METADATA_KEY
} from './styleVariables.ts';

const colorVariable: StyleVariable = {
	id: 'primary',
	name: 'Primary',
	type: 'color',
	value: '#ff0000'
};

const numberVariable: StyleVariable = {
	id: 'width',
	name: 'Width',
	type: 'number',
	value: 4
};

const interpolationVariable: StyleVariable = {
	id: 'curve',
	name: 'Curve',
	type: 'interpolation',
	value: ['exponential', 1.4]
};

const styleWithVariables = (
	variables: StyleVariable[],
	layers: StyleSpecification['layers'] = []
): StyleSpecification => ({
	version: 8,
	sources: {},
	layers,
	metadata: {
		owner: 'kartore',
		[VARIABLES_METADATA_KEY]: {
			version: 1,
			variables
		}
	}
});

const paintValue = (style: StyleSpecification, layerIndex: number, key: string): unknown =>
	(style.layers[layerIndex].paint as Record<string, unknown> | undefined)?.[key];

describe('style variable metadata', () => {
	it('returns no variables when metadata is absent or malformed', () => {
		const plainStyle = styleWithVariables([]);
		delete plainStyle.metadata;

		expect(getStyleVariables(plainStyle)).toEqual([]);
		expect(
			getStyleVariables({
				...plainStyle,
				metadata: {
					[VARIABLES_METADATA_KEY]: { version: 1, variables: 'not-an-array' }
				}
			})
		).toEqual([]);
		expect(
			getStyleVariables({
				...plainStyle,
				metadata: {
					[VARIABLES_METADATA_KEY]: {
						version: 1,
						variables: [
							colorVariable,
							{ ...numberVariable, value: '4' },
							{ ...interpolationVariable, value: ['exponential', '1.4'] }
						]
					}
				}
			})
		).toEqual([colorVariable]);
	});

	it('round-trips valid binding keys and rejects malformed keys', () => {
		expect(bindingKeyOf({ group: 'paint', key: 'fill-color' })).toBe('paint:fill-color');
		expect(bindingKeyOf({ group: 'layout', key: 'line-width', slot: 'interpolation' })).toBe(
			'layout:line-width@interpolation'
		);
		expect(parseBindingKey('paint:fill-color')).toEqual({
			group: 'paint',
			key: 'fill-color'
		});
		expect(parseBindingKey('layout:line-width@interpolation')).toEqual({
			group: 'layout',
			key: 'line-width',
			slot: 'interpolation'
		});
		expect(parseBindingKey('filter:class')).toBeUndefined();
		expect(parseBindingKey('paint:fill-color@unknown')).toBeUndefined();
		expect(parseBindingKey('paint:')).toBeUndefined();
	});

	it('filters malformed layer binding values', () => {
		const layer = {
			id: 'background',
			type: 'background',
			metadata: {
				[BINDINGS_METADATA_KEY]: {
					'paint:background-color': 'primary',
					'paint:background-opacity': 1
				}
			}
		} satisfies StyleSpecification['layers'][number];

		expect(getLayerBindings(layer)).toEqual({
			'paint:background-color': 'primary'
		});
	});
});

describe('style variable transforms', () => {
	it('adds a variable and reapplies an updated value to bound layers', () => {
		const style = styleWithVariables(
			[colorVariable],
			[
				{
					id: 'background',
					type: 'background',
					metadata: {
						[BINDINGS_METADATA_KEY]: {
							'paint:background-color': colorVariable.id
						}
					},
					paint: { 'background-color': '#000000' }
				}
			]
		);
		const before = structuredClone(style);

		const withNumber = upsertVariable(style, numberVariable);
		const updated = upsertVariable(withNumber, { ...colorVariable, value: '#00ff00' });

		expect(getStyleVariables(withNumber)).toEqual([colorVariable, numberVariable]);
		expect(getStyleVariables(updated)).toEqual([
			{ ...colorVariable, value: '#00ff00' },
			numberVariable
		]);
		expect(paintValue(updated, 0, 'background-color')).toBe('#00ff00');
		expect(style).toEqual(before);
	});

	it('binds and unbinds a literal while preserving the materialized value', () => {
		const style = styleWithVariables(
			[colorVariable],
			[
				{
					id: 'background',
					type: 'background',
					metadata: { owner: 'kartore' },
					paint: { 'background-color': '#000000' }
				}
			]
		);
		const target = { group: 'paint', key: 'background-color' } as const;

		const bound = bindProperty(style, 'background', target, colorVariable.id);
		const unbound = unbindProperty(bound, 'background', target);

		expect(getLayerBindings(bound.layers[0])).toEqual({
			'paint:background-color': colorVariable.id
		});
		expect(paintValue(bound, 0, 'background-color')).toBe(colorVariable.value);
		expect(getLayerBindings(unbound.layers[0])).toEqual({});
		expect(paintValue(unbound, 0, 'background-color')).toBe(colorVariable.value);
		expect(unbound.layers[0].metadata).toEqual({ owner: 'kartore' });
	});

	it('deletes a definition and all of its bindings without changing materialized values', () => {
		const style = styleWithVariables(
			[colorVariable, numberVariable],
			[
				{
					id: 'background',
					type: 'background',
					metadata: {
						[BINDINGS_METADATA_KEY]: {
							'paint:background-color': colorVariable.id,
							'paint:background-opacity': numberVariable.id
						}
					},
					paint: { 'background-color': colorVariable.value, 'background-opacity': 0.5 }
				},
				{
					id: 'background-copy',
					type: 'background',
					metadata: {
						[BINDINGS_METADATA_KEY]: {
							'paint:background-color': colorVariable.id
						}
					},
					paint: { 'background-color': colorVariable.value }
				}
			]
		);

		const deleted = deleteVariable(style, colorVariable.id);

		expect(getStyleVariables(deleted)).toEqual([numberVariable]);
		expect(getLayerBindings(deleted.layers[0])).toEqual({
			'paint:background-opacity': numberVariable.id
		});
		expect(getLayerBindings(deleted.layers[1])).toEqual({});
		expect(paintValue(deleted, 0, 'background-color')).toBe(colorVariable.value);
		expect(paintValue(deleted, 1, 'background-color')).toBe(colorVariable.value);
	});

	it('replaces only the interpolation argument and leaves stops untouched', () => {
		const expression: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 0, 1, 22, 4];
		const style = styleWithVariables(
			[interpolationVariable],
			[
				{
					id: 'road',
					type: 'line',
					source: 'roads',
					paint: { 'line-width': expression }
				}
			]
		);
		const before = structuredClone(style);

		const bound = bindProperty(
			style,
			'road',
			{ group: 'paint', key: 'line-width', slot: 'interpolation' },
			interpolationVariable.id
		);

		expect(paintValue(bound, 0, 'line-width')).toEqual([
			'interpolate',
			interpolationVariable.value,
			['zoom'],
			0,
			1,
			22,
			4
		]);
		expect(style).toEqual(before);
	});

	it('prunes dangling bindings during normalization and applies valid bindings', () => {
		const style = styleWithVariables(
			[colorVariable],
			[
				{
					id: 'background',
					type: 'background',
					metadata: {
						[BINDINGS_METADATA_KEY]: {
							'paint:background-color': colorVariable.id,
							'paint:background-opacity': 'missing',
							'invalid-key': colorVariable.id
						}
					},
					paint: { 'background-color': '#000000', 'background-opacity': 0.5 }
				}
			]
		);

		const normalized = normalizeStyleVariables(style);

		expect(getLayerBindings(normalized.layers[0])).toEqual({
			'paint:background-color': colorVariable.id
		});
		expect(paintValue(normalized, 0, 'background-color')).toBe(colorVariable.value);
		expect(paintValue(normalized, 0, 'background-opacity')).toBe(0.5);
	});

	it('counts usages and reports current, stale, and missing binding states', () => {
		const target = { group: 'paint', key: 'background-color' } as const;
		const style = styleWithVariables(
			[colorVariable],
			[
				{
					id: 'background',
					type: 'background',
					metadata: {
						[BINDINGS_METADATA_KEY]: {
							[bindingKeyOf(target)]: colorVariable.id
						}
					},
					paint: { 'background-color': colorVariable.value }
				},
				{
					id: 'background-copy',
					type: 'background',
					metadata: {
						[BINDINGS_METADATA_KEY]: {
							[bindingKeyOf(target)]: colorVariable.id
						}
					},
					paint: { 'background-color': '#000000' }
				}
			]
		);

		expect(countVariableUsages(style, colorVariable.id)).toBe(2);
		expect(getBindingStatus(style.layers[0], target, [colorVariable])).toEqual({
			variable: colorVariable,
			stale: false
		});
		expect(getBindingStatus(style.layers[1], target, [colorVariable])).toEqual({
			variable: colorVariable,
			stale: true
		});
		expect(getBindingStatus(style.layers[0], target, [])).toBeUndefined();
	});

	it('keeps every pure transform from mutating its input', () => {
		const target = { group: 'paint', key: 'background-opacity' } as const;
		const style = styleWithVariables(
			[numberVariable],
			[
				{
					id: 'background',
					type: 'background',
					metadata: {
						[BINDINGS_METADATA_KEY]: {
							[bindingKeyOf(target)]: numberVariable.id
						}
					},
					paint: { 'background-opacity': 0.5 }
				}
			]
		);
		const operations = [
			(input: StyleSpecification) => applyVariableBindings(input),
			(input: StyleSpecification) => upsertVariable(input, { ...numberVariable, value: 8 }),
			(input: StyleSpecification) => deleteVariable(input, numberVariable.id),
			(input: StyleSpecification) => bindProperty(input, 'background', target, numberVariable.id),
			(input: StyleSpecification) => unbindProperty(input, 'background', target),
			(input: StyleSpecification) => normalizeStyleVariables(input)
		];

		for (const operation of operations) {
			const input = structuredClone(style);
			const before = structuredClone(input);
			operation(input);
			expect(input).toEqual(before);
		}
	});
});
