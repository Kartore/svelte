export const DEFAULT_SIDEBAR_WIDTH = 315;
export const MIN_SIDEBAR_WIDTH = 200;
export const MAX_SIDEBAR_WIDTH = 480;

export const DEFAULT_PROPERTIES_PANEL_WIDTH = 385;
export const MIN_PROPERTIES_PANEL_WIDTH = 280;
export const MAX_PROPERTIES_PANEL_WIDTH = 520;

const normalizePanelWidth = (
	value: unknown,
	defaultWidth: number,
	minWidth: number,
	maxWidth: number
): number => {
	if (typeof value !== 'number' || !Number.isFinite(value)) return defaultWidth;
	return Math.min(maxWidth, Math.max(minWidth, Math.round(value)));
};

export const normalizeSidebarWidth = (value: unknown): number =>
	normalizePanelWidth(value, DEFAULT_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH);

export const normalizePropertiesPanelWidth = (value: unknown): number =>
	normalizePanelWidth(
		value,
		DEFAULT_PROPERTIES_PANEL_WIDTH,
		MIN_PROPERTIES_PANEL_WIDTH,
		MAX_PROPERTIES_PANEL_WIDTH
	);
