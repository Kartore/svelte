import type {
	ExpressionFilterSpecification,
	LayerSpecification,
	SourceSpecification,
	StyleSpecification
} from '@maplibre/maplibre-gl-style-spec';

export type InspectView = 'style' | 'data';

export type TileCoordinate = {
	z: number;
	x: number;
	y: number;
};

export type InspectSourceMetadata = {
	tiles?: string[];
	minzoom?: number;
	maxzoom?: number;
	vector_layers?: Array<{
		id: string;
		minzoom?: number;
		maxzoom?: number;
	}>;
};

export type InspectSourceLayer = {
	key: string;
	sourceId: string;
	sourceLayer: string | null;
	minzoom?: number;
	maxzoom?: number;
};

export type InspectLegendEntry = InspectSourceLayer & {
	label: string;
	color: string;
	layerIds: string[];
};

export type InspectDataStyle = {
	style: StyleSpecification;
	legend: InspectLegendEntry[];
};

export type InspectedFeature = {
	id?: string | number;
	layerId: string;
	sourceId: string;
	sourceLayer?: string;
	geometryType: string;
	properties: Record<string, unknown>;
	geojson: {
		type: 'Feature';
		id?: string | number;
		properties: Record<string, unknown>;
		geometry: unknown;
	};
	highlightFilter?: ExpressionFilterSpecification;
};

export type InspectPointResult = {
	point: { x: number; y: number };
	longitude: number;
	latitude: number;
	features: InspectedFeature[];
	tile: TileCoordinate;
	tileUrls: Array<{ sourceId: string; url: string }>;
};

export type InspectHoverResult = {
	point: { x: number; y: number };
	feature: InspectedFeature;
};

export const inspectFeatureDisplayLabel = (
	feature: InspectedFeature,
	view: InspectView
): string => {
	if (view === 'data') {
		return `${feature.sourceId}${feature.sourceLayer ? ` / ${feature.sourceLayer}` : ''}`;
	}
	return feature.layerId;
};

export const inspectFeatureContextLabel = (
	feature: InspectedFeature,
	view: InspectView
): string => {
	if (view === 'data') return feature.geometryType;
	return `${feature.sourceId}${feature.sourceLayer ? ` / ${feature.sourceLayer}` : ''} ・ ${feature.geometryType}`;
};

export const INSPECT_CLICK_TOLERANCE_PX = 5;

export const inspectQueryBox = (
	point: { x: number; y: number },
	tolerance = INSPECT_CLICK_TOLERANCE_PX
): [[number, number], [number, number]] => [
	[point.x - tolerance, point.y - tolerance],
	[point.x + tolerance, point.y + tolerance]
];

/**
 * The hover label moves on every pointer frame, while the display-style highlight only needs to
 * change when its target changes. A stable key lets the caller preserve the feature reference and
 * prevents MapLibre from receiving an otherwise identical style on every mouse move.
 */
export const inspectFeatureHighlightKey = (feature: InspectedFeature): string =>
	JSON.stringify([
		feature.layerId,
		feature.sourceId,
		feature.sourceLayer ?? null,
		feature.highlightFilter ?? null
	]);

const inspectFeatureResultKey = (feature: InspectedFeature): string =>
	JSON.stringify([
		feature.layerId,
		feature.sourceId,
		feature.sourceLayer ?? null,
		feature.id ?? null,
		feature.id === undefined ? (feature.highlightFilter ?? null) : null,
		feature.id === undefined ? feature.geojson.geometry : null
	]);

