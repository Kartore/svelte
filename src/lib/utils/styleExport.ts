import type { StyleSpecification } from 'maplibre-gl';

import { serializeStyle } from './styleSerialize.ts';

export type StyleExport = {
	contents: string;
	fileName: string;
};

export const createStyleExport = (style: StyleSpecification): StyleExport => ({
	contents: serializeStyle(style),
	fileName: `${(style.name ?? 'style').replace(/[\\/:*?"<>|]/g, '_')}.json`
});
