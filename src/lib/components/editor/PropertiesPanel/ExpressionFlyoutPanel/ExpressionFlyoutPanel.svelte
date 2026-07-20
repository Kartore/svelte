<script lang="ts">
	import type {
		BackgroundLayerSpecification,
		ExpressionSpecification,
		FilterSpecification,
		LayerSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { HTMLAttributes } from 'svelte/elements';

	import { Button } from '$lib/components/common/Button';
	import { ExpressionInputField } from '$lib/components/common/FilterInputField/expressions';
	import { ExpressionJsonEditor } from '$lib/components/common/FilterInputField/expressions/common/ExpressionJsonEditor';
	import { FilterQueryBuilder } from '$lib/components/common/FilterQueryBuilder';
	import { provideLayerErrors } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/LayerErrorsContext';
	import { PropertyErrorMessage } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/PropertyErrorMessage';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { CloseIcon } from '$lib/components/icons';
	import type { ExpressionFlyoutTarget } from '$lib/contexts/expressionFlyout.svelte.ts';
	import { getLayerProperties, getLayerZoomRange } from '$lib/utils/layerSpec.ts';
	import type { LayerValidationError } from '$lib/utils/styleValidation.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		layer,
		target,
		errors,
		onChange,
		onClose,
		class: className,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: LayerSpecification;
		target: ExpressionFlyoutTarget;
		errors?: LayerValidationError[];
		onChange?: onChangeType;
		onClose?: () => void;
	} = $props();

	provideLayerErrors(() => errors ?? []);
	let editorMode = $state<'builder' | 'json'>('builder');

	const isFilter = $derived(target.group === 'filter');
	const zoomRange = $derived(getLayerZoomRange(layer));
	const propertySpec = $derived(
		isFilter
			? undefined
			: getLayerProperties(layer.type, target.group as 'paint' | 'layout').find(
					(entry) => entry.key === target.key
				)?.spec
	);
	const value = $derived(
		isFilter
			? 'filter' in layer
				? layer.filter
				: undefined
			: (layer[target.group as keyof LayerSpecification] as Record<string, unknown> | undefined)?.[
					target.key
				]
	);
	const handleExpressionChange = (next: ExpressionSpecification) => {
		onChange?.(layer, target.group as never, target.key as never, next as never);
	};
</script>

<div
	{...props}
	class={cn(
		'pointer-events-auto flex flex-col overflow-hidden rounded-lg border border-gray-300 bg-white',
		className
	)}
	role="complementary"
	aria-label={`Expression editor for ${target.label}`}
>
	<div
		class="flex shrink-0 flex-row items-center justify-between border-b border-gray-200 px-4 py-2"
	>
		<div class="flex min-w-0 flex-col">
			<h3 class="truncate font-montserrat text-sm font-semibold">{target.label}</h3>
			<span class="truncate font-mono text-xs text-gray-500" title={`${layer.id} · ${target.key}`}>
				{layer.id} · {target.key}
			</span>
		</div>
		<Button
			aria-label="Close expression editor"
			class="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
			onclick={onClose}
		>
			<CloseIcon class="h-4 w-4 fill-current" />
		</Button>
	</div>
	{#if !isFilter}
		<div class="flex shrink-0 items-center gap-1 border-b border-gray-200 px-4 py-1.5">
			<Button
				aria-pressed={editorMode === 'builder'}
				class={cn(
					'rounded px-2 py-1 text-xs font-semibold',
					editorMode === 'builder'
						? 'bg-gray-200 text-gray-800 hover:bg-gray-200'
						: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
				)}
				onclick={() => (editorMode = 'builder')}
			>
				Builder
			</Button>
			<Button
				aria-pressed={editorMode === 'json'}
				class={cn(
					'rounded px-2 py-1 text-xs font-semibold',
					editorMode === 'json'
						? 'bg-gray-200 text-gray-800 hover:bg-gray-200'
						: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
				)}
				onclick={() => (editorMode = 'json')}
			>
				Advanced JSON
			</Button>
		</div>
	{/if}
	<div class="flex min-w-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
		{#if isFilter}
			<FilterQueryBuilder
				value={value as FilterSpecification | undefined}
				onChange={(next) =>
					onChange?.(
						// filter フライアウトは background 以外からしか開かれない
						layer as Exclude<LayerSpecification, BackgroundLayerSpecification>,
						undefined,
						'filter',
						next
					)}
			/>
			<PropertyErrorMessage group="filter" />
		{:else if editorMode === 'json'}
			{#key `${layer.id}:${target.group}:${target.key}`}
				<ExpressionJsonEditor
					value={value as ExpressionSpecification}
					{propertySpec}
					onChange={handleExpressionChange}
				/>
			{/key}
			<PropertyErrorMessage group={target.group} property={target.key} />
		{:else}
			<div class="expression-builder max-w-full min-w-0">
				<ExpressionInputField
					class="w-full text-sm"
					value={value as ExpressionSpecification}
					{propertySpec}
					{zoomRange}
					onChange={handleExpressionChange}
				/>
			</div>
			<PropertyErrorMessage group={target.group} property={target.key} />
		{/if}
	</div>
</div>

<style>
	/* Filter groups use a quiet left rule for hierarchy. Expressions mirror that
	   structure while keeping the existing neutral palette. */
	.expression-builder :global([data-expression-node]) {
		max-width: 100%;
		min-width: 0;
		flex-wrap: wrap;
		color: #374151;
		overflow-wrap: anywhere;
	}

	.expression-builder :global([data-expression-node='root']) {
		width: 100%;
		background-color: #f9fafb;
		box-shadow: inset 0 0 0 1px #e5e7eb;
	}

	.expression-builder :global([data-expression-node='nested']) {
		flex: 1 1 12rem;
		border-left: 1px solid #d1d5db;
		border-radius: 0;
		background-color: transparent;
		box-shadow: none;
		padding-right: 0;
		padding-left: 0.5rem;
	}

	.expression-builder :global([data-expression-node] .text-gray-400),
	.expression-builder :global([data-expression-node].text-gray-400) {
		color: #6b7280;
	}
</style>
