import { describe, expect, it } from 'vitest';

import { expressionSurface } from './expressionSurface.ts';

describe('expressionSurface', () => {
	it('uses the field surface and white controls at even depths', () => {
		expect(expressionSurface(0)).toEqual({
			className: 'bg-field',
			surfaceBackground: 'var(--color-field)',
			controlBackground: '#fff'
		});
		expect(expressionSurface(2)).toEqual(expressionSurface(0));
	});

	it('uses the white bordered surface and field controls at odd depths', () => {
		expect(expressionSurface(1)).toEqual({
			className: 'border border-hairline-soft bg-white',
			surfaceBackground: '#fff',
			controlBackground: 'var(--color-field)'
		});
	});
});
