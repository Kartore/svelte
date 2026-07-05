import type { StyleSpecification } from 'maplibre-gl';

export type MapStyleStoreAdapter = {
	id: string;
	load: () => Promise<StyleSpecification | null>;
	save: (style: StyleSpecification) => Promise<void>;
};
