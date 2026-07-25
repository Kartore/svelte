import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import { replaceStyleRootData, replaceStyleSettingData, setStyleRootObject } from './styleRoot.ts';

const emptyStyle = (): StyleSpecification => ({
	version: 8,
	sources: {},
	layers: []
});

describe('replaceStyleRootData', () => {
	it('does not add terrain data other than source when terrain is absent', () => {
		const style = emptyStyle();

		expect(replaceStyleRootData(style, 'terrain', 'exaggeration', 2)).toBe(style);
		expect(style).not.toHaveProperty('terrain');
	});

	it('removes terrain when its required source is removed', () => {
		const style = {
			...emptyStyle(),
			terrain: { source: 'dem', exaggeration: 2 }
		} satisfies StyleSpecification;

		const next = replaceStyleRootData(style, 'terrain', 'source', undefined);

		expect(next).not.toHaveProperty('terrain');
		expect(style.terrain).toEqual({ source: 'dem', exaggeration: 2 });
	});

	it('keeps an empty sky object when its last property is removed', () => {
		const style = {
			...emptyStyle(),
			sky: { 'sky-color': '#88C6FC' }
		} satisfies StyleSpecification;

		expect(replaceStyleRootData(style, 'sky', 'sky-color', undefined)).toEqual({
			...emptyStyle(),
			sky: {}
		});
	});

	it('removes an empty light object', () => {
		const style = {
			...emptyStyle(),
			light: { intensity: 0.8 }
		} satisfies StyleSpecification;

		expect(replaceStyleRootData(style, 'light', 'intensity', undefined)).toEqual(emptyStyle());
	});
});

describe('setStyleRootObject', () => {
	it('adds and removes an entire root object without mutating the input style', () => {
		const style = emptyStyle();
		const withProjection = setStyleRootObject(style, 'projection', { type: 'globe' });
		const withoutProjection = setStyleRootObject(withProjection, 'projection', undefined);

		expect(withProjection.projection).toEqual({ type: 'globe' });
		expect(withoutProjection).toEqual(style);
		expect(style).not.toHaveProperty('projection');
	});
});

describe('replaceStyleSettingData', () => {
	it('replaces a default view property without mutating the input style', () => {
		const style = emptyStyle();

		const next = replaceStyleSettingData(style, 'center', [139.7, 35.7]);

		expect(next.center).toEqual([139.7, 35.7]);
		expect(style).not.toHaveProperty('center');
	});

	it('removes an optional string setting instead of retaining undefined', () => {
		const style = {
			...emptyStyle(),
			glyphs: 'https://example.com/{fontstack}/{range}.pbf'
		};

		const next = replaceStyleSettingData(style, 'glyphs', undefined);

		expect(next).not.toHaveProperty('glyphs');
		expect(style).toHaveProperty('glyphs');
	});
});
