import { describe, expect, it } from 'vitest';

import { createEmptyStyle } from './styleCreate.ts';

describe('createEmptyStyle', () => {
	it('creates the minimal editable MapLibre style', () => {
		expect(createEmptyStyle()).toEqual({
			version: 8,
			sources: {},
			layers: []
		});
	});

	it('returns independent source and layer containers', () => {
		const first = createEmptyStyle();
		const second = createEmptyStyle();

		expect(first).not.toBe(second);
		expect(first.sources).not.toBe(second.sources);
		expect(first.layers).not.toBe(second.layers);
	});
});
