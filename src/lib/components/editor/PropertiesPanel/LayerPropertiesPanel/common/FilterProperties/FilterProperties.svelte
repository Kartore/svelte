<script lang="ts">
	import type {
		BackgroundLayerSpecification,
		ExpressionFilterSpecification,
		LayerSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { Button } from '$lib/components/common/Button';
	import { FilterInputField } from '$lib/components/common/FilterInputField';
	import { MonacoEditor } from '$lib/components/common/MonacoEditor';
	import { isExpressionFilter } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/FilterProperties/utils/isExpressionFilter.ts';
	import { PropertyErrorMessage } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/PropertyErrorMessage';
	import { getStyleJSONSchemaDefinition } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/RawDataProperties/schema/StyleJSONSchemaBase.ts';
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
	const openFlyout = () => flyout?.open({ group: 'filter', key: 'filter', label: 'Filter' });
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
				onclick={() => {
					onChange?.(layer, undefined, 'filter', defaultFilter);
					openFlyout();
				}}
			>
				+ Add
			</Button>
		{:else}
			<div class="flex flex-row items-center gap-1">
				{#if flyout !== undefined && isExpressionFilter(layer.filter)}
					<Button
						aria-label="Edit filter expression"
						aria-pressed={isFlyoutOpen}
						class={cn(
							'flex min-w-0 flex-row items-center gap-1.5 rounded border px-2 py-0.5 text-xs transition-colors',
							isFlyoutOpen
								? 'border-blue-300 bg-blue-50 text-blue-600'
								: 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
						)}
						onclick={openFlyout}
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
	{:else if isExpressionFilter(layer.filter)}
		{#if flyout === undefined}
			<FilterInputField
				value={layer.filter}
				onChange={(value) => onChange?.(layer, undefined, 'filter', value)}
			/>
		{/if}
	{:else}
		<summary>
			<details>
				<MonacoEditor
					class={cn('min-h-16', className)}
					value={JSON.stringify({ filter: layer.filter ? layer.filter : [] }, undefined, 2)}
					onChange={(value) => {
						if (onChange && value) {
							const filterValue = JSON.parse(value).filter;
							onChange(
								layer,
								undefined,
								'filter',
								filterValue.length === 0 ? undefined : filterValue
							);
						}
					}}
					onMount={(_, monaco) => {
						// monaco-editor 0.55: `monaco.languages.json` is a deprecated type stub — the
						// typed equivalent of `monaco.languages.json.jsonDefaults` is `monaco.json.jsonDefaults`
						monaco.json.jsonDefaults.setDiagnosticsOptions({
							validate: true,
							schemas: [
								{
									fileMatch: ['*'],
									uri: 'kartore://FilterSpecification.json',
									schema: {
										type: 'object',
										properties: {
											filter: getStyleJSONSchemaDefinition('FilterSpecification')
										}
									}
								}
							]
						});
					}}
				/>
			</details>
		</summary>
	{/if}
	<PropertyErrorMessage group="filter" />
	{@render children?.()}
</div>
