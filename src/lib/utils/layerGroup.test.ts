import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import { osmLibertyMigrated } from '$lib/samples/osm-liberty.ts';

import {
	buildLayerTreeRows,
	filterLayerTreeRowsById,
	getLayerGroup,
	GROUP_METADATA_KEY,
	groupLayersByIdPrefix
} from './layerGroup.ts';

const layer = (id: string, group?: string): LayerSpecification => ({
	id,
	type: 'background',
	...(group ? { metadata: { [GROUP_METADATA_KEY]: group } } : {})
});

const layers = [
	layer('Roads Primary', 'roads'),
	layer('roads-secondary', 'roads'),
	layer('Labels')
];
const rows = buildLayerTreeRows(layers);

const rowLabels = (filteredRows: typeof rows): string[] =>
	filteredRows.map((row) =>
		row.kind === 'group' ? `group:${row.name}` : `layer:${row.layerIndex}`
	);

describe('filterLayerTreeRowsById', () => {
	it('matches layer ids case-insensitively and keeps the owning group header', () => {
		expect(rowLabels(filterLayerTreeRowsById(layers, rows, 'PRIMARY'))).toEqual([
			'group:roads',
			'layer:0'
		]);
	});

	it('returns matching ungrouped layers without unrelated group rows', () => {
		expect(rowLabels(filterLayerTreeRowsById(layers, rows, 'label'))).toEqual(['layer:2']);
	});

	it('leaves the row model unchanged for an empty search', () => {
		expect(filterLayerTreeRowsById(layers, rows, '  ')).toBe(rows);
	});
});

describe('groupLayersByIdPrefix', () => {
	it('creates collapsible groups for the bundled OSM Liberty style', () => {
		const grouping = groupLayersByIdPrefix(osmLibertyMigrated.layers);

		expect(grouping.groupCount).toBeGreaterThan(0);
		expect(grouping.layers.some((item) => getLayerGroup(item) !== undefined)).toBe(true);
		expect(buildLayerTreeRows(grouping.layers).some((row) => row.kind === 'group')).toBe(true);
	});
});
