import type { LayerSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import {
	buildSelectedCommitStyle,
	createStyleCommitOperations,
	createStyleCommitPlan
} from './styleCommit.ts';

const layer = (id: string, color: string): LayerSpecification =>
	({
		id,
		type: 'line',
		source: 'roads',
		paint: { 'line-color': color }
	}) as LayerSpecification;

const style = (layers: LayerSpecification[]): StyleSpecification => ({
	version: 8,
	name: 'Basis',
	sources: {
		roads: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }
	},
	layers
});

describe('style commit plan', () => {
	it('lists only changed split files with semantic summaries', () => {
		const before = style([layer('a', '#111111'), layer('b', '#222222')]);
		const current = style([layer('a', '#333333'), layer('b', '#222222')]);
		const plan = createStyleCommitPlan({
			beforeStyle: before,
			currentStyle: current,
			previousLayerFiles: { a: 'styles/basic/layers/a.json', b: 'styles/basic/layers/b.json' },
			format: 'split'
		});

		expect(plan.files.map(({ path }) => path)).toEqual(['layers/a.json']);
		expect(plan.files[0].summary).toContain('paint.line-color');
		expect(plan.message).toBe('Update a layer');
	});

	it('builds a partial baseline while leaving unselected changes out', () => {
		const before = style([layer('a', '#111111'), layer('b', '#222222')]);
		const current = style([layer('a', '#333333'), layer('b', '#444444')]);
		const plan = createStyleCommitPlan({
			beforeStyle: before,
			currentStyle: current,
			previousLayerFiles: { a: 'layers/a.json', b: 'layers/b.json' },
			format: 'split'
		});
		const selected = buildSelectedCommitStyle(plan, ['layers/a.json']);

		expect(selected.layers[0].paint).toEqual({ 'line-color': '#333333' });
		expect(selected.layers[1].paint).toEqual({ 'line-color': '#222222' });
	});

	it('automatically includes the manifest for a selected structural layer change', () => {
		const before = style([layer('a', '#111111')]);
		const current = style([layer('new', '#222222'), layer('a', '#111111')]);
		const plan = createStyleCommitPlan({
			beforeStyle: before,
			currentStyle: current,
			previousLayerFiles: { a: 'layers/a.json' },
			format: 'split'
		});
		const operations = createStyleCommitOperations(plan, ['layers/new.json']);

		expect(operations.style.layers.map(({ id }) => id)).toEqual(['new', 'a']);
		expect(operations.files.map(({ path }) => path)).toEqual(['layers.json', 'layers/new.json']);
	});
});
