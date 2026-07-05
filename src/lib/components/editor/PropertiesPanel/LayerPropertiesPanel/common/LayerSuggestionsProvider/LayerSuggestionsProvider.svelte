<script lang="ts">
	import type {
		BackgroundLayerSpecification,
		LayerSpecification,
		SourceSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';

	import { provideExpressionSuggestions } from '$lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';
	import { createLayerFeatureSuggestions } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useLayerFeatureSuggestions';

	let {
		layer,
		sources,
		children
	}: {
		layer: Exclude<LayerSpecification, BackgroundLayerSpecification>;
		sources: { [key: string]: SourceSpecification };
		children?: Snippet;
	} = $props();

	// Supplies property-key / property-value suggestions derived from the layer's
	// source and source-layer to every expression input rendered below it.
	const featureSuggestions = createLayerFeatureSuggestions(
		() => sources,
		() => layer
	);
	provideExpressionSuggestions(() => featureSuggestions.suggestions);
</script>

{@render children?.()}
