import { describe, expect, it } from 'vitest';

import { ExpressionFlyoutContext } from './expressionFlyout.svelte.ts';

describe('ExpressionFlyoutContext', () => {
	it('keeps the target and anchor in sync across open and close', () => {
		const context = new ExpressionFlyoutContext();
		const anchor = {} as HTMLElement;

		context.open({ group: 'paint', key: 'fill-color', label: 'Color' }, anchor);

		expect(context.target).toEqual({ group: 'paint', key: 'fill-color', label: 'Color' });
		expect(context.anchor).toBe(anchor);

		context.close();

		expect(context.target).toBeNull();
		expect(context.anchor).toBeNull();
	});

	it('reanchors only the open property', () => {
		const context = new ExpressionFlyoutContext();
		const initialAnchor = {} as HTMLElement;
		const nextAnchor = {} as HTMLElement;

		context.open({ group: 'layout', key: 'text-size', label: 'Size' }, initialAnchor);
		context.reanchor('paint', 'text-size', nextAnchor);
		expect(context.anchor).toBe(initialAnchor);

		context.reanchor('layout', 'text-size', nextAnchor);
		expect(context.anchor).toBe(nextAnchor);
	});
});
