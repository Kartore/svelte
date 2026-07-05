import type {
	BackgroundLayerSpecification,
	CircleLayerSpecification,
	FillExtrusionLayerSpecification,
	FillLayerSpecification,
	HeatmapLayerSpecification,
	HillshadeLayerSpecification,
	LineLayerSpecification,
	RasterLayerSpecification,
	SymbolLayerSpecification
} from '@maplibre/maplibre-gl-style-spec';

export const BackgroundLayerSample = {
	id: 'background-layer-test',
	type: 'background',
	minzoom: 0,
	maxzoom: 24,
	paint: {
		'background-color': '#ffffff'
	}
} satisfies BackgroundLayerSpecification;

export const CircleLayerSample = {
	id: 'circle-layer-test',
	type: 'circle',
	source: 'source-test',
	'source-layer': 'source-layer-test',
	minzoom: 0,
	maxzoom: 24,
	paint: {
		'circle-color': '#ffffff'
	}
} satisfies CircleLayerSpecification;

export const FillExtrusionLayerSample = {
	id: 'fill-extrusion-layer-test',
	type: 'fill-extrusion',
	source: 'source-test',
	'source-layer': 'source-layer-test',
	minzoom: 0,
	maxzoom: 24,
	paint: {
		'fill-extrusion-color': '#ffffff'
	}
} as FillExtrusionLayerSpecification;

export const FillLayerSample = {
	id: 'fill-layer-test',
	type: 'fill',
	source: 'source-test',
	'source-layer': 'source-layer-test',
	minzoom: 0,
	maxzoom: 24,
	paint: {
		'fill-color': '#ffffff'
	}
} satisfies FillLayerSpecification;

export const HeatmapLayerSample = {
	id: 'heatmap-layer-test',
	type: 'heatmap',
	source: 'source-test',
	'source-layer': 'source-layer-test',
	minzoom: 0,
	maxzoom: 24,
	paint: {
		'heatmap-radius': 10
	}
} satisfies HeatmapLayerSpecification;

export const HillshadeLayerSample = {
	id: 'hillshade-layer-test',
	type: 'hillshade',
	source: 'source-test',
	'source-layer': 'source-layer-test',
	minzoom: 0,
	maxzoom: 24,
	paint: {
		'hillshade-illumination-direction': 10
	}
} satisfies HillshadeLayerSpecification;

export const LineLayerSample = {
	id: 'line-layer-test',
	type: 'line',
	source: 'source-test',
	'source-layer': 'source-layer-test',
	minzoom: 0,
	maxzoom: 24,
	paint: {
		'line-color': '#ffffff'
	}
} satisfies LineLayerSpecification;

export const RasterLayerSample = {
	id: 'raster-layer-test',
	type: 'raster',
	source: 'source-test',
	'source-layer': 'source-layer-test',
	minzoom: 0,
	maxzoom: 24,
	paint: {
		'raster-opacity': 0.5
	}
} satisfies RasterLayerSpecification;

export const SymbolLayerSample = {
	id: 'symbol-layer-test',
	type: 'symbol',
	source: 'source-test',
	'source-layer': 'source-layer-test',
	minzoom: 0,
	maxzoom: 24,
	layout: {
		'text-field': 'test'
	}
} satisfies SymbolLayerSpecification;
