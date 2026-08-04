<script lang="ts">
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { ExpressionArgInputField } from '#lib/components/common/FilterInputField/expressions/common/ExpressionArgInputField';
	import { ExpressionOperatorSelect } from '#lib/components/common/FilterInputField/expressions/common/ExpressionOperatorSelect';
	import { useExpressionSuggestions } from '#lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		class: className,
		children,
		value,
		onChange,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		children?: Snippet;
		value: [
			'get',
			string | ExpressionSpecification,
			(Record<string, unknown> | ExpressionSpecification)?
		];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const items = $derived(value[2]);
	const getSuggestions = useExpressionSuggestions();
	const suggestions = $derived(getSuggestions());
	const propertyKey = $derived(typeof value[1] === 'string' ? value[1] : undefined);
	const propertySuggestion = $derived(
		propertyKey
			? suggestions?.propertyKeys.find((suggestion) => suggestion.name === propertyKey)
			: undefined
	);
	const sampledValues = $derived(
		propertyKey ? (suggestions?.getValueSuggestions(propertyKey).slice(0, 4) ?? []) : []
	);
	const sourceLabel = $derived.by(() => {
		switch (propertySuggestion?.origin) {
			case 'both':
				return 'TileJSON + 読込済みタイル';
			case 'tilejson':
				return 'TileJSON';
			case 'features':
				return '読込済みタイル';
			default:
				return undefined;
		}
	});
</script>

<div {...props} class={cn('flex min-w-0 flex-col gap-1 rounded bg-field px-2 py-2', className)}>
	<div class="flex min-w-0 flex-row flex-wrap items-center gap-x-2 gap-y-1">
		<ExpressionOperatorSelect value={expression} {onChange} />
		<ExpressionArgInputField
			parentValue={expression}
			index={1}
			{onChange}
			suggestion="propertyKey"
		/>
		<div class="text-[10px] font-semibold tracking-wide text-ink-3">取得元</div>
		{#if items !== undefined}
			<ExpressionArgInputField parentValue={expression} index={2} {onChange} />
		{:else}
			<div class="text-[10px] font-semibold tracking-wide text-ink-3">現在のフィーチャー</div>
		{/if}
	</div>
	{#if propertyKey && propertySuggestion}
		<div class="flex min-w-0 flex-wrap items-center gap-1 border-t border-hairline-soft pt-1.5">
			{#if sourceLabel}
				<span class="text-[10px] font-semibold tracking-wide text-ink-3">
					{sourceLabel}
				</span>
			{/if}
			{#if propertySuggestion.type}
				<span class="rounded bg-field px-1 py-0.5 font-mono text-[10px] text-ink-2">
					{propertySuggestion.type}
				</span>
			{/if}
			{#if sampledValues.length > 0}
				<span class="ml-1 text-[10px] text-ink-3">サンプル</span>
				{#each sampledValues as sample (`${typeof sample}:${String(sample)}`)}
					<code
						class="max-w-24 truncate rounded bg-white px-1 py-0.5 text-[10px] text-ink-2"
						title={String(sample)}>{String(sample)}</code
					>
				{/each}
			{/if}
		</div>
	{:else if !propertyKey && suggestions && suggestions.propertyKeys.length > 0}
		<div class="border-t border-hairline-soft pt-1.5 text-[10px] text-ink-3">
			ソースフィールド {suggestions.propertyKeys.length} 件を利用できます
		</div>
	{/if}
	{@render children?.()}
</div>
