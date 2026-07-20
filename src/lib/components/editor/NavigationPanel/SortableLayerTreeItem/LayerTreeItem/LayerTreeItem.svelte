<script lang="ts">
	import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { HTMLAttributes } from 'svelte/elements';

	import { ErrorIcon, LayerIcon } from '$lib/components/icons';
	import { getLayerZoomRangeLabel, isLayerOutsideZoomRange } from '$lib/utils/layerSpec.ts';
	import { resolveLayerSwatchColor } from '$lib/utils/layerSwatch.ts';
	import { cn } from '$lib/utils/tailwindUtil';

	let {
		layer,
		indicator,
		disableInteraction,
		dragDisabled,
		currentZoom,
		indent,
		clone,
		class: className,
		isSelected,
		errors,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'id'> & {
		indicator?: boolean;
		clone?: boolean;
		disableInteraction?: boolean;
		dragDisabled?: boolean;
		currentZoom?: number;
		indent?: boolean;
		layer: LayerSpecification;
		isSelected?: boolean;
		errors?: string[];
	} = $props();

	const swatchColor = $derived(resolveLayerSwatchColor(layer));
	const dragCursorClass = $derived(dragDisabled ? 'cursor-default' : 'cursor-grab');
	const outsideZoomRange = $derived(isLayerOutsideZoomRange(layer, currentZoom));
	const zoomRangeLabel = $derived(getLayerZoomRangeLabel(layer));
</script>

<div
	{...props}
	class={cn(
		'flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-800',
		indicator && 'opacity-60',
		outsideZoomRange && 'opacity-45',
		clone && 'inline-flex',
		indent && 'pl-6',
		disableInteraction || clone ? 'pointer-events-none' : 'pointer-events-auto',
		isSelected ? 'bg-gray-200' : 'hover:bg-gray-100',
		className
	)}
>
	{#if swatchColor}
		<span
			class={cn(
				'size-[11px] min-w-[11px] rounded-[2px] border-[0.5px] border-black/25',
				dragCursorClass
			)}
			style:background={swatchColor}
			title={swatchColor}
		></span>
	{:else}
		<LayerIcon type={layer.type} class={cn('h-3 w-3 min-w-3', dragCursorClass)} />
	{/if}
	<p class="flex-1 overflow-hidden text-ellipsis">{layer.id}</p>
	{#if errors && errors.length > 0}
		<span class="flex items-center" title={errors.join('\n')}>
			<ErrorIcon
				class="h-3.5 w-3.5 min-w-3.5 fill-red-500"
				role="img"
				aria-label={`${layer.id} has ${errors.length} error${errors.length === 1 ? '' : 's'}`}
			/>
		</span>
	{/if}
	{#if outsideZoomRange && zoomRangeLabel}
		<span
			class="shrink-0 rounded-sm bg-gray-100 px-1 py-0.5 font-mono text-[10px] leading-none text-gray-500"
			title={`Layer visible at ${zoomRangeLabel}`}
		>
			{zoomRangeLabel}
		</span>
	{/if}
</div>
