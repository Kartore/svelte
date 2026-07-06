import type {
	BackgroundLayerSpecification,
	CircleLayerSpecification,
	FillExtrusionLayerSpecification,
	FillLayerSpecification,
	HeatmapLayerSpecification,
	HillshadeLayerSpecification,
	LayerSpecification,
	LineLayerSpecification,
	RasterLayerSpecification,
	SymbolLayerSpecification
} from '@maplibre/maplibre-gl-style-spec';
import type { StyleSpecification } from 'maplibre-gl';

type BackgroundExcludedLayerSpecification = Exclude<
	LayerSpecification,
	BackgroundLayerSpecification
>;

type GeneralProperties = {
	id: BackgroundExcludedLayerSpecification['id'];
	source: BackgroundExcludedLayerSpecification['source'];
	sourceLayer: BackgroundExcludedLayerSpecification['source-layer'];
	minzoom: BackgroundExcludedLayerSpecification['minzoom'];
	maxzoom: BackgroundExcludedLayerSpecification['maxzoom'];
	metadata: BackgroundExcludedLayerSpecification['metadata'];
};

export type SplitLayerProperties = {
	type: BackgroundExcludedLayerSpecification['type'];
	general: GeneralProperties;
	filter: BackgroundExcludedLayerSpecification['filter'];
	paint: BackgroundExcludedLayerSpecification['paint'];
	layout: BackgroundExcludedLayerSpecification['layout'];
	visibility: Exclude<BackgroundExcludedLayerSpecification['layout'], undefined>['visibility'];
};

export type BackgroundSplitLayerProperties = {
	type: LayerSpecification['type'];
	general: {
		id: BackgroundLayerSpecification['id'];
		metadata: BackgroundLayerSpecification['metadata'];
		minzoom: BackgroundLayerSpecification['minzoom'];
		maxzoom: BackgroundLayerSpecification['maxzoom'];
	};
	paint: BackgroundLayerSpecification['paint'];
	layout: BackgroundLayerSpecification['layout'];
	visibility: Exclude<BackgroundExcludedLayerSpecification['layout'], undefined>['visibility'];
};

export const splitLayerProperties = (layer: LayerSpecification) => {
	if (layer.type === 'background') {
		const { id, type, minzoom, maxzoom, metadata, paint, layout } = layer;
		return {
			type,
			general: { id, metadata, minzoom, maxzoom },
			paint,
			layout,
			visibility: layout ? layout.visibility : 'visible'
		} satisfies BackgroundSplitLayerProperties;
	}
	const { id, type, source, 'source-layer': sourceLayer, minzoom, maxzoom, metadata } = layer;
	return {
		type,
		general: { id, source, sourceLayer, minzoom, maxzoom, metadata },
		filter: layer.filter,
		paint: layer.paint,
		layout: layer.layout,
		visibility: layer.layout ? layer.layout.visibility : 'visible'
	} satisfies SplitLayerProperties;
};

export const isBackgroundLayer = (
	layer: LayerSpecification
): layer is BackgroundLayerSpecification => {
	return layer.type === 'background';
};

export const isFillLayer = (layer: LayerSpecification): layer is FillLayerSpecification => {
	return layer.type === 'fill';
};

export const isLineLayer = (layer: LayerSpecification): layer is LineLayerSpecification => {
	return layer.type === 'line';
};

export const isSymbolLayer = (layer: LayerSpecification): layer is SymbolLayerSpecification => {
	return layer.type === 'symbol';
};

export const isRasterLayer = (layer: LayerSpecification): layer is RasterLayerSpecification => {
	return layer.type === 'raster';
};

export const isCircleLayer = (layer: LayerSpecification): layer is CircleLayerSpecification => {
	return layer.type === 'circle';
};

export const isHeatmapLayer = (layer: LayerSpecification): layer is HeatmapLayerSpecification => {
	return layer.type === 'heatmap';
};

export const isHillshadeLayer = (
	layer: LayerSpecification
): layer is HillshadeLayerSpecification => {
	return layer.type === 'hillshade';
};

export const isFillExtrusionLayer = (
	layer: LayerSpecification
): layer is FillExtrusionLayerSpecification => {
	return layer.type === 'fill-extrusion';
};

type ObjectGroup = 'paint' | 'layout' | 'metadata' | 'all' | undefined;

type ObjectKey<L extends LayerSpecification, G extends ObjectGroup> = G extends 'metadata'
	? PropertyKey
	: G extends undefined
		? keyof {
				[K in keyof Omit<L, 'paint' | 'layout' | 'metadata'>]: '';
			}
		: G extends 'all'
			? undefined
			: G extends keyof L
				? L[G] extends undefined
					? never
					: keyof Exclude<L[G], undefined>
				: never;

type ObjectValue<
	L extends LayerSpecification,
	G extends ObjectGroup,
	K extends ObjectKey<L, G>
> = G extends 'metadata'
	? string | number | boolean | null | undefined
	: G extends 'all'
		? LayerSpecification
		: G extends undefined
			? K extends keyof L
				? L[K]
				: never
			: G extends keyof L
				? L[G] extends undefined
					? never
					: K extends keyof Exclude<L[G], undefined>
						? Exclude<L[G], undefined>[K]
						: never
				: never;

export type onChangeType = <
	L extends LayerSpecification,
	G extends ObjectGroup,
	K extends ObjectKey<L, G>,
	V extends ObjectValue<L, G, K>
>(
	layer: L,
	group: G,
	key: K,
	value: V
) => void;

export function replaceLayerData<
	L extends LayerSpecification,
	G extends ObjectGroup,
	K extends ObjectKey<L, G>,
	V extends ObjectValue<L, G, K>
>(style: StyleSpecification, layer: L, group: G, key: K, value: V) {
	return {
		...style,
		layers: style.layers.map((currentLayer) => {
			if (currentLayer.id === layer.id) {
				if (group) {
					if (group === 'all') {
						return value as LayerSpecification;
					}

					//@ts-expect-error ObjectGroupによって担保される
					if (currentLayer[group] != null) {
						if (value === undefined) {
							// undefined を残すと maplibre の setStyle diff が
							// "'undefined' value invalid. Use null instead." を出すため key ごと削除する
							//@ts-expect-error ObjectKey/ObjectGroupによって担保される
							delete currentLayer[group][key];
						} else {
							//@ts-expect-error ObjectKey/ObjectGroupによって担保される
							currentLayer[group][key] = value;
						}
					}
				} else if (value === undefined) {
					//@ts-expect-error ObjectKeyによって担保される
					delete currentLayer[key];
				} else {
					//@ts-expect-error ObjectKeyによって担保される
					currentLayer[key] = value;
				}
			}
			return currentLayer;
		})
	};
}
