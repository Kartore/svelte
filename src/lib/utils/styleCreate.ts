import type { StyleSpecification } from 'maplibre-gl';

/** MapLibre が受理できる、ソースもレイヤーも持たない新規スタイルを作る。 */
export const createEmptyStyle = (): StyleSpecification => ({
	version: 8,
	sources: {},
	layers: []
});
