import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import type { StyleHistoryRevision } from '$lib/editor/EditorModule.ts';

import {
	computeHistoryEntries,
	extractPropertyValue,
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
