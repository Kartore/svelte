<script lang="ts">
	import type {
		BackgroundLayerSpecification,
		ExpressionSpecification,
		FilterSpecification,
		LayerSpecification,
		SpriteSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import { WarningCircle, X } from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import { ExpressionInputField } from '#lib/components/common/FilterInputField/expressions';
	import { provideSpriteImages } from '#lib/components/common/FilterInputField/expressions/common/SpriteImagesContext';
	import { isExpressionBuilderSupported } from '#lib/components/common/FilterInputField/expressions/utils/expressionBuilder.ts';
	import {
		FilterQueryBuilder,
		isFilterBuilderSupported,
		parseFilter
	} from '#lib/components/common/FilterQueryBuilder';
	import { Select } from '#lib/components/common/Select';
	import { provideLayerErrors } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/LayerErrorsContext';
	import { PropertyErrorMessage } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/PropertyErrorMessage';
	import type { onChangeType } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { createSpriteIds } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSpriteIds/useSpriteIds.svelte.ts';
	import type { ExpressionFlyoutTarget } from '#lib/contexts/expressionFlyout.svelte.ts';
	import { getLayerProperties, getLayerZoomRange } from '#lib/utils/layerSpec.ts';
	import type { LayerValidationError } from '#lib/utils/styleValidation.ts';

	import { getExpressionTypeItems } from './expressionTypeItems.ts';

	let {
		layer,
		sprite,
		target,
		errors,
		onChange,
		onRequestJson,
		onClose
	}: {
		layer: LayerSpecification;
		sprite?: SpriteSpecification;
		target: ExpressionFlyoutTarget;
		errors?: LayerValidationError[];
		onChange?: onChangeType;
		onRequestJson?: () => void;
		onClose?: () => void;
	} = $props();

	provideLayerErrors(() => errors ?? []);
	const spriteIdsState = createSpriteIds(() => sprite);
	provideSpriteImages(() => spriteIdsState.spriteImages);
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
	const expression = $derived(value as ExpressionSpecification | undefined);
	const filterBuilderSupported = $derived(
		isFilter && isFilterBuilderSupported(parseFilter(value as FilterSpecification | undefined))
	);
	const builderSupported = $derived(
		expression !== undefined && isExpressionBuilderSupported(expression)
	);
	const expressionType = $derived(
		expression && typeof expression[0] === 'string' ? expression[0] : 'expression'
	);
	const expressionTypeItems = $derived(getExpressionTypeItems(expressionType));
	const handleExpressionChange = (next: ExpressionSpecification) => {
		onChange?.(layer, target.group as never, target.key as never, next as never);
	};
	const handleFilterChange = (next: FilterSpecification | undefined) => {
		onChange?.(
			layer as Exclude<LayerSpecification, BackgroundLayerSpecification>,
			undefined,
			'filter',
			next
		);
	};
	const resetExpressionType = (type: string) => {
		const fallback = propertySpec?.default ?? '';
		const seeds: Record<string, ExpressionSpecification> = {
			interpolate: [
				'interpolate',
				['linear'],
				['zoom'],
				0,
				fallback,
				24,
				fallback
			] as unknown as ExpressionSpecification,
			step: ['step', ['zoom'], fallback, 12, fallback] as unknown as ExpressionSpecification,
			match: ['match', ['get', ''], '', fallback, fallback] as unknown as ExpressionSpecification,
			case: ['case', true, fallback, fallback] as unknown as ExpressionSpecification,
			get: ['get', ''],
			literal: ['literal', fallback]
		};
		const next = seeds[type];
		if (next) handleExpressionChange(next);
	};
</script>

<div class="flex max-h-[calc(100vh-1rem)] min-w-0 flex-col overflow-hidden">
	<div class="flex h-10 shrink-0 items-center gap-2 border-b border-hairline-soft pr-1.5 pl-3">
		<p class="min-w-0 truncate font-mono text-[11px] text-ink-1">
			{isFilter ? 'filter' : target.key}
		</p>
		{#if !isFilter && expression}
			<Select
				class="w-[86px]"
				triggerClass="h-6 rounded-[5px] bg-field px-2 font-mono text-[10.5px]"
				aria-label="式タイプ"
				items={expressionTypeItems}
				value={expressionType}
				onValueChange={resetExpressionType}
			/>
		{/if}
		<Button
			class="ml-auto grid size-[26px] shrink-0 place-items-center rounded-[5px] text-ink-3 hover:bg-field hover:text-ink-1 focus-visible:outline-none"
			aria-label="閉じる"
			onclick={() => onClose?.()}
		>
			<X size={14} weight="regular" aria-hidden="true" />
		</Button>
	</div>

	<div class="min-w-0 flex-1 overflow-y-auto px-3 pt-2.5 pb-3">
		{#if isFilter && filterBuilderSupported}
			<FilterQueryBuilder
				value={value as FilterSpecification | undefined}
				onChange={handleFilterChange}
			/>
			<PropertyErrorMessage group="filter" />
		{:else if isFilter}
			<div class="rounded-[6px] bg-field p-2">
				<div class="flex items-start gap-1.5 text-ink-2">
					<WarningCircle size={14} weight="regular" class="mt-0.5 shrink-0" aria-hidden="true" />
					<p>この filter はルールビルダーで安全に表現できないため、読み取り専用です。</p>
				</div>
				<pre class="mt-2 overflow-auto font-mono text-[10px] leading-4 text-ink-2">{JSON.stringify(
						value,
						null,
						2
					)}</pre>
			</div>
		{:else if expression && builderSupported}
			<div class="min-w-0 overflow-hidden">
				<ExpressionInputField
					class="w-full text-[11px]"
					value={expression}
					{propertySpec}
					{zoomRange}
					onChange={handleExpressionChange}
				/>
			</div>
			<PropertyErrorMessage group={target.group} property={target.key} />
		{:else if expression}
			<div class="rounded-[6px] bg-field p-2">
				<div class="flex items-start gap-1.5 text-ink-2">
					<WarningCircle size={14} weight="regular" class="mt-0.5 shrink-0" aria-hidden="true" />
					<p>この式はビルダーで安全に表現できないため、読み取り専用です。</p>
				</div>
				<pre class="mt-2 overflow-auto font-mono text-[10px] leading-4 text-ink-2">{JSON.stringify(
						expression,
						null,
						2
					)}</pre>
			</div>
		{/if}
	</div>
	<div
		class="flex shrink-0 items-center justify-between gap-2 border-t border-hairline-soft px-3 py-[9px] text-[10px] text-ink-3"
	>
		<span>ビルダー外の式は読み取り専用</span>
		<Button class="font-semibold text-accent hover:underline" onclick={() => onRequestJson?.()}>
			JSON で編集
		</Button>
	</div>
</div>
