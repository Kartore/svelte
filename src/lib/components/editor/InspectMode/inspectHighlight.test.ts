import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import {
	applyInspectHighlight,
	createInspectHighlightLayer,
	INSPECT_HIGHLIGHT_ALTERNATE_LAYER_ID,
	INSPECT_HIGHLIGHT_LAYER_ID,
	isInspectHighlightLayerId
} from './inspectHighlight.ts';

const style = {
	version: 8,
	sources: {
		places: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }
	},
	layers: [
		{
			id: 'places',
			type: 'circle',
			source: 'places',
			filter: ['==', ['get', 'kind'], 'city'],
			paint: { 'circle-radius': 3 }
		}
	]
} as StyleSpecification;

describe('applyInspectHighlight', () => {
	it('adds a display-only clone with the original and feature filters combined', () => {
		const highlighted = applyInspectHighlight(style, {
			layerId: 'places',
			accent: '#0d8de3',
			filter: ['==', ['id'], 42]
		});
		const clone = highlighted.layers.at(-1);

		expect(clone?.id).toBe(INSPECT_HIGHLIGHT_LAYER_ID);
		expect(clone && 'filter' in clone ? clone.filter : undefined).toEqual([
			'all',
			['==', ['get', 'kind'], 'city'],
			['==', ['id'], 42]
		]);
		expect(style.layers).toHaveLength(1);
	});

	it('supports a second clone slot so a changed source layer can be added before the old clone is removed', () => {
		const clone = createInspectHighlightLayer(
			style,
			{
				layerId: 'places',
				accent: '#0d8de3',
				filter: ['==', ['id'], 7]
			},
			INSPECT_HIGHLIGHT_ALTERNATE_LAYER_ID
		);

		expect(clone?.id).toBe(INSPECT_HIGHLIGHT_ALTERNATE_LAYER_ID);
		expect(isInspectHighlightLayerId(INSPECT_HIGHLIGHT_LAYER_ID)).toBe(true);
		expect(isInspectHighlightLayerId(INSPECT_HIGHLIGHT_ALTERNATE_LAYER_ID)).toBe(true);
	});
});
