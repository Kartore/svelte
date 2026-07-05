<script lang="ts">
	import type {
		CollatorExpressionSpecification,
		ExpressionInputType,
		ExpressionSpecification,
		VariableExpressionSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { ExpressionArgInputField } from '$lib/components/common/FilterInputField/expressions/common/ExpressionArgInputField';
	import { ExpressionOperatorSelect } from '$lib/components/common/FilterInputField/expressions/common/ExpressionOperatorSelect';
	import { getGetExpressionKey } from '$lib/components/common/FilterInputField/expressions/utils/getGetExpressionKey.ts';
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
			'==',
			ExpressionInputType | ExpressionSpecification | null,
			ExpressionInputType | ExpressionSpecification | null,
			(CollatorExpressionSpecification | VariableExpressionSpecification)?
		];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const collator = $derived(value[3]);
	const leftKey = $derived(getGetExpressionKey(value[1]));
	const rightKey = $derived(getGetExpressionKey(value[2]));
</script>

<div
	{...props}
	class={cn('flex flex-row items-center gap-2 rounded bg-black/5 px-0.5 py-0.5', className)}
>
	<ExpressionArgInputField
		parentValue={expression}
		index={1}
		{onChange}
		suggestion={rightKey ? { kind: 'propertyValue', key: rightKey } : undefined}
	/>
	<ExpressionOperatorSelect value={expression} {onChange} />
	<ExpressionArgInputField
		parentValue={expression}
		index={2}
		{onChange}
		suggestion={leftKey ? { kind: 'propertyValue', key: leftKey } : undefined}
	/>
	{#if collator}
		<ExpressionArgInputField parentValue={expression} index={3} {onChange} />
	{/if}
	{@render children?.()}
</div>
