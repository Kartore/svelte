import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import { createStyleExport } from './styleExport.ts';

describe('createStyleExport', () => {
	it('preserves a renamed Japanese style name in the JSON and filename', () => {
		const style: StyleSpecification = {
			version: 8,
			name: '日本語スタイル',
			sources: {},
			layers: []
		};

		const result = createStyleExport(style);

		expect(JSON.parse(result.contents)).toMatchObject({ name: '日本語スタイル' });
		expect(result.fileName).toBe('日本語スタイル.json');
	});
});
