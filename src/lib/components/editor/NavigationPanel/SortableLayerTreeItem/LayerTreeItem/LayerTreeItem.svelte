<script lang="ts">
	import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { HTMLAttributes } from 'svelte/elements';

	import { ErrorIcon, LayerIcon } from '$lib/components/icons';
	import { cn } from '$lib/utils/tailwindUtil';

	let {
		layer,
		indicator,
		disableInteraction,
		clone,
		class: className,
		isSelected,
		errors,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'id'> & {
		indicator?: boolean;
		clone?: boolean;
		disableInteraction?: boolean;
		layer: LayerSpecification;
		isSelected?: boolean;
		errors?: string[];
	} = $props();
</script>

<div
	{...props}
	class={cn(
		'flex w-full items-center gap-2 px-4 py-2 text-gray-800 text-sm',
		indicator && 'opacity-60',
		clone && 'inline-flex',
		disableInteraction || clone ? 'pointer-events-none' : 'pointer-events-auto',
		isSelected ? 'bg-gray-200' : 'hover:bg-gray-100',
		className
	)}
>
	<LayerIcon type={layer.type} class="h-3 w-3 min-w-3 cursor-grab" />
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
</div>
