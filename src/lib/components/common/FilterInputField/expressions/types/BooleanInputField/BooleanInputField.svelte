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
		value: ['boolean', unknown, ...unknown[]];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const argCount = $derived(value.length - 1);
</script>

<div
	{...props}
	class={cn(
		'flex flex-row flex-wrap items-center gap-2 rounded bg-black/5 px-0.5 py-0.5',
		className
	)}
>
	<div class="flex flex-row px-0.5 py-0.5">typecheck</div>
	<ExpressionOperatorSelect value={expression} {onChange} />
	{#each Array.from({ length: argCount }, (_, i) => i + 1) as index (index)}
		<ExpressionArgInputField
			parentValue={expression}
			{index}
			{onChange}
			onRemove={onChange && argCount > 1
				? () => onChange(removeArgsAt(expression, index, 1))
				: undefined}
		/>
		{#if index < value.length - 1}
			<div class="flex flex-row px-0.5 py-0.5">OR</div>
		{/if}
	{/each}
	<ExpressionAppendArgButton value={expression} {onChange} />
	{@render children?.()}
</div>
