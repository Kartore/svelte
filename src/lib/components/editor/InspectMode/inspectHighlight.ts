import type { ExpressionFilterSpecification, StyleSpecification } from 'maplibre-gl';

import { createTemporaryHighlightLayer } from '#lib/utils/filterHighlight.ts';

export const INSPECT_HIGHLIGHT_LAYER_ID = 'kartore-inspect-highlight';
export const INSPECT_HIGHLIGHT_ALTERNATE_LAYER_ID = 'kartore-inspect-highlight-next';
export const INSPECT_HIGHLIGHT_LAYER_IDS = [
	INSPECT_HIGHLIGHT_LAYER_ID,
	INSPECT_HIGHLIGHT_ALTERNATE_LAYER_ID
] as const;

export const isInspectHighlightLayerId = (layerId: string): boolean =>
	INSPECT_HIGHLIGHT_LAYER_IDS.some((temporaryLayerId) => temporaryLayerId === layerId);

export type InspectHighlightRequest = {
	layerId: string;
	accent: string;
	filter?: ExpressionFilterSpecification;
};

export const createInspectHighlightLayer = (
	style: StyleSpecification,
	request: InspectHighlightRequest,
	temporaryLayerId = INSPECT_HIGHLIGHT_LAYER_ID
) => {
	const sourceLayer = style.layers.find(({ id }) => id === request.layerId);
	if (!sourceLayer) return undefined;
	return createTemporaryHighlightLayer(
		sourceLayer,
		temporaryLayerId,
		request.accent,
		request.filter
	);
};

export const applyInspectHighlight = (
	style: StyleSpecification,
	request: InspectHighlightRequest | null
): StyleSpecification => {
	if (!request) return style;
	const highlight = createInspectHighlightLayer(style, request);
	return highlight ? { ...style, layers: [...style.layers, highlight] } : style;
};
