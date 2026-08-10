import { describe, expect, it } from 'vitest';

import { COMPACT_EXPRESSION_OPERATORS, isCompactExpression } from './isCompactExpression.ts';

describe('isCompactExpression', () => {
	it('recognizes every expression rendered as a compact nested leaf', () => {
		for (const operator of COMPACT_EXPRESSION_OPERATORS) {
			expect(isCompactExpression([operator])).toBe(true);
		}
	});

	it('rejects compound expressions, literals, and non-expressions', () => {
		expect(isCompactExpression(['match', ['get', 'kind'], 'road', 'line', 'other'])).toBe(false);
		expect(isCompactExpression(['literal', ['get', 'kind']])).toBe(false);
		expect(isCompactExpression('get')).toBe(false);
		expect(isCompactExpression([])).toBe(false);
	});
});
