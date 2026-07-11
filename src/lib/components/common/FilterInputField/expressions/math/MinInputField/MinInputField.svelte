<script lang="ts">
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
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
		value: ['min', number | ExpressionSpecification, ...(number | ExpressionSpecification)[]];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const argCount = $derived(value.length - 1);
	const canRemove = $derived(argCount > 2);
</script>

<div
	{...props}
	class={cn(
		'flex min-w-0 flex-row flex-wrap items-center gap-1 rounded bg-black/5 px-2 py-2',
		className
	)}
>
	<ExpressionOperatorSelect value={expression} {onChange} />
	<div class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">(</div>
	{#each Array.from({ length: argCount }, (_, i) => i + 1) as index (index)}
		<ExpressionArgInputField
			parentValue={expression}
			{index}
			{onChange}
			onRemove={canRemove && onChange
				? () => onChange?.(removeArgsAt(expression, index, 1))
				: undefined}
		/>
		{#if index < argCount}
			<div class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">,</div>
		{/if}
	{/each}
	<ExpressionAppendArgButton value={expression} {onChange} />
	<div class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">)</div>
	{@render children?.()}
</div>
