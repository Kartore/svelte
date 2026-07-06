<script lang="ts">
	import type {
		BackgroundLayerSpecification,
		LayerSpecification,
		SourceSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { RangeSlider } from '$lib/components/common/RangeSlider';
	import { Select } from '$lib/components/common/Select';
	import { TextField } from '$lib/components/common/TextField';
	import { createSourceLayers } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSourceLayers/useSourceLayers.svelte.ts';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { isVectorSource } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/SourceUtil/SourceUtil.ts';
	import { getLayerGroup, GROUP_METADATA_KEY } from '$lib/utils/layerGroup.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		layer,
		sources,
		onChange,
		children,
		class: className,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: Exclude<LayerSpecification, BackgroundLayerSpecification>;
		sources: { [key: string]: SourceSpecification };
		onChange?: onChangeType;
		children?: Snippet;
	} = $props();

	const sourceData = $derived(sources[layer.source]);
	const sourceLayersState = createSourceLayers(() => {
		const source = sources[layer.source];
		return isVectorSource(source) ? source : undefined;
	});
	const sourceLayers = $derived(sourceLayersState.sourceLayers);
</script>

<div {...props} class={cn('flex flex-col gap-2 px-4', className)}>
	<h3 class="font-montserrat text-sm font-semibold">General</h3>
	<TextField
		label="Group"
		value={getLayerGroup(layer) ?? ''}
		onCommit={(value) => onChange?.(layer, 'metadata', GROUP_METADATA_KEY, value || undefined)}
	/>
	<Select
		label="Source"
		items={Object.keys(sources).map((sourceId) => ({ value: sourceId, label: sourceId }))}
		value={layer.source}
		onValueChange={(value) => {
			if (onChange) onChange(layer, undefined, 'source', value);
		}}
	/>
	{#if isVectorSource(sourceData)}
		<Select
			label="Source Layer"
			items={(sourceLayers ?? []).map(({ id }) => ({ value: id, label: id }))}
			value={layer['source-layer']}
			onValueChange={(value) => {
				if (onChange) onChange(layer, undefined, 'source-layer', value);
			}}
		/>
	{/if}
	<RangeSlider
		label="Zoom Range"
		minValue={0}
		maxValue={24}
		step={1}
		value={[layer.minzoom ?? 0, layer.maxzoom ?? 24]}
		onValueChange={([minzoom, maxzoom]) => {
			if (minzoom !== layer.minzoom) {
				onChange?.(layer, undefined, 'minzoom', minzoom === 0 ? undefined : minzoom);
			}
			if (maxzoom !== layer.maxzoom) {
				onChange?.(layer, undefined, 'maxzoom', maxzoom === 24 ? undefined : maxzoom);
			}
		}}
	/>
	{@render children?.()}
</div>
