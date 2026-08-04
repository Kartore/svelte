import type { LayerSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import { bindProperty, upsertVariable } from './styleVariables.ts';
import { styleDiff } from './styleDiff.ts';

const layer = (
	id: string,
	color = '#112233',
	extra: Partial<LayerSpecification> = {}
): LayerSpecification =>
	({
		id,
		type: 'line',
		source: 'roads',
		paint: { 'line-color': color },
		...extra
	}) as LayerSpecification;

const style = (layers: LayerSpecification[] = [layer('road')]): StyleSpecification => ({
	version: 8,
	sources: { roads: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } },
	layers
});

describe('styleDiff representative cases', () => {
	it('reports a property change', () => {
		const before = style();
		const after = style([layer('road', '#445566')]);

		expect(styleDiff(before, after).layers).toMatchObject([
			{
				layerId: 'road',
				kind: 'modified',
				propertyChanges: [
					{ property: 'paint.line-color', path: [], before: '#112233', after: '#445566' }
				]
			}
		]);
	});

	it('reports the exact expression stop path', () => {
		const expression = ['interpolate', ['linear'], ['zoom'], 4, '#112233', 10, '#445566'];
		const changed = structuredClone(expression);
		changed[6] = '#778899';
		const before = style([
			layer('road', '#112233', { paint: { 'line-color': expression } } as never)
		]);
		const after = style([layer('road', '#112233', { paint: { 'line-color': changed } } as never)]);

		expect(styleDiff(before, after).layers[0].propertyChanges).toEqual([
			{ property: 'paint.line-color', path: [6], before: '#445566', after: '#778899' }
		]);
	});

	it('reports relative layer reordering', () => {
		const before = style([layer('a'), layer('b'), layer('c')]);
		const after = style([layer('b'), layer('a'), layer('c')]);

		expect(
			styleDiff(before, after)
				.layers.filter(({ kind }) => kind === 'reordered')
				.map(({ layerId, propertyChanges }) => ({
					layerId,
					before: propertyChanges[0].before,
					after: propertyChanges[0].after
				}))
		).toEqual([
			{ layerId: 'b', before: 1, after: 0 },
			{ layerId: 'a', before: 0, after: 1 }
		]);
	});

	it('reports layer addition and removal without false reorder entries', () => {
		const before = style([layer('old'), layer('keep')]);
		const after = style([layer('new'), layer('keep')]);
		const changes = styleDiff(before, after).layers;

		expect(changes.map(({ layerId, kind }) => [layerId, kind])).toEqual([
			['old', 'removed'],
			['new', 'added']
		]);
	});

	it('counts all materialized locations affected by a variable value change', () => {
		const variable = {
			id: 'brand',
			name: 'road/primary',
			type: 'color' as const,
			value: '#112233'
		};
		let before = upsertVariable(style([layer('a'), layer('b')]), variable);
		before = bindProperty(before, 'a', { group: 'paint', key: 'line-color' }, variable.id);
		before = bindProperty(before, 'b', { group: 'paint', key: 'line-color' }, variable.id);
		const after = upsertVariable(before, { ...variable, value: '#445566' });

		expect(styleDiff(before, after).variables).toEqual([
			{
				variableId: 'brand',
				name: 'road/primary',
				kind: 'modified',
				before: '#112233',
				after: '#445566',
				affectedLayerCount: 2,
				affectedPropertyCount: 2
			}
		]);
	});

	it('returns an empty result when styles are unchanged', () => {
		const before = style([layer('a'), layer('b')]);

		expect(styleDiff(before, structuredClone(before))).toEqual({
			layers: [],
			variables: [],
			hasChanges: false
		});
	});
});
