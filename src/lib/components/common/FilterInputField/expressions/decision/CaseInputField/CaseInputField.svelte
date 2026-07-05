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
	import { removeArgsAt } from '$lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

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
			'case',
			boolean | ExpressionSpecification,
			ExpressionInputType | ExpressionSpecification | null,
			...(ExpressionInputType | ExpressionSpecification | null)[],
			ExpressionInputType | ExpressionSpecification | null
		];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const pairCount = $derived(Math.floor((value.length - 2) / 2));
	const fallbackIndex = $derived(value.length - 1);
</script>

<div
	{...props}
	class={cn(
		'flex flex-row flex-wrap items-center gap-2 rounded bg-black/5 px-0.5 py-0.5',
		className
	)}
>
	<ExpressionOperatorSelect value={expression} {onChange} label="CASE" />
	{#each Array.from({ length: pairCount }, (_, pair) => pair) as pair (pair)}
		<ExpressionArgInputField
			parentValue={expression}
			index={1 + pair * 2}
			{onChange}
			onRemove={onChange && pairCount > 1
				? () => onChange(removeArgsAt(expression, 1 + pair * 2, 2))
				: undefined}
		/>
		<div class="flex flex-row px-0.5 py-0.5">WHEN</div>
		<ExpressionArgInputField parentValue={expression} index={1 + pair * 2 + 1} {onChange} />
	{/each}
	<ExpressionAppendArgButton value={expression} {onChange} />
	<div class="flex flex-row px-0.5 py-0.5">ELSE</div>
	<ExpressionArgInputField parentValue={expression} index={fallbackIndex} {onChange} />
	{@render children?.()}
</div>
