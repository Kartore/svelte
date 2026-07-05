import type {
	GeoJSONSourceSpecification,
	ImageSourceSpecification,
	RasterDEMSourceSpecification,
	RasterSourceSpecification,
	SourceSpecification,
	VectorSourceSpecification,
	VideoSourceSpecification
} from '@maplibre/maplibre-gl-style-spec';

export const isVectorSource = (
	source: SourceSpecification
): source is VectorSourceSpecification => {
	return source?.type === 'vector';
};

export const isRasterSource = (
	source: SourceSpecification
): source is RasterSourceSpecification => {
	return source?.type === 'raster';
};

export const isRasterDemSource = (
	source: SourceSpecification
): source is RasterDEMSourceSpecification => {
	return source?.type === 'raster-dem';
};

export const isGeoJSONSource = (
	source: SourceSpecification
): source is GeoJSONSourceSpecification => {
	return source?.type === 'geojson';
};

export const isVideoSource = (source: SourceSpecification): source is VideoSourceSpecification => {
	return source?.type === 'video';
};

export const isImageSource = (source: SourceSpecification): source is ImageSourceSpecification => {
	return source?.type === 'image';
};
