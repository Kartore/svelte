<script lang="ts">
	import type {
		LayerSpecification,
		SourceSpecification,
		SpriteSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { HTMLAttributes } from 'svelte/elements';

	import { BackgroundLayerPropertiesPanel } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/BackgroundLayerPropertiesPanel';
	import { CircleLayerPropertiesPanel } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/CircleLayerPropertiesPanel';
	import { provideLayerErrors } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/LayerErrorsContext';
	import { LayerSuggestionsProvider } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/LayerSuggestionsProvider';
	import { ColorReliefLayerPropertiesPanel } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/ColorReliefLayerPropertiesPanel';
	import { FillExtrusionLayerPropertiesPanel } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/FillExtrusionLayerPropertiesPanel';
	import { FillLayerPropertiesPanel } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/FillLayerPropertiesPanel';
	import { HeatmapLayerPropertiesPanel } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/HeatmapLayerPropertiesPanel';
	import { HillshadeLayerPropertiesPanel } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/HillshadeLayerPropertiesPanel';
	import { LineLayerPropertiesPanel } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/LineLayerPropertiesPanel';
	import { RasterLayerPropertiesPanel } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/RasterLayerPropertiesPanel';
	import { SymbolLayerPropertiesPanel } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/SymbolLayerPropertiesPanel';
	import {
		isBackgroundLayer,
		isCircleLayer,
		isColorReliefLayer,
		isFillExtrusionLayer,
		isFillLayer,
		isHeatmapLayer,
		isHillshadeLayer,
		isLineLayer,
		isRasterLayer,
		isSymbolLayer
	} from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import type { LayerValidationError } from '$lib/utils/styleValidation.ts';

	let {
		layer,
		sprite,
		sources,
		errors,
		onChange,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: LayerSpecification;
		sprite?: SpriteSpecification;
		sources: { [key: string]: SourceSpecification };
		errors?: LayerValidationError[];
		onChange?: onChangeType;
	} = $props();

	provideLayerErrors(() => errors ?? []);
</script>

{#if isBackgroundLayer(layer)}
	<BackgroundLayerPropertiesPanel {layer} {sprite} {onChange} {...props} />
{:else}
	<LayerSuggestionsProvider {layer} {sources}>
		{#if isCircleLayer(layer)}
			<CircleLayerPropertiesPanel {layer} {sources} {sprite} {onChange} {...props} />
		{:else if isColorReliefLayer(layer)}
			<ColorReliefLayerPropertiesPanel {layer} {sources} {sprite} {onChange} {...props} />
		{:else if isFillExtrusionLayer(layer)}
			<FillExtrusionLayerPropertiesPanel {layer} {sources} {sprite} {onChange} {...props} />
		{:else if isFillLayer(layer)}
			<FillLayerPropertiesPanel {layer} {sources} {sprite} {onChange} {...props} />
		{:else if isHeatmapLayer(layer)}
			<HeatmapLayerPropertiesPanel {layer} {sources} {sprite} {onChange} {...props} />
		{:else if isHillshadeLayer(layer)}
			<HillshadeLayerPropertiesPanel {layer} {sources} {sprite} {onChange} {...props} />
		{:else if isLineLayer(layer)}
			<LineLayerPropertiesPanel {layer} {sources} {sprite} {onChange} {...props} />
		{:else if isRasterLayer(layer)}
			<RasterLayerPropertiesPanel {layer} {sources} {sprite} {onChange} {...props} />
		{:else if isSymbolLayer(layer)}
			<SymbolLayerPropertiesPanel {layer} {sources} {sprite} {onChange} {...props} />
		{/if}
	</LayerSuggestionsProvider>
{/if}
