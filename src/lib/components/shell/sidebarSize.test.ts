import { describe, expect, it } from 'vitest';

import {
	DEFAULT_SIDEBAR_WIDTH,
	DEFAULT_PROPERTIES_PANEL_WIDTH,
	MAX_PROPERTIES_PANEL_WIDTH,
	MAX_SIDEBAR_WIDTH,
	MIN_PROPERTIES_PANEL_WIDTH,
	MIN_SIDEBAR_WIDTH,
	normalizePropertiesPanelWidth,
	normalizeSidebarWidth
} from './sidebarSize.ts';

describe('normalizeSidebarWidth', () => {
	it('不正な保存値は既定幅へ戻す', () => {
		expect(normalizeSidebarWidth(undefined)).toBe(DEFAULT_SIDEBAR_WIDTH);
		expect(normalizeSidebarWidth(Number.NaN)).toBe(DEFAULT_SIDEBAR_WIDTH);
		expect(normalizeSidebarWidth('320')).toBe(DEFAULT_SIDEBAR_WIDTH);
	});

	it('最小幅と最大幅の範囲へ制限する', () => {
		expect(normalizeSidebarWidth(120)).toBe(MIN_SIDEBAR_WIDTH);
		expect(normalizeSidebarWidth(640)).toBe(MAX_SIDEBAR_WIDTH);
	});

	it('ドラッグ由来の小数値は整数へ丸める', () => {
		expect(normalizeSidebarWidth(319.6)).toBe(320);
	});
});

describe('normalizePropertiesPanelWidth', () => {
	it('右パネル固有の既定幅と範囲を使う', () => {
		expect(normalizePropertiesPanelWidth(undefined)).toBe(DEFAULT_PROPERTIES_PANEL_WIDTH);
		expect(normalizePropertiesPanelWidth(120)).toBe(MIN_PROPERTIES_PANEL_WIDTH);
		expect(normalizePropertiesPanelWidth(640)).toBe(MAX_PROPERTIES_PANEL_WIDTH);
	});
});
