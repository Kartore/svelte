<script lang="ts">
	import type {
		CollatorExpressionSpecification,
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
			'>=',
			string | number | ExpressionSpecification,
			string | number | ExpressionSpecification,
			(CollatorExpressionSpecification | VariableExpressionSpecification)?
		];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const collator = $derived(value[3]);
	const leftKey = $derived(getGetExpressionKey(value[1]));
	const rightKey = $derived(getGetExpressionKey(value[2]));
</script>

<div {...props} class={cn('flex min-w-0 flex-col gap-1 rounded bg-black/5 px-2 py-2', className)}>
	<div
		class="grid grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] gap-1 px-0.5 font-mono text-[10px] text-gray-400"
	>
		<span>subject</span>
		<span class="text-center">operator</span>
		<span>value</span>
	</div>
	<div
		class="grid min-w-0 grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] items-start gap-1 rounded px-0.5 py-1 hover:bg-white/60"
	>
		<ExpressionArgInputField
			class="min-w-0 [&>:first-child]:w-full"
			parentValue={expression}
			index={1}
			{onChange}
			suggestion={rightKey ? { kind: 'propertyValue', key: rightKey } : undefined}
		/>
		<ExpressionOperatorSelect class="min-w-0 justify-self-center" value={expression} {onChange} />
		<ExpressionArgInputField
			class="min-w-0 [&>:first-child]:w-full"
			parentValue={expression}
			index={2}
			{onChange}
			suggestion={leftKey ? { kind: 'propertyValue', key: leftKey } : undefined}
		/>
	</div>
	{#if collator}
		<div class="flex min-w-0 items-start gap-2 border-t border-gray-200 px-0.5 pt-1">
			<span class="pt-1 text-[10px] font-semibold tracking-wide text-gray-400 uppercase"
				>collator</span
			>
			<ExpressionArgInputField
				class="min-w-0 flex-1"
				parentValue={expression}
				index={3}
				{onChange}
			/>
		</div>
	{/if}
	{@render children?.()}
</div>
