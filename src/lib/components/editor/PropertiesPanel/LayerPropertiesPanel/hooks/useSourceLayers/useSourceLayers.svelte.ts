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

export type TileJsonMetadata = {
	tilejson?: string;
	name?: string;
	description?: string;
	minzoom?: number;
	maxzoom?: number;
	tiles?: string[];
	vector_layers?: SourceVectorLayer[];
};

export const createSourceLayers = (getSource: () => VectorSourceSpecification | undefined) => {
	const url = $derived(getSource()?.url);
	const query = createQuery(() => ({
		queryKey: ['tilejson', url],
		enabled: !!url,
		queryFn: async () => {
			const response = await fetch(url!);
			if (!response.ok) throw new Error(`TileJSON request failed (${response.status}).`);
			return (await response.json()) as TileJsonMetadata;
		}
	}));

	return {
		get sourceLayers(): SourceVectorLayer[] | undefined {
			return query.data?.vector_layers ?? undefined;
		},
		get tileJson(): TileJsonMetadata | undefined {
			return query.data ?? undefined;
		},
		get isLoading(): boolean {
			return query.isFetching;
		},
		get error(): Error | undefined {
			return query.error instanceof Error ? query.error : undefined;
		},
		refetch: () => query.refetch()
	};
};
