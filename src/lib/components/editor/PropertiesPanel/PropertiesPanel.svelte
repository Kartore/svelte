<script lang="ts">
	import type {
		LayerSpecification,
		SourceSpecification,
		SpriteSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { Button } from '$lib/components/common/Button';
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
		onDuplicateLayer,
		onDeleteLayer,
		canDeleteLayer = true,
		children,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: LayerSpecification;
		sprite?: SpriteSpecification;
		sources: { [key: string]: SourceSpecification };
		errors?: LayerValidationError[];
		onChange?: onChangeType;
		onDuplicateLayer?: () => void;
		onDeleteLayer?: () => void;
		canDeleteLayer?: boolean;
		children?: Snippet;
	} = $props();

	let confirmingDelete = $state(false);
</script>

<div
	{...props}
	class={cn(
		'pointer-events-auto overflow-y-auto rounded-lg border border-gray-300/80 bg-white/95 py-4 shadow-lg shadow-gray-950/10 backdrop-blur',
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
	<div class="mx-4 mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4">
		{#if confirmingDelete}
			<div class="rounded-md border border-red-200 bg-red-50 px-3 py-2">
				<p class="mb-2 text-xs font-semibold text-red-700">Delete this layer permanently?</p>
				<div class="flex justify-end gap-2">
					<Button
						class="h-8 rounded-md px-3 text-xs font-semibold text-gray-600 hover:bg-red-100"
						onclick={() => (confirmingDelete = false)}
					>
						Cancel
					</Button>
					<Button
						class="h-8 rounded-md bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-500"
						onclick={() => {
							confirmingDelete = false;
							onDeleteLayer?.();
						}}
					>
						Delete
					</Button>
				</div>
			</div>
		{:else}
			<div class="flex justify-end gap-2 rounded-md bg-gray-50 px-3 py-2">
				<Button
					class="h-8 rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50"
					onclick={onDuplicateLayer}
				>
					Duplicate layer
				</Button>
				<Button
					class="h-8 rounded-md px-3 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent"
					disabled={!canDeleteLayer}
					title={canDeleteLayer ? undefined : 'The style must have at least one layer.'}
					onclick={() => {
						confirmingDelete = true;
					}}
				>
					Delete layer
				</Button>
			</div>
		{/if}
	</div>
	{@render children?.()}
</div>
