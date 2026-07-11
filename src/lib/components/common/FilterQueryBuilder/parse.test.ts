import type { FilterSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import { parseFilter } from './parse.ts';
import { serializeFilter } from './serialize.ts';

const asFilter = (value: unknown): FilterSpecification => value as FilterSpecification;

describe('parseFilter', () => {
	it.each([
		[
			['==', 'class', 'motorway'],
			{
				kind: 'comparison',
				op: '==',
				subject: { kind: 'property', key: 'class' },
				value: 'motorway'
			}
		],
		[
			['==', '$type', 'LineString'],
			{
				kind: 'comparison',
				op: '==',
				subject: { kind: 'geometry-type' },
				value: 'LineString'
			}
		],
		[['==', '$id', 5], { kind: 'comparison', op: '==', subject: { kind: 'id' }, value: 5 }]
	])('converts legacy comparison %j', (filter, condition) => {
		expect(parseFilter(asFilter(filter)).children).toEqual([condition]);
	});

	it.each([
		[['in', 'brunnel', 'bridge', 'tunnel'], false, ['bridge', 'tunnel']],
		[['!in', 'brunnel', 'bridge'], true, ['bridge']]
	])('converts legacy membership %j', (filter, negated, values) => {
		expect(parseFilter(asFilter(filter)).children).toEqual([
			{
				kind: 'membership',
				negated,
				subject: { kind: 'property', key: 'brunnel' },
				values
			}
		]);
	});

	it('converts negated legacy exists', () => {
		expect(parseFilter(asFilter(['!has', 'level'])).children).toEqual([
			{ kind: 'exists', negated: true, key: 'level' }
		]);
	});

	it('converts none and strips typeof guards from its children', () => {
		expect(parseFilter(asFilter(['none', ['==', 'class', 'motorway'], ['<', 'level', 3]]))).toEqual(
			{
				kind: 'group',
				op: 'none',
				children: [
					{
						kind: 'comparison',
						op: '==',
						subject: { kind: 'property', key: 'class' },
						value: 'motorway'
					},
					{
						kind: 'comparison',
						op: '<',
						subject: { kind: 'property', key: 'level' },
						value: 3
					}
				]
			}
		);
	});

	it('strips typeof guards inserted below legacy any', () => {
		const parsed = parseFilter(asFilter(['any', ['==', 'class', 'motorway'], ['<', 'level', 3]]));

		expect(parsed.op).toBe('any');
		expect(parsed.children).toEqual([
			{
				kind: 'comparison',
				op: '==',
				subject: { kind: 'property', key: 'class' },
				value: 'motorway'
			},
			{
				kind: 'comparison',
				op: '<',
				subject: { kind: 'property', key: 'level' },
				value: 3
			}
		]);
	});

	it('wraps a singleton legacy all result in the normalized root group', () => {
		expect(parseFilter(asFilter(['all', ['==', 'class', 'motorway']]))).toEqual({
			kind: 'group',
			op: 'all',
			children: [
				{
					kind: 'comparison',
					op: '==',
					subject: { kind: 'property', key: 'class' },
					value: 'motorway'
				}
			]
		});
	});

	it('keeps an unconverted legacy-looking expression child as raw', () => {
		const suspicious = ['all', ['==', '$type', 'LineString'], ['has', 'class']];
		expect(parseFilter(asFilter(suspicious))).toEqual({
			kind: 'group',
			op: 'all',
			children: [
				{ kind: 'raw', expression: ['==', '$type', 'LineString'] },
				{ kind: 'exists', negated: false, key: 'class' }
			]
		});
	});

	it.each([
		[
			['in', ['get', 'brunnel'], ['literal', ['bridge', 'tunnel']]],
			{
				kind: 'membership',
				negated: false,
				subject: { kind: 'property', key: 'brunnel' },
				values: ['bridge', 'tunnel']
			}
		],
		[
			['match', ['get', 'brunnel'], ['bridge', 'tunnel'], true, false],
			{
				kind: 'membership',
				negated: false,
				subject: { kind: 'property', key: 'brunnel' },
				values: ['bridge', 'tunnel']
			}
		],
		[
			['match', ['get', 'brunnel'], ['bridge'], false, true],
			{
				kind: 'membership',
				negated: true,
				subject: { kind: 'property', key: 'brunnel' },
				values: ['bridge']
			}
		],
		[
			['==', ['geometry-type'], 'LineString'],
			{
				kind: 'comparison',
				op: '==',
				subject: { kind: 'geometry-type' },
				value: 'LineString'
			}
		],
		[['==', ['id'], 5], { kind: 'comparison', op: '==', subject: { kind: 'id' }, value: 5 }],
		[['<=', ['zoom'], 10], { kind: 'comparison', op: '<=', subject: { kind: 'zoom' }, value: 10 }]
	])('maps valid expression filter %j', (expression, condition) => {
		expect(parseFilter(asFilter(expression)).children).toEqual([condition]);
	});

	it('maps !any to a none group', () => {
		expect(parseFilter(asFilter(['!', ['any', ['==', ['get', 'a'], 1]]]))).toEqual({
			kind: 'group',
			op: 'none',
			children: [
				{
					kind: 'comparison',
					op: '==',
					subject: { kind: 'property', key: 'a' },
					value: 1
				}
			]
		});
	});

	it('normalizes boolean filters to empty root groups', () => {
		expect(parseFilter(true)).toEqual({ kind: 'group', op: 'all', children: [] });
		expect(parseFilter(false)).toEqual({ kind: 'group', op: 'any', children: [] });
	});

	it('leaves a reversed comparison subject in a raw row', () => {
		const expression = ['<', 3, ['get', 'level']];
		expect(parseFilter(asFilter(expression)).children).toEqual([{ kind: 'raw', expression }]);
	});

	it('preserves raw expressions losslessly in a mixed tree', () => {
		const expression = [
			'all',
			['==', ['get', 'class'], 'motorway'],
			['==', ['+', ['get', 'level'], 1], 3],
			['in', ['get', 'name'], ['concat', 'road', ['to-string', ['id']]]]
		];

		expect(serializeFilter(parseFilter(asFilter(expression)))).toEqual(expression);
	});
});

describe('serializeFilter', () => {
	it('normalizes both match membership forms to in expressions', () => {
		expect(
			serializeFilter(
				parseFilter(asFilter(['match', ['get', 'brunnel'], ['bridge', 'tunnel'], true, false]))
			)
		).toEqual(['all', ['in', ['get', 'brunnel'], ['literal', ['bridge', 'tunnel']]]]);

		expect(
			serializeFilter(parseFilter(asFilter(['match', ['get', 'brunnel'], ['bridge'], false, true])))
		).toEqual(['all', ['!', ['in', ['get', 'brunnel'], ['literal', ['bridge']]]]]);
	});

	it('parses its negated in output back into the same model', () => {
		const parsed = parseFilter(asFilter(['match', ['get', 'brunnel'], ['bridge'], false, true]));
		expect(parseFilter(asFilter(serializeFilter(parsed)))).toEqual(parsed);
	});

	it('promotes a raw JSON expression to a normal row on the next parse', () => {
		expect(parseFilter(asFilter(['<=', ['zoom'], 10])).children[0]).toEqual({
			kind: 'comparison',
			op: '<=',
			subject: { kind: 'zoom' },
			value: 10
		});
	});
});
