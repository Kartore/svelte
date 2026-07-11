import type { StyleSpecification } from 'maplibre-gl';

export type StyleExport = {
	contents: string;
	fileName: string;
};

export const createStyleExport = (style: StyleSpecification): StyleExport => ({
	contents: JSON.stringify(style, null, '\t'),
	fileName: `${(style.name ?? 'style').replace(/[\\/:*?"<>|]/g, '_')}.json`
});
