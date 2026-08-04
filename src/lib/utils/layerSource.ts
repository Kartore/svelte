import type { LayerSpecification, SourceSpecification } from '@maplibre/maplibre-gl-style-spec';

type LayerType = LayerSpecification['type'];
type SourceType = SourceSpecification['type'];

export const sourceTypesByLayerType: Record<LayerType, SourceType[]> = {
	fill: ['vector', 'geojson'],
	line: ['vector', 'geojson'],
	symbol: ['vector', 'geojson'],
	circle: ['vector', 'geojson'],
	heatmap: ['vector', 'geojson'],
	'fill-extrusion': ['vector', 'geojson'],
	raster: ['raster'],
	hillshade: ['raster-dem'],
	'color-relief': ['raster-dem'],
	background: []
};

export const compatibleSourcesForLayer = (
	layerType: LayerType,
	sources: Record<string, SourceSpecification>
): [string, SourceSpecification][] => {
	const sourceTypes = sourceTypesByLayerType[layerType];
	return Object.entries(sources).filter(([, source]) => sourceTypes.includes(source.type));
};
