import type { VectorSourceSpecification } from '@maplibre/maplibre-gl-style-spec';
import { createQuery } from '@tanstack/svelte-query';

type SourceVectorLayer = {
	id: string;
	fields?: Record<string, string>;
	description?: string;
	minzoom?: number;
	maxzoom?: number;
	source?: string;
	source_name?: string;
};

export const createSourceLayers = (getSource: () => VectorSourceSpecification | undefined) => {
	const url = $derived(getSource()?.url);
	const query = createQuery(() => ({
		queryKey: ['tilejson', url],
		enabled: !!url,
		queryFn: async () => {
			const response = await fetch(url!);
			const json = (await response.json()) as { vector_layers?: SourceVectorLayer[] };
			return json.vector_layers ?? null;
		}
	}));

	return {
		get sourceLayers(): SourceVectorLayer[] | undefined {
			return query.data ?? undefined;
		}
	};
};
