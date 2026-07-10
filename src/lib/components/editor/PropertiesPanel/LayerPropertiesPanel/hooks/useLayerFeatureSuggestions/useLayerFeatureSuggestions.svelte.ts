import type {
	BackgroundLayerSpecification,
	LayerSpecification,
	SourceSpecification
} from '@maplibre/maplibre-gl-style-spec';

import type {
	ExpressionSuggestionValue,
	ExpressionSuggestions
} from '$lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';
import { createSourceLayers } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSourceLayers/useSourceLayers.svelte.ts';
import { useBackgroundMap } from '$lib/contexts/backgroundMap.svelte.ts';

const MAX_FEATURES = 2000;
const MAX_VALUES_PER_KEY = 50;

/**
 * Collects feature property keys and observed values for a layer's
 * source/source-layer: keys come from the TileJSON `vector_layers[].fields`
 * merged with properties of features already loaded on the map, values from
 * the loaded features only (suggestions, not an exhaustive list).
 */
export const createLayerFeatureSuggestions = (
	getSources: () => { [key: string]: SourceSpecification },
	getLayer: () => Exclude<LayerSpecification, BackgroundLayerSpecification>
) => {
	const backgroundMap = useBackgroundMap();
	const sourceId = $derived(getLayer().source);
	const sourceLayerId = $derived.by(() => {
		const layer = getLayer();
		return 'source-layer' in layer ? layer['source-layer'] : undefined;
	});
	const sourceLayersState = createSourceLayers(() => {
		const source = getSources()[sourceId];
		return source?.type === 'vector' ? source : undefined;
	});

	// loaded features grow as tiles arrive — refresh the collected values when
	// the map settles instead of sampling only once on mount
	let featuresVersion = $state(0);
	$effect(() => {
		const map = backgroundMap.map;
		if (!map) return;
		const handleIdle = () => {
			featuresVersion += 1;
		};
		map.on('idle', handleIdle);
		return () => {
			map.off('idle', handleIdle);
		};
	});

	const suggestions: ExpressionSuggestions = $derived.by(() => {
		void featuresVersion;
		const sourceLayers = sourceLayersState.sourceLayers;
		const map = backgroundMap.map;

		const fields =
			sourceLayers?.find((sourceLayer) => sourceLayer.id === sourceLayerId)?.fields ?? {};

		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- 非リアクティブな一時コレクション
		const valuesByKey = new Map<string, Set<ExpressionSuggestionValue>>();
		try {
			const features =
				map?.querySourceFeatures(sourceId, {
					sourceLayer: sourceLayerId
				}) ?? [];
			for (const feature of features.slice(0, MAX_FEATURES)) {
				for (const [key, value] of Object.entries(feature.properties ?? {})) {
					if (
						typeof value !== 'string' &&
						typeof value !== 'number' &&
						typeof value !== 'boolean'
					) {
						continue;
					}
					// eslint-disable-next-line svelte/prefer-svelte-reactivity -- 非リアクティブな一時コレクション
					const values = valuesByKey.get(key) ?? new Set<ExpressionSuggestionValue>();
					if (values.size < MAX_VALUES_PER_KEY) {
						values.add(value);
					}
					valuesByKey.set(key, values);
				}
			}
		} catch {
			// the source may not be loaded on the map yet — keys from TileJSON still apply
		}

		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- 非リアクティブな一時コレクション
		const names = [...new Set([...Object.keys(fields), ...valuesByKey.keys()])].sort();
		return {
			propertyKeys: names.map((name) => ({ name, type: fields[name] })),
			getValueSuggestions: (key: string) => {
				return [...(valuesByKey.get(key) ?? [])].sort((a, b) => String(a).localeCompare(String(b)));
			}
		};
	});

	return {
		get suggestions(): ExpressionSuggestions {
			return suggestions;
		}
	};
};
