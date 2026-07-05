import type { VectorSourceSpecification } from '@maplibre/maplibre-gl-style-spec';

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
	let data = $state<SourceVectorLayer[] | undefined>(undefined);

	$effect(() => {
		const url = getSource()?.url;
		data = undefined;
		if (!url) return;
		let cancelled = false;
		void (async () => {
			try {
				const response = await fetch(url);
				const json = (await response.json()) as { vector_layers?: SourceVectorLayer[] };
				if (cancelled) return;
				if (!Object.prototype.hasOwnProperty.call(json, 'vector_layers')) {
					return;
				}
				data = json.vector_layers;
			} catch {
				// fetch/parse failure — keep data undefined
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	return {
		get sourceLayers(): SourceVectorLayer[] | undefined {
			return data;
		}
	};
};
