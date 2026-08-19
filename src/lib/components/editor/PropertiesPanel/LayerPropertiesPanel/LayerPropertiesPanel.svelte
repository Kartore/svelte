<script lang="ts">
	import type {
		LayerSpecification,
		SourceSpecification,
		SpriteSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { HTMLAttributes } from 'svelte/elements';

	import { BackgroundLayerPropertiesPanel } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/BackgroundLayerPropertiesPanel';
	import { CircleLayerPropertiesPanel } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/CircleLayerPropertiesPanel';
	import { provideLayerErrors } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/LayerErrorsContext';
	import { LayerSuggestionsProvider } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/LayerSuggestionsProvider';
	import { ColorReliefLayerPropertiesPanel } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/ColorReliefLayerPropertiesPanel';
	import { FillExtrusionLayerPropertiesPanel } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/FillExtrusionLayerPropertiesPanel';
	import { FillLayerPropertiesPanel } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/FillLayerPropertiesPanel';
	import { HeatmapLayerPropertiesPanel } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/HeatmapLayerPropertiesPanel';
	import { HillshadeLayerPropertiesPanel } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/HillshadeLayerPropertiesPanel';
	import { LineLayerPropertiesPanel } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/LineLayerPropertiesPanel';
	import { RasterLayerPropertiesPanel } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/RasterLayerPropertiesPanel';
	import { SymbolLayerPropertiesPanel } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/SymbolLayerPropertiesPanel';
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
	} from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import type { onChangeType } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { providePropertyCommit } from '#lib/contexts/propertyCommit.ts';
	import type { LayerValidationError } from '#lib/utils/styleValidation.ts';

	let {
		layer,
		sprite,
		fontSuggestions,
		sources,
		errors,
		onChange,
		onTransientChange,
		onCommitChange,
		onCancelTransient,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: LayerSpecification;
		sprite?: SpriteSpecification;
		fontSuggestions?: string[];
		sources: { [key: string]: SourceSpecification };
		errors?: LayerValidationError[];
		onChange?: onChangeType;
		onTransientChange?: onChangeType;
		onCommitChange?: onChangeType;
		onCancelTransient?: () => void;
	} = $props();

	provideLayerErrors(() => errors ?? []);
	providePropertyCommit({
		get onTransientChange() {
			return onTransientChange;
		},
		get onCommitChange() {
			return onCommitChange;
		},
		get onCancelTransient() {
			return onCancelTransient;
		}
	});
</script>

{#if isBackgroundLayer(layer)}
	<BackgroundLayerPropertiesPanel {layer} {sprite} {onChange} {...props} />
{:else}
	<LayerSuggestionsProvider {layer} {sources}>
		{#if isCircleLayer(layer)}
			<CircleLayerPropertiesPanel {layer} {sprite} {onChange} {...props} />
		{:else if isColorReliefLayer(layer)}
			<ColorReliefLayerPropertiesPanel {layer} {sprite} {onChange} {...props} />
		{:else if isFillExtrusionLayer(layer)}
			<FillExtrusionLayerPropertiesPanel {layer} {sprite} {onChange} {...props} />
		{:else if isFillLayer(layer)}
			<FillLayerPropertiesPanel {layer} {sprite} {onChange} {...props} />
		{:else if isHeatmapLayer(layer)}
			<HeatmapLayerPropertiesPanel {layer} {sprite} {onChange} {...props} />
		{:else if isHillshadeLayer(layer)}
			<HillshadeLayerPropertiesPanel {layer} {sprite} {onChange} {...props} />
		{:else if isLineLayer(layer)}
			<LineLayerPropertiesPanel {layer} {sprite} {onChange} {...props} />
		{:else if isRasterLayer(layer)}
			<RasterLayerPropertiesPanel {layer} {sprite} {onChange} {...props} />
		{:else if isSymbolLayer(layer)}
			<SymbolLayerPropertiesPanel {layer} {sprite} {fontSuggestions} {onChange} {...props} />
		{/if}
	</LayerSuggestionsProvider>
{/if}
