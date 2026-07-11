<script lang="ts">
	import type {
		BackgroundLayerSpecification,
		ExpressionFilterSpecification,
		LayerSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { Button } from '$lib/components/common/Button';
	import { FilterQueryBuilder } from '$lib/components/common/FilterQueryBuilder';
	import { PropertyErrorMessage } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/PropertyErrorMessage';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { useExpressionFlyout } from '$lib/contexts/expressionFlyout.svelte.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		layer,
		onChange,
		children,
		class: className,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: Exclude<LayerSpecification, BackgroundLayerSpecification>;
		onChange?: onChangeType;
		children?: Snippet;
	} = $props();

	const defaultFilter: ExpressionFilterSpecification = ['==', ['get', ''], ''];

	const flyout = useExpressionFlyout();
	const isFlyoutOpen = $derived(flyout?.isOpen('filter', 'filter') ?? false);
	const openFlyout = (anchorElement: HTMLElement) =>
		flyout?.open({ group: 'filter', key: 'filter', label: 'Filter' }, anchorElement);
	const toggleFlyout = (anchorElement: HTMLElement) => {
		if (isFlyoutOpen) flyout?.close();
		else openFlyout(anchorElement);
	};
	const handleEditButtonRef = (anchorElement: HTMLButtonElement | null) => {
		if (!anchorElement) return;
		flyout?.reanchor('filter', 'filter', anchorElement);
	};
	const filterSummary = $derived(
		Array.isArray(layer.filter) && typeof layer.filter[0] === 'string'
			? layer.filter[0]
			: String(layer.filter)
	);
</script>

<div {...props} class={cn('flex flex-col gap-2 px-4', className)}>
	<div class="flex flex-row items-center justify-between">
		<h3 class="font-montserrat text-sm font-semibold">Filter</h3>
		{#if layer.filter === undefined}
			<Button
				aria-label="Add filter"
				class="rounded px-2 py-0.5 text-xs font-semibold text-gray-500"
				onclick={(event) => {
					onChange?.(layer, undefined, 'filter', defaultFilter);
					openFlyout(event.currentTarget);
				}}
			>
				+ Add
			</Button>
		{:else}
			<div class="flex flex-row items-center gap-1">
				{#if flyout !== undefined}
					<Button
						bind:ref={() => null, handleEditButtonRef}
						aria-label="Edit filter expression"
						aria-pressed={isFlyoutOpen}
						class={cn(
							'flex min-w-0 flex-row items-center gap-1.5 rounded border px-2 py-0.5 text-xs transition-colors',
							isFlyoutOpen
								? 'border-blue-300 bg-blue-50 text-blue-600'
								: 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
						)}
						onclick={(event) => toggleFlyout(event.currentTarget)}
					>
						<span class="shrink-0 font-mono font-semibold italic">fx</span>
						<span class="truncate font-mono">{filterSummary}</span>
					</Button>
				{/if}
				<Button
					aria-label="Delete filter"
					class="shrink-0 rounded px-2 py-0.5 text-xs font-semibold text-gray-500 hover:text-red-500"
					onclick={() => {
						if (isFlyoutOpen) flyout?.close();
						onChange?.(layer, undefined, 'filter', undefined);
					}}
				>
					Delete
				</Button>
			</div>
		{/if}
	</div>
	{#if layer.filter === undefined}
		<!-- no filter -->
	{:else if flyout === undefined}
		<FilterQueryBuilder
			value={layer.filter}
			onChange={(value) => onChange?.(layer, undefined, 'filter', value)}
		/>
	{/if}
	<PropertyErrorMessage group="filter" />
	{@render children?.()}
</div>
