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
		value: ['all', ...(boolean | ExpressionSpecification)[]];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const argCount = $derived(value.length - 1);
</script>

<div {...props} class={cn('flex min-w-0 flex-col gap-2 rounded bg-black/5 px-2 py-2', className)}>
	<div class="flex min-w-0 items-center gap-2">
		<div class="flex min-w-0 items-center gap-1">
			<span class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">logic</span>
			<ExpressionOperatorSelect value={expression} {onChange} />
		</div>
		<span class="font-mono text-xs text-gray-400">
			{argCount}
			{argCount === 1 ? 'condition' : 'conditions'}
		</span>
	</div>

	<div class="flex min-w-0 flex-col gap-1 border-l border-gray-200 pl-2">
		{#each Array.from({ length: argCount }, (_, i) => i + 1) as index (index)}
			<ExpressionArgInputField
				class="min-w-0 items-start justify-between rounded px-0.5 py-1 hover:bg-white/60 [&>:first-child]:min-w-0 [&>:first-child]:flex-1"
				parentValue={expression}
				{index}
				{onChange}
				onRemove={onChange ? () => onChange(removeArgsAt(expression, index, 1)) : undefined}
			/>
		{/each}
	</div>

	<div class="flex items-center justify-end border-t border-gray-200 pt-1">
		<ExpressionAppendArgButton
			value={expression}
			{onChange}
			label="+ Add condition"
			ariaLabel="Add logical condition"
			class="px-2 py-1 text-gray-500"
		/>
	</div>
	{@render children?.()}
</div>
