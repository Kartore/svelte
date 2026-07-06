<script lang="ts">
	import type {
		LayerSpecification,
		SourceSpecification,
		SpriteSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { LayerPropertiesPanel } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import type { LayerValidationError } from '$lib/utils/styleValidation.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		sources,
		sprite,
		layer,
		errors,
		onChange,
		children,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: LayerSpecification;
		sprite?: SpriteSpecification;
		sources: { [key: string]: SourceSpecification };
		errors?: LayerValidationError[];
		onChange?: onChangeType;
		children?: Snippet;
	} = $props();
</script>

<div
	{...props}
	class={cn(
		'pointer-events-auto overflow-y-auto rounded-lg border border-gray-300 bg-white py-4',
		className
	)}
>
	{#if errors && errors.length > 0}
		<div
			class="mx-4 mb-4 flex flex-col gap-1 rounded-md border border-red-300 bg-red-50 px-3 py-2"
			role="alert"
		>
			<h3 class="font-montserrat text-sm font-semibold text-red-600">
				{errors.length} error{errors.length === 1 ? '' : 's'} in this layer
			</h3>
			{#each errors as error (error.path + error.message)}
				<p class="text-xs break-words text-red-600">
					{#if error.path}
						<span class="font-semibold">{error.path}:</span>
					{/if}
					{error.message}
				</p>
			{/each}
		</div>
	{/if}
	<LayerPropertiesPanel {layer} {sprite} {sources} {errors} {onChange} />
	{@render children?.()}
</div>
