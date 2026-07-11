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
	import { FilterQueryBuilder } from '$lib/components/common/FilterQueryBuilder';
	import { provideLayerErrors } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/LayerErrorsContext';
	import { PropertyErrorMessage } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/PropertyErrorMessage';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { CloseIcon } from '$lib/components/icons';
	import type { ExpressionFlyoutTarget } from '$lib/contexts/expressionFlyout.svelte.ts';
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

	const isFilter = $derived(target.group === 'filter');
	const value = $derived(
		isFilter
			? 'filter' in layer
				? layer.filter
				: undefined
			: (layer[target.group as keyof LayerSpecification] as Record<string, unknown> | undefined)?.[
					target.key
				]
	);
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
			<h3 class="font-montserrat truncate text-sm font-semibold">{target.label}</h3>
			<span class="truncate font-mono text-xs text-gray-400">{target.key}</span>
		</div>
		<Button
			aria-label="Close expression editor"
			class="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
			onclick={onClose}
		>
			<CloseIcon class="h-4 w-4 fill-current" />
		</Button>
	</div>
	<div class="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-3">
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
		{:else}
			<ExpressionInputField
				class="text-sm"
				value={value as ExpressionSpecification}
				onChange={(next) =>
					onChange?.(layer, target.group as never, target.key as never, next as never)}
			/>
			<PropertyErrorMessage group={target.group} property={target.key} />
		{/if}
	</div>
</div>
