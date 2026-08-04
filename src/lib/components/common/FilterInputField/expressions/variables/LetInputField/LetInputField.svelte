<script lang="ts">
	import type {
		ExpressionInputType,
		ExpressionSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { Button } from '#lib/components/common/Button';
	import { ExpressionAppendArgButton } from '#lib/components/common/FilterInputField/expressions/common/ExpressionAppendArgButton';
	import { ExpressionArgInputField } from '#lib/components/common/FilterInputField/expressions/common/ExpressionArgInputField';
	import { ExpressionInputTypeInputField } from '#lib/components/common/FilterInputField/expressions/common/ExpressionInputTypeInputField';
	import { ExpressionOperatorSelect } from '#lib/components/common/FilterInputField/expressions/common/ExpressionOperatorSelect';
	import {
		removeArgsOrCollapse,
		replaceArgAt
	} from '#lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
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
			'let',
			string,
			ExpressionInputType | ExpressionSpecification,
			...(string | ExpressionInputType | ExpressionSpecification)[]
		];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as unknown as ExpressionSpecification);
	// ['let', name1, value1, ..., nameN, valueN, resultExpression]
	const bindingCount = $derived(Math.max(0, Math.floor((value.length - 2) / 2)));
	const resultIndex = $derived(value.length - 1);
</script>

<div
	{...props}
	class={cn(
		'flex min-w-0 flex-row flex-wrap items-center gap-x-2 gap-y-1 rounded bg-field px-2 py-2',
		className
	)}
>
	<ExpressionOperatorSelect value={expression} {onChange} />
	{#each Array.from({ length: bindingCount }, (_, i) => 1 + i * 2) as nameIndex (nameIndex)}
		<ExpressionInputTypeInputField
			value={value[nameIndex]}
			onChange={onChange ? (v) => onChange(replaceArgAt(expression, nameIndex, v)) : undefined}
		/>
		<div class="text-[10px] font-semibold tracking-wide text-ink-3">=</div>
		<ExpressionArgInputField parentValue={expression} index={nameIndex + 1} {onChange} />
		{#if onChange}
			<Button
				aria-label="変数割り当てを削除"
				title="変数割り当てを削除"
				class="rounded px-1 py-0.5 text-xs text-ink-3 transition-colors hover:text-ink-2"
				onclick={() =>
					onChange(removeArgsOrCollapse(expression, nameIndex, 2, expression[resultIndex]))}
			>
				×
			</Button>
		{/if}
	{/each}
	<ExpressionAppendArgButton value={expression} {onChange} />
	<ExpressionArgInputField parentValue={expression} index={resultIndex} {onChange} />
	{@render children?.()}
</div>
