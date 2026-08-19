<script lang="ts" module>
	export type LayerInspectorTab = 'design' | 'data' | 'filter' | 'json';
</script>

<script lang="ts">
	import type {
		ExpressionFilterSpecification,
		LayerSpecification,
		SourceSpecification,
		SpriteSpecification,
		StyleSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import { ClockCounterClockwise, Copy, DotsThree, Trash } from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import { RowPopover } from '#lib/components/common/RowPopover';
	import { PropertiesPanel } from '#lib/components/editor/PropertiesPanel';
	import type { onChangeType } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { isBackgroundLayer } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import {
		isFilterBuilderSupported,
		parseFilter,
		serializeFilter
	} from '#lib/components/common/FilterQueryBuilder';
	import type { LayerValidationError } from '#lib/utils/styleValidation.ts';
	import { getLayerGroup } from '#lib/utils/layerGroup.ts';
	import { referencedFontStacks } from '#lib/utils/assetUsage.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	import LayerDataPanel from './LayerDataPanel.svelte';
	import LayerFilterPanel from './LayerFilterPanel.svelte';
	import LayerJsonPanel from './LayerJsonPanel.svelte';

	let {
		class: className,
		activeTab = $bindable<LayerInspectorTab>('design'),
		mapStyle,
		layer,
		sprite,
		fontNames = [],
		sources,
		errors,
		readOnly = false,
		onChange,
		onTransientChange,
		onCommitChange,
		onCancelTransient,
		onApplyLayer,
		onDuplicateLayer,
		onDeleteLayer,
		canDeleteLayer = true
	}: {
		class?: string;
		activeTab?: LayerInspectorTab;
		mapStyle: StyleSpecification;
		layer: LayerSpecification;
		sprite?: SpriteSpecification;
		fontNames?: string[];
		sources: Record<string, SourceSpecification>;
		errors?: LayerValidationError[];
		readOnly?: boolean;
		onChange?: onChangeType;
		onTransientChange?: onChangeType;
		onCommitChange?: onChangeType;
		onCancelTransient?: () => void;
		onApplyLayer: (layer: LayerSpecification, previousId: string) => void;
		onDuplicateLayer?: () => void;
		onDeleteLayer?: () => void;
		canDeleteLayer?: boolean;
	} = $props();

	const tabs: { value: LayerInspectorTab; label: string }[] = [
		{ value: 'design', label: 'デザイン' },
		{ value: 'data', label: 'データ' },
		{ value: 'filter', label: 'フィルター' },
		{ value: 'json', label: 'JSON' }
	];
	const addPropertyFilter = (key: string, value: string | number | boolean) => {
		activeTab = 'filter';
		if (isBackgroundLayer(layer)) return;
		const tree = parseFilter(layer.filter);
		if (!isFilterBuilderSupported(tree)) return;
		const next = {
			...tree,
			children: [
				...tree.children,
				{
					kind: 'comparison' as const,
					op: '==' as const,
					subject: { kind: 'property' as const, key },
					value
				}
			]
		};
		onChange?.(layer, undefined, 'filter', serializeFilter(next) as ExpressionFilterSpecification);
	};
	const changeFilter = (value: ExpressionFilterSpecification | undefined) => {
		if (isBackgroundLayer(layer)) return;
		onChange?.(layer, undefined, 'filter', value);
	};
	const layerSourceSummary = $derived.by(() => {
		if (isBackgroundLayer(layer)) return layer.type;
		const sourceLayer = 'source-layer' in layer ? layer['source-layer'] : undefined;
		return `${layer.type} ・ ${layer.source}${sourceLayer ? ` / ${sourceLayer}` : ''}`;
	});
	const layerGroup = $derived(getLayerGroup(layer));
	const fontSuggestions = $derived(
		[...new Set([...fontNames, ...referencedFontStacks(mapStyle)])].sort((a, b) =>
			a.localeCompare(b)
		)
	);
</script>

<div
	data-properties-panel=""
	class={cn('flex h-full min-h-0 flex-col overflow-hidden bg-white', className)}
>
	<div class="flex shrink-0 items-start justify-between gap-2 px-4 pt-3 pb-2">
		<div class="min-w-0">
			<h2 class="truncate text-[12.5px] leading-[18px] font-semibold text-ink-1">{layer.id}</h2>
			<p class="mt-0.5 truncate text-[10.5px] leading-[15px] text-ink-3">
				{layerSourceSummary}
			</p>
			{#if layerGroup}
				<p class="truncate text-[10px] leading-[14px] text-ink-3">グループ ・ {layerGroup}</p>
			{/if}
		</div>
		<div class="flex shrink-0 items-center gap-0.5">
			<Button
				class="flex size-6 items-center justify-center rounded-[5px] text-ink-3 hover:bg-field hover:text-ink-1"
				aria-label="レイヤー履歴"
				title="レイヤー履歴"
			>
				<ClockCounterClockwise size={16} weight="regular" aria-hidden="true" />
			</Button>
			<RowPopover
				aria-label="レイヤー操作"
				triggerClass="flex size-6 items-center justify-center rounded-[5px] text-ink-3 hover:bg-field hover:text-ink-1"
				contentClass="w-44 p-1.5"
			>
				{#snippet trigger()}
					<DotsThree size={18} weight="regular" aria-hidden="true" />
				{/snippet}
				{#snippet children({ close })}
					<Button
						class="flex h-7 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[11px] text-ink-2 hover:bg-field hover:text-ink-1"
						onclick={() => {
							onDuplicateLayer?.();
							close();
						}}
					>
						<Copy size={15} weight="regular" aria-hidden="true" />
						レイヤーを複製
					</Button>
					<Button
						class="flex h-7 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[11px] text-ink-2 hover:bg-field hover:text-ink-1 disabled:text-ink-4"
						disabled={!canDeleteLayer}
						onclick={() => {
							onDeleteLayer?.();
							close();
						}}
					>
						<Trash size={15} weight="regular" aria-hidden="true" />
						レイヤーを削除
					</Button>
				{/snippet}
			</RowPopover>
		</div>
	</div>

	<div
		class="flex shrink-0 gap-[14px] border-b border-hairline px-4"
		role="tablist"
		aria-label="レイヤー編集"
	>
		{#each tabs as tab (tab.value)}
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === tab.value}
				class={cn(
					'relative cursor-pointer px-px pt-1.5 pb-2 text-[11px] font-normal text-ink-2 hover:text-ink-1 focus-visible:outline-2 focus-visible:outline-accent',
					activeTab === tab.value &&
						'font-semibold text-ink-1 after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-accent'
				)}
				onclick={() => (activeTab = tab.value)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<div class="min-h-0 flex-1">
		{#if activeTab === 'design'}
			<PropertiesPanel
				class="h-full w-full min-w-0 rounded-none border-0 shadow-none"
				{sprite}
				{fontSuggestions}
				{layer}
				{sources}
				{errors}
				{onChange}
				{onTransientChange}
				{onCommitChange}
				{onCancelTransient}
			/>
		{:else if activeTab === 'data'}
			{#if isBackgroundLayer(layer)}
				<p class="px-3 py-8 text-center text-[10px] text-ink-3">
					背景レイヤーにはデータソースがありません。
				</p>
			{:else}
				<LayerDataPanel {layer} {sources} {onApplyLayer} onFilterProperty={addPropertyFilter} />
			{/if}
		{:else if activeTab === 'filter'}
			{#if isBackgroundLayer(layer)}
				<p class="px-3 py-8 text-center text-[10px] text-ink-3">
					背景レイヤーには filter がありません。
				</p>
			{:else}
				{#key layer.id}
					<LayerFilterPanel
						{layer}
						{sources}
						onChange={changeFilter}
						onRequestJson={() => (activeTab = 'json')}
					/>
				{/key}
			{/if}
		{:else}
			<LayerJsonPanel {layer} {mapStyle} {readOnly} onApply={onApplyLayer} />
		{/if}
	</div>
</div>
