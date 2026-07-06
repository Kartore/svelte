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
</script>

<div {...props} class={cn('flex flex-col gap-2 px-4', className)}>
	<div class="flex flex-row items-center justify-between">
		<h3 class="font-montserrat text-sm font-semibold">Filter</h3>
		{#if layer.filter === undefined}
			<Button
				aria-label="Add filter"
				class="rounded px-2 py-0.5 text-xs font-semibold text-gray-500"
				onclick={() => onChange?.(layer, undefined, 'filter', defaultFilter)}
			>
				+ Add
			</Button>
		{:else}
			<Button
				aria-label="Delete filter"
				class="rounded px-2 py-0.5 text-xs font-semibold text-gray-500 hover:text-red-500"
				onclick={() => onChange?.(layer, undefined, 'filter', undefined)}
			>
				Delete
			</Button>
		{/if}
	</div>
	{#if layer.filter === undefined}
		<!-- no filter -->
	{:else if isExpressionFilter(layer.filter)}
		<FilterInputField
			value={layer.filter}
			onChange={(value) => onChange?.(layer, undefined, 'filter', value)}
		/>
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
