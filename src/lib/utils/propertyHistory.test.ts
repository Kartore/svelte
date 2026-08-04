import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import type { StyleHistoryProvider, StyleHistoryRevision } from '#lib/editor/EditorModule.ts';

import {
	computeHistoryEntries,
	extractLayerPropertyValue,
	extractPropertyValue,
	loadPropertyRevisionValue,
	type PropertyRevisionValue
} from './propertyHistory.ts';

const revision = (id: string): StyleHistoryRevision => ({
	id,
	message: `Revision ${id}`,
	authorName: 'Map editor',
	authoredAt: '2026-07-13T00:00:00Z'
});

const value = (id: string, propertyValue: unknown): PropertyRevisionValue => ({
	revision: revision(id),
	state: 'value',
	value: propertyValue
});

describe('extractPropertyValue', () => {
	const style = {
		version: 8,
		sources: {},
		layers: [
			{
				id: 'water',
				type: 'fill',
				source: 'basemap',
				filter: ['==', ['get', 'class'], 'river'],
				paint: { 'fill-color': '#2266aa' }
			}
		]
	} as StyleSpecification;

	it('extracts a paint, layout, or filter value from an existing layer', () => {
		expect(extractPropertyValue(style, 'water', 'paint', 'fill-color')).toEqual({
			found: true,
			value: '#2266aa'
		});
		expect(extractPropertyValue(style, 'water', 'layout', 'visibility')).toEqual({
			found: true,
			value: undefined
		});
		expect(extractPropertyValue(style, 'water', 'filter', 'filter')).toEqual({
			found: true,
			value: ['==', ['get', 'class'], 'river']
		});
	});

	it('treats an absent filter as an unset value on an existing layer', () => {
		expect(extractPropertyValue(style, 'water', 'filter', 'filter')).toEqual({
			found: true,
			value: ['==', ['get', 'class'], 'river']
		});

		const styleWithoutFilter = structuredClone(style);
		delete (styleWithoutFilter.layers[0] as { filter?: unknown }).filter;
		expect(extractPropertyValue(styleWithoutFilter, 'water', 'filter', 'filter')).toEqual({
			found: true,
			value: undefined
		});
	});

	it('distinguishes a missing layer from an unset property', () => {
		expect(extractPropertyValue(style, 'road', 'paint', 'line-color')).toEqual({
			found: false,
			value: undefined
		});
	});

	it('extracts directly from a layer without requiring a full style', () => {
		const layer = style.layers[0];

		expect(extractLayerPropertyValue(layer, 'paint', 'fill-color')).toBe('#2266aa');
		expect(extractLayerPropertyValue(layer, 'layout', 'visibility')).toBeUndefined();
		expect(extractLayerPropertyValue(layer, 'filter', 'filter')).toEqual([
			'==',
			['get', 'class'],
			'river'
		]);
	});
});

describe('loadPropertyRevisionValue', () => {
	const layer = {
		id: 'water',
		type: 'fill',
		source: 'basemap',
		paint: { 'fill-color': '#2266aa' }
	} satisfies LayerSpecification;

	const provider = (overrides: Partial<StyleHistoryProvider> = {}): StyleHistoryProvider => ({
		available: true,
		label: 'example/style@main',
		listRevisions: async () => ({ revisions: [], hasNext: false }),
		loadStyleAtRevision: async () => ({
			version: 8,
			sources: {},
			layers: [layer]
		}),
		...overrides
	});

	it('prefers layer reads when the provider supports them', async () => {
		let fullStyleLoads = 0;
		const optimized = provider({
			loadStyleAtRevision: async () => {
				fullStyleLoads += 1;
				throw new Error('full style should not load');
			},
			loadLayerAtRevision: async () => layer
		});

		await expect(
			loadPropertyRevisionValue(optimized, revision('optimized'), 'water', 'paint', 'fill-color')
		).resolves.toEqual({
			revision: revision('optimized'),
			state: 'value',
			value: '#2266aa'
		});
		expect(fullStyleLoads).toBe(0);
	});

	it('maps a missing layer file to layer-missing', async () => {
		const optimized = provider({ loadLayerAtRevision: async () => null });

		await expect(
			loadPropertyRevisionValue(optimized, revision('missing'), 'water', 'paint', 'fill-color')
		).resolves.toEqual({
			revision: revision('missing'),
			state: 'layer-missing'
		});
	});

	it('falls back to loading the full style for legacy providers', async () => {
		await expect(
			loadPropertyRevisionValue(provider(), revision('legacy'), 'water', 'paint', 'fill-color')
		).resolves.toEqual({
			revision: revision('legacy'),
			state: 'value',
			value: '#2266aa'
		});
	});
});

describe('computeHistoryEntries', () => {
	it('keeps the oldest revision in each consecutive value run', () => {
		const entries = computeHistoryEntries(
			[
				value('b-new', 'B'),
				value('b-old', 'B'),
				value('a-1', 'A'),
				value('a-2', 'A'),
				value('a-old', 'A')
			],
			false
		);

		expect(entries.map((entry) => [entry.revision.id, entry.value, entry.kind])).toEqual([
			['b-old', 'B', 'changed'],
			['a-old', 'A', 'changed']
		]);
	});

	it('tracks changes to and from an unset value', () => {
		const entries = computeHistoryEntries(
			[value('unset-new', undefined), value('set', 0.75), value('unset-old', undefined)],
			false
		);

		expect(entries.map((entry) => [entry.revision.id, entry.value])).toEqual([
			['unset-new', undefined],
			['set', 0.75],
			['unset-old', undefined]
		]);
	});

	it('stops at the first revision before the layer existed', () => {
		const entries = computeHistoryEntries(
			[
				value('new', '#fff'),
				value('created', '#000'),
				{ revision: revision('before'), state: 'layer-missing' },
				value('ignored', '#f00')
			],
			true
		);

		expect(entries.map((entry) => [entry.revision.id, entry.kind])).toEqual([
			['new', 'changed'],
			['created', 'changed'],
			['before', 'layer-missing']
		]);
	});

	it('keeps errors without using them as comparison boundaries', () => {
		const entries = computeHistoryEntries(
			[
				value('b-new', 'B'),
				{ revision: revision('broken'), state: 'error', error: 'Invalid style' },
				value('b-old', 'B'),
				value('a', 'A')
			],
			false
		);

		expect(entries.map((entry) => [entry.revision.id, entry.kind])).toEqual([
			['broken', 'error'],
			['b-old', 'changed'],
			['a', 'changed']
		]);
	});

	it('marks the oldest value as provisional while more pages remain', () => {
		const entries = computeHistoryEntries([value('new', 'B'), value('oldest-loaded', 'A')], true);

		expect(entries.map((entry) => [entry.revision.id, entry.kind])).toEqual([
			['new', 'changed'],
			['oldest-loaded', 'oldest-loaded']
		]);
	});
});
