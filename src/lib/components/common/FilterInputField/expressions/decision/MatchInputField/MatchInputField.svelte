<script lang="ts">
	import type {
		ExpressionInputType,
		ExpressionSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { ExpressionAppendArgButton } from '$lib/components/common/FilterInputField/expressions/common/ExpressionAppendArgButton';
	import { ExpressionArgInputField } from '$lib/components/common/FilterInputField/expressions/common/ExpressionArgInputField';
	import { ExpressionOperatorSelect } from '$lib/components/common/FilterInputField/expressions/common/ExpressionOperatorSelect';
	import { useExpressionSuggestions } from '$lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';
	import { removeArgsAt } from '$lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
	import { getGetExpressionKey } from '$lib/components/common/FilterInputField/expressions/utils/getGetExpressionKey.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	import MatchLabelInputField from './MatchLabelInputField.svelte';

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
			'match',
			string | number | ExpressionSpecification,
			string | number | string[] | number[],
			ExpressionInputType | ExpressionSpecification | null,
			...(
				string | number | string[] | number[] | ExpressionInputType | ExpressionSpecification | null
			)[],
			// repeated as above
			ExpressionInputType | ExpressionSpecification | null
		];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const pairCount = $derived(Math.floor((value.length - 3) / 2));
	const fallbackIndex = $derived(value.length - 1);
	const getSuggestions = useExpressionSuggestions();
	const suggestionsContext = $derived(getSuggestions());
	const inputKey = $derived(getGetExpressionKey(value[1]));
	const labelSuggestions = $derived(
		inputKey && suggestionsContext ? suggestionsContext.getValueSuggestions(inputKey) : undefined
	);
</script>

<div
	{...props}
	class={cn(
		'flex flex-row flex-wrap items-center gap-2 rounded bg-black/5 px-0.5 py-0.5',
		className
	)}
>
	<ExpressionOperatorSelect value={expression} {onChange} label="switch" />
	<ExpressionArgInputField parentValue={expression} index={1} {onChange} />
	{#each Array.from({ length: pairCount }, (_, pair) => pair) as pair (pair)}
		<div class="flex flex-row px-0.5 py-0.5">CASE</div>
		<MatchLabelInputField
			{expression}
			label={value[2 + pair * 2] as ExpressionInputType | ExpressionInputType[]}
			labelIndex={2 + pair * 2}
			{onChange}
			suggestions={labelSuggestions}
		/>
		<div class="flex flex-row px-0.5 py-0.5">:</div>
		<ExpressionArgInputField
			parentValue={expression}
			index={2 + pair * 2 + 1}
			{onChange}
			onRemove={onChange && pairCount > 1
				? () => onChange(removeArgsAt(expression, 2 + pair * 2, 2))
				: undefined}
		/>
	{/each}
	<ExpressionAppendArgButton value={expression} {onChange} />
	<div class="flex flex-row px-0.5 py-0.5">DEFAULT</div>
	<ExpressionArgInputField parentValue={expression} index={fallbackIndex} {onChange} />
	{@render children?.()}
</div>
