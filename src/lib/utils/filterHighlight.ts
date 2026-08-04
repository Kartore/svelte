import type {
	ExpressionFilterSpecification,
	LayerSpecification,
	StyleSpecification
} from 'maplibre-gl';

export const FILTER_HIGHLIGHT_LAYER_ID = 'kartore-filter-highlight';

export type FilterHighlightRequest = {
	layerId: string;
	accent: string;
};

export const createTemporaryHighlightLayer = (
	layer: LayerSpecification,
	id: string,
	accent: string,
	filter?: ExpressionFilterSpecification
): LayerSpecification | undefined => {
	if (layer.type === 'background') return undefined;

	const next = structuredClone(layer) as LayerSpecification;
	const record = next as unknown as Record<string, unknown>;
	record.id = id;
	if (filter) {
		const existing = 'filter' in next ? next.filter : undefined;
		record.filter = existing ? ['all', existing, filter] : filter;
	}

	switch (next.type) {
		case 'fill':
			record.paint = { ...(next.paint ?? {}), 'fill-color': accent, 'fill-opacity': 0.5 };
			break;
		case 'line':
			record.paint = { ...(next.paint ?? {}), 'line-color': accent, 'line-width': 4 };
			break;
		case 'circle':
			record.paint = {
				...(next.paint ?? {}),
				'circle-color': accent,
				'circle-radius': 6,
				'circle-opacity': 0.8
			};
			break;
		case 'symbol':
			record.layout = {
				...(next.layout ?? {}),
				'text-allow-overlap': true,
				'text-ignore-placement': true,
				'icon-allow-overlap': true,
				'icon-ignore-placement': true
			};
			record.paint = {
				...(next.paint ?? {}),
				'text-color': accent,
				'text-halo-color': '#ffffff',
				'text-halo-width': 2,
				'icon-color': accent
			};
			break;
		case 'fill-extrusion':
			record.paint = {
				...(next.paint ?? {}),
				'fill-extrusion-color': accent,
				'fill-extrusion-opacity': 0.65
			};
			break;
		case 'heatmap':
			record.paint = {
				...(next.paint ?? {}),
				'heatmap-color': [
					'interpolate',
					['linear'],
					['heatmap-density'],
					0,
					'transparent',
					1,
					accent
				]
			};
			break;
		case 'raster':
			record.paint = { ...(next.paint ?? {}), 'raster-opacity': 0.75 };
			break;
		default:
			break;
	}

	return next;
};

/**
 * Add the temporary filter highlight to the display-only style. Keeping the overlay in the same
 * style diff as its source layer prevents an imperative remove/add gap when a filter changes.
 */
export const applyFilterHighlight = (
	style: StyleSpecification,
	request: FilterHighlightRequest | null
): StyleSpecification => {
	if (!request) return style;

	const layer = style.layers.find(({ id }) => id === request.layerId);
	if (!layer) return style;

	const highlightLayer = createTemporaryHighlightLayer(
		layer,
		FILTER_HIGHLIGHT_LAYER_ID,
		request.accent
	);
	if (!highlightLayer) return style;

	return { ...style, layers: [...style.layers, highlightLayer] };
};
