<script lang="ts">
	import type {
		BackgroundLayerSpecification,
		ExpressionFilterSpecification,
		FilterSpecification,
		LayerSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { FunctionIcon, Plus, Trash } from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import { FilterQueryBuilder } from '#lib/components/common/FilterQueryBuilder';
	import { PropertyErrorMessage } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/PropertyErrorMessage';
	import { PropertyHistoryPopover } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/PropertyHistoryPopover';
	import type { onChangeType } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { useExpressionFlyout } from '#lib/contexts/expressionFlyout.svelte.ts';
	import { useStyleHistory } from '#lib/contexts/styleHistory.svelte.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

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
	const history = useStyleHistory();
	const canShowHistory = $derived(history !== undefined && history.provider !== null);
	const isFlyoutOpen = $derived(flyout?.isOpen('filter', 'filter') ?? false);
	const openFlyout = (anchorElement: HTMLElement) =>
		flyout?.open({ group: 'filter', key: 'filter', label: 'フィルター' }, anchorElement);
	const toggleFlyout = (anchorElement: HTMLElement) => {
		if (isFlyoutOpen) flyout?.close();
		else openFlyout(anchorElement);
	};
	const handleEditButtonRef = (anchorElement: HTMLButtonElement | null) => {
		if (!anchorElement) return;
		flyout?.reanchor('filter', 'filter', anchorElement);
	};
	const restoreFilter = (value: unknown | undefined) => {
		if (value === undefined && isFlyoutOpen) flyout?.close();
		onChange?.(layer, undefined, 'filter', value as FilterSpecification | undefined);
	};
	const filterSummary = $derived(
		Array.isArray(layer.filter) && typeof layer.filter[0] === 'string'
			? layer.filter[0]
			: String(layer.filter)
	);
</script>

<div {...props} class={cn('flex flex-col px-3', className)}>
	<div class="flex h-7 flex-row items-center justify-between border-b border-hairline-soft">
		<h3 class="text-[11px] font-semibold text-ink-1">フィルター</h3>
		<div class="flex flex-row items-center gap-1">
			{#if canShowHistory}
				<PropertyHistoryPopover
					layerId={layer.id}
					group="filter"
					key="filter"
					label="フィルター"
					currentValue={layer.filter}
					onRestore={restoreFilter}
				/>
			{/if}
			{#if layer.filter === undefined}
				<Button
					aria-label="フィルターを追加"
					class="flex h-6 items-center gap-1 rounded-[6px] px-1.5 text-[11px] font-semibold text-ink-3 hover:bg-field hover:text-ink-1"
					onclick={(event) => {
						onChange?.(layer, undefined, 'filter', defaultFilter);
						openFlyout(event.currentTarget);
					}}
				>
					<Plus size={14} weight="regular" aria-hidden="true" />
					追加
				</Button>
			{:else}
				{#if flyout !== undefined}
					<Button
						bind:ref={() => null, handleEditButtonRef}
						aria-label="フィルター式を編集"
						aria-pressed={isFlyoutOpen}
						class={cn(
							'flex h-6 min-w-0 flex-row items-center gap-1.5 rounded-[6px] border px-2 text-[11px] transition-colors',
							isFlyoutOpen
								? 'border-accent bg-accent-soft text-accent'
								: 'border-hairline-soft bg-field text-ink-2 hover:border-hairline hover:bg-field'
						)}
						onclick={(event) => toggleFlyout(event.currentTarget)}
					>
						<FunctionIcon size={14} weight="regular" class="shrink-0" aria-hidden="true" />
						<span class="truncate font-mono">{filterSummary}</span>
					</Button>
				{/if}
				<Button
					aria-label="フィルターを削除"
					title="フィルターを削除"
					class="flex size-6 shrink-0 items-center justify-center rounded-[6px] text-ink-3 hover:bg-field hover:text-ink-1"
					onclick={() => {
						if (isFlyoutOpen) flyout?.close();
						onChange?.(layer, undefined, 'filter', undefined);
					}}
				>
					<Trash size={14} weight="regular" aria-hidden="true" />
				</Button>
			{/if}
		</div>
	</div>
	<div class="py-1">
		{#if layer.filter === undefined}
			<!-- no filter -->
		{:else if flyout === undefined}
			<FilterQueryBuilder
				value={layer.filter}
				onChange={(value) => onChange?.(layer, undefined, 'filter', value)}
			/>
		{/if}
		<PropertyErrorMessage group="filter" />
	</div>
	{@render children?.()}
</div>
