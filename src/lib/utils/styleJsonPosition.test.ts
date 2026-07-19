import { describe, expect, it } from 'vitest';

import { findStyleLayerIdPosition } from './styleJsonPosition.ts';

describe('findStyleLayerIdPosition', () => {
	it('finds a layer id in the top-level layers array', () => {
		const text = JSON.stringify(
			{
				version: 8,
				metadata: { id: 'roads' },
				layers: [
					{ id: 'water', type: 'fill', metadata: { id: 'roads' } },
					{ id: 'roads', type: 'line' }
				]
			},
			undefined,
			2
		);

		const position = findStyleLayerIdPosition(text, 'roads');

		expect(position).not.toBeNull();
		expect(text.slice(position!, position! + JSON.stringify('roads').length)).toBe('"roads"');
		expect(position).toBeGreaterThan(text.indexOf('"water"'));
	});

	it('matches JSON-escaped layer ids', () => {
		const layerId = 'labels "primary"';
		const text = JSON.stringify({ version: 8, layers: [{ id: layerId, type: 'symbol' }] });

		const position = findStyleLayerIdPosition(text, layerId);

		expect(position).not.toBeNull();
		expect(text.slice(position!, position! + JSON.stringify(layerId).length)).toBe(
			JSON.stringify(layerId)
		);
	});

	it('keeps finding parsed layers while the draft is incomplete', () => {
		const text = '{"version":8,"layers":[{"id":"water","type":"fill"},{"id":"roads","type":"line"';

		const position = findStyleLayerIdPosition(text, 'roads');

		expect(position).not.toBeNull();
		expect(text.slice(position!, position! + JSON.stringify('roads').length)).toBe('"roads"');
	});

	it('returns null when the layer is absent', () => {
		const text = JSON.stringify({ version: 8, layers: [{ id: 'water', type: 'fill' }] });

		expect(findStyleLayerIdPosition(text, 'roads')).toBeNull();
		expect(findStyleLayerIdPosition('{}', 'roads')).toBeNull();
	});
});
