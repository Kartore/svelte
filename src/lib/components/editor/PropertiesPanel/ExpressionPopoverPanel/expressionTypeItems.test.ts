import { describe, expect, it } from 'vitest';

import { getExpressionTypeItems } from './expressionTypeItems.ts';

describe('getExpressionTypeItems', () => {
	it('keeps the fixed choices for a supported expression type', () => {
		expect(getExpressionTypeItems('match').map((item) => item.value)).toEqual([
			'interpolate',
			'step',
			'match',
			'case',
			'get',
			'literal'
		]);
	});

	it('prepends an unsupported current type so the select can display it', () => {
		const items = getExpressionTypeItems('to-string');

		expect(items[0]).toEqual({ value: 'to-string', label: 'to-string' });
		expect(items.filter((item) => item.value === 'to-string')).toHaveLength(1);
	});
});