/** Preserve MapLibre's rendered order while removing tile-boundary duplicates from box queries. */
export const dedupeInspectedFeatures = (features: InspectedFeature[]): InspectedFeature[] => {
	const seen = new Set<string>();
	return features.filter((feature) => {
		const key = inspectFeatureResultKey(feature);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

export const inspectTileTemplates = (
	style: StyleSpecification,
	metadata: Record<string, InspectSourceMetadata | undefined>,
	sourceId: string
): string[] => {
	const source = style.sources[sourceId] as { tiles?: string[] } | undefined;
	return [...new Set([...(source?.tiles ?? []), ...(metadata[sourceId]?.tiles ?? [])])];
};

const MAX_MERCATOR_LATITUDE = 85.05112878;
const GOLDEN_ANGLE = 137.50776405;

const clamp = (value: number, minimum: number, maximum: number): number =>
	Math.min(maximum, Math.max(minimum, value));

export const longitudeLatitudeToTile = (
	longitude: number,
	latitude: number,
	zoom: number
): TileCoordinate => {
	const z = clamp(Math.floor(zoom), 0, 24);
	const scale = 2 ** z;
	const wrappedLongitude = ((((longitude + 180) % 360) + 360) % 360) - 180;
	const clampedLatitude = clamp(latitude, -MAX_MERCATOR_LATITUDE, MAX_MERCATOR_LATITUDE);
	const latitudeRadians = (clampedLatitude * Math.PI) / 180;
	const x = clamp(Math.floor(((wrappedLongitude + 180) / 360) * scale), 0, scale - 1);
	const y = clamp(
		Math.floor(((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * scale),
		0,
		scale - 1
	);
	return { z, x, y };
};

const quadkeyForTile = ({ z, x, y }: TileCoordinate): string => {
	let quadkey = '';
	for (let level = z; level > 0; level -= 1) {
		let digit = 0;
		const mask = 1 << (level - 1);
		if ((x & mask) !== 0) digit += 1;
		if ((y & mask) !== 0) digit += 2;
		quadkey += String(digit);
	}
	return quadkey;
};

export const resolveTileUrl = (template: string, tile: TileCoordinate): string =>
	template
		.replaceAll('{z}', String(tile.z))
		.replaceAll('{x}', String(tile.x))
		.replaceAll('{y}', String(tile.y))
		.replaceAll('{-y}', String(2 ** tile.z - tile.y - 1))
		.replaceAll('{quadkey}', quadkeyForTile(tile));

const hashName = (value: string): number => {
	let hash = 2_166_136_261;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16_777_619);
	}
	return hash >>> 0;
};

export const inspectColorForName = (name: string): string => {
	const hue = (hashName(name) * GOLDEN_ANGLE) % 360;
	return `hsl(${hue.toFixed(2)}, 65%, 55%)`;
};

const sourceLayerKey = (sourceId: string, sourceLayer: string | null): string =>
	`${sourceId}/${sourceLayer ?? ''}`;

const isSourceType = (source: SourceSpecification, type: string): boolean =>
	(source as { type?: string }).type === type;

export const collectInspectSourceLayers = (
	style: StyleSpecification,
	metadata: Record<string, InspectSourceMetadata | undefined>
): InspectSourceLayer[] => {
	const result: InspectSourceLayer[] = [];
	for (const [sourceId, source] of Object.entries(style.sources).sort(([left], [right]) =>
		left.localeCompare(right)
	)) {
		if (isSourceType(source, 'geojson')) {
			result.push({ key: sourceLayerKey(sourceId, null), sourceId, sourceLayer: null });
			continue;
		}
		if (!isSourceType(source, 'vector')) continue;

		const tileJsonLayers = metadata[sourceId]?.vector_layers ?? [];
		const usedLayers = style.layers
			.filter(
				(layer) =>
					'source' in layer &&
					layer.source === sourceId &&
					'source-layer' in layer &&
					typeof layer['source-layer'] === 'string'
			)
			.map((layer) => (layer as { 'source-layer': string })['source-layer']);
		const layers = new Map<string, { id: string; minzoom?: number; maxzoom?: number }>();
		for (const layer of tileJsonLayers) layers.set(layer.id, layer);
		for (const id of usedLayers) if (!layers.has(id)) layers.set(id, { id });

		for (const layer of [...layers.values()].sort((left, right) =>
			left.id.localeCompare(right.id)
		)) {
			result.push({
				key: sourceLayerKey(sourceId, layer.id),
				sourceId,
				sourceLayer: layer.id,
				minzoom: layer.minzoom,
				maxzoom: layer.maxzoom
			});
		}
	}
	return result;
};

const generatedLayerId = (entry: InspectSourceLayer, geometry: string): string =>
	`kartore-inspect-${hashName(entry.key).toString(36)}-${geometry}`;

const generatedLayer = (
	entry: InspectSourceLayer,
	type: 'fill' | 'line' | 'circle',
	color: string
): LayerSpecification => {
	const geometryType = type === 'fill' ? 'Polygon' : type === 'line' ? 'LineString' : 'Point';
	const layer: Record<string, unknown> = {
		id: generatedLayerId(entry, type),
		type,
		source: entry.sourceId,
		filter: ['==', ['geometry-type'], geometryType],
		metadata: { 'kartore:inspectSourceLayer': entry.key }
	};
	if (entry.sourceLayer !== null) layer['source-layer'] = entry.sourceLayer;
	if (type === 'fill') layer.paint = { 'fill-color': color, 'fill-opacity': 0.4 };
	if (type === 'line') layer.paint = { 'line-color': color, 'line-width': 2 };
	if (type === 'circle') layer.paint = { 'circle-color': color, 'circle-radius': 4 };
	return layer as LayerSpecification;
};

export const createInspectDataStyle = (
	baseStyle: StyleSpecification,
	sourceLayers: InspectSourceLayer[],
	hiddenKeys: ReadonlySet<string> = new Set()
): InspectDataStyle => {
	const layers: LayerSpecification[] = [
		{
			id: 'kartore-inspect-background',
			type: 'background',
			paint: { 'background-color': '#ececec' }
		}
	];
	const legend: InspectLegendEntry[] = [];

	for (const entry of sourceLayers) {
		const color = inspectColorForName(entry.sourceLayer ?? entry.sourceId);
		const generated = (['fill', 'line', 'circle'] as const).map((type) =>
			generatedLayer(entry, type, color)
		);
		legend.push({
			...entry,
			label: entry.sourceLayer ?? entry.sourceId,
			color,
			layerIds: generated.map(({ id }) => id)
		});
		if (!hiddenKeys.has(entry.key)) layers.push(...generated);
	}

	return {
		style: {
			version: 8,
			name: `${baseStyle.name ?? 'style'} / data inspect`,
			sources: baseStyle.sources,
			layers
		},
		legend
	};
};

export const createFeatureHighlightFilter = (feature: {
	id?: string | number;
	properties?: Record<string, unknown>;
}): ExpressionFilterSpecification | undefined => {
	if (feature.id !== undefined) {
		return ['==', ['id'], feature.id] as ExpressionFilterSpecification;
	}
	const comparisons = Object.entries(feature.properties ?? {})
		.filter(
			(entry): entry is [string, string | number | boolean] =>
				typeof entry[1] === 'string' ||
				typeof entry[1] === 'number' ||
				typeof entry[1] === 'boolean'
		)
		.slice(0, 8)
		.map(([key, value]) => ['==', ['get', key], value]);
	if (comparisons.length === 0) return undefined;
	return (
		comparisons.length === 1 ? comparisons[0] : ['all', ...comparisons]
	) as ExpressionFilterSpecification;
};
