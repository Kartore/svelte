import { describe, expect, it } from 'vitest';

import { isTextFieldCancelKey, isTextFieldCommitKey } from './textFieldKey.ts';

describe('TextField commit keys', () => {
	it('commits with Enter outside IME composition', () => {
		expect(isTextFieldCommitKey({ key: 'Enter', isComposing: false })).toBe(true);
	});

	it('does not commit with Enter during IME composition', () => {
		expect(isTextFieldCommitKey({ key: 'Enter', isComposing: true })).toBe(false);
	});

	it('only cancels with Escape outside IME composition', () => {
		expect(isTextFieldCancelKey({ key: 'Escape', isComposing: false })).toBe(true);
		expect(isTextFieldCancelKey({ key: 'Escape', isComposing: true })).toBe(false);
	});
});
