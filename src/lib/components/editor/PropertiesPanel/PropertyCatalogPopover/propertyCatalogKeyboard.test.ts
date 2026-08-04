import { describe, expect, it } from 'vitest';

import { isPropertyCatalogInsertKey } from './propertyCatalogKeyboard.ts';

describe('isPropertyCatalogInsertKey', () => {
	it('Escape では先頭プロパティを挿入しない', () => {
		expect(isPropertyCatalogInsertKey({ key: 'Escape', isComposing: false })).toBe(false);
	});

	it('IME 変換中でない Enter だけを挿入として扱う', () => {
		expect(isPropertyCatalogInsertKey({ key: 'Enter', isComposing: false })).toBe(true);
		expect(isPropertyCatalogInsertKey({ key: 'Enter', isComposing: true })).toBe(false);
	});
});
