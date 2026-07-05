<script lang="ts">
	import type {
		ExpressionInputType,
		ExpressionSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { Button } from '$lib/components/common/Button';
	import { ExpressionAppendArgButton } from '$lib/components/common/FilterInputField/expressions/common/ExpressionAppendArgButton';
	import { ExpressionArgInputField } from '$lib/components/common/FilterInputField/expressions/common/ExpressionArgInputField';
	import { ExpressionInputTypeInputField } from '$lib/components/common/FilterInputField/expressions/common/ExpressionInputTypeInputField';
	import { ExpressionOperatorSelect } from '$lib/components/common/FilterInputField/expressions/common/ExpressionOperatorSelect';
	import {
		removeArgsAt,
		replaceArgAt
	} from '$lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
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
		'flex flex-row flex-wrap items-center gap-2 rounded bg-black/5 px-0.5 py-0.5',
		className
	)}
>
	<ExpressionOperatorSelect value={expression} {onChange} />
	{#each Array.from({ length: bindingCount }, (_, i) => 1 + i * 2) as nameIndex (nameIndex)}
		<ExpressionInputTypeInputField
			value={value[nameIndex]}
			onChange={onChange ? (v) => onChange(replaceArgAt(expression, nameIndex, v)) : undefined}
		/>
		<div class="flex flex-row px-0.5 py-0.5">=</div>
		<ExpressionArgInputField parentValue={expression} index={nameIndex + 1} {onChange} />
		{#if onChange && bindingCount > 1}
			<Button
				aria-label="Remove binding"
				title="Remove binding"
				class="rounded px-1 py-0.5 text-xs text-gray-400 transition-colors hover:text-red-500"
				onclick={() => onChange(removeArgsAt(expression, nameIndex, 2))}
			>
				×
			</Button>
		{/if}
	{/each}
	<ExpressionAppendArgButton value={expression} {onChange} />
	<ExpressionArgInputField parentValue={expression} index={resultIndex} {onChange} />
	{@render children?.()}
</div>
