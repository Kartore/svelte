import { describe, expect, it } from 'vitest';

import { osmLibertyMigrated } from '#lib/samples/osm-liberty.ts';

import {
	COLOR_MERGE_DELTA_E,
	extractLiteralColors,
	extractStyleColorUsages,
	isColorWithinDeltaE,
	oklchDeltaE,
	variableBindingLocationCount
} from './palette.ts';

describe('palette color extraction', () => {
	it('snapshots literal colors from the real osm-liberty style', () => {
		const colors = extractLiteralColors(osmLibertyMigrated);
		const usages = extractStyleColorUsages(osmLibertyMigrated);
		expect({
			literalColorCount: colors.length,
			directUsageCount: usages.filter(({ inExpression }) => !inExpression).length,
			expressionUsageCount: usages.filter(({ inExpression }) => inExpression).length,
			variableBindingLocationCount: variableBindingLocationCount(osmLibertyMigrated)
		}).toMatchInlineSnapshot(`
			{
			  "directUsageCount": 113,
			  "expressionUsageCount": 6,
			  "literalColorCount": 43,
			  "variableBindingLocationCount": 0,
			}
		`);
	});
});

describe('OKLCH ΔE merge boundary', () => {
	it('classifies the required known near and far pairs', () => {
		expect(oklchDeltaE('#f4a15b', '#f6a35c')).toBeLessThan(COLOR_MERGE_DELTA_E);
		expect(isColorWithinDeltaE('#f4a15b', '#f6a35c')).toBe(true);
		expect(oklchDeltaE('#f6a35c', '#a8cfe0')).toBeGreaterThan(COLOR_MERGE_DELTA_E);
		expect(isColorWithinDeltaE('#f6a35c', '#a8cfe0')).toBe(false);
	});

	it('uses an inclusive threshold at the computed boundary', () => {
		const delta = oklchDeltaE('#f4a15b', '#f6a35c');
		expect(isColorWithinDeltaE('#f4a15b', '#f6a35c', delta)).toBe(true);
		expect(isColorWithinDeltaE('#f4a15b', '#f6a35c', delta - 0.000_001)).toBe(false);
	});
});
