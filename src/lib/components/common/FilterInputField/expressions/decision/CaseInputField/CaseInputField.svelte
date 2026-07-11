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
	import { removeArgsOrCollapse } from '$lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
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

<div {...props} class={cn('flex min-w-0 flex-col gap-2 rounded bg-black/5 px-2 py-2', className)}>
	<div class="flex min-w-0 items-center gap-1">
		<span class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">operator</span>
		<ExpressionOperatorSelect value={expression} {onChange} label="case" />
	</div>

	<div class="flex min-w-0 flex-col gap-1">
		<div
			class="grid grid-cols-[minmax(184px,2fr)_16px_minmax(72px,1fr)] gap-1 border-b border-gray-200 px-0.5 pb-1 font-mono text-[10px] text-gray-400"
		>
			<span>condition</span>
			<span aria-hidden="true"></span>
			<span>output</span>
		</div>

		{#each Array.from({ length: pairCount }, (_, pair) => pair) as pair (pair)}
			<div
				class="grid min-w-0 grid-cols-[minmax(184px,2fr)_16px_minmax(72px,1fr)] items-start gap-1 rounded px-0.5 py-1 hover:bg-white/60"
			>
				<ExpressionArgInputField
					class="min-w-0"
					parentValue={expression}
					index={1 + pair * 2}
					{onChange}
				/>
				<span class="pt-1 text-center font-mono text-xs text-gray-300" aria-hidden="true">→</span>
				<ExpressionArgInputField
					class="min-w-0 justify-between"
					parentValue={expression}
					index={1 + pair * 2 + 1}
					{onChange}
					onRemove={onChange
						? () =>
								onChange(
									removeArgsOrCollapse(expression, 1 + pair * 2, 2, expression[fallbackIndex])
								)
						: undefined}
					removeLabel="Remove condition case"
				/>
			</div>
		{/each}

		<div
			class="grid min-w-0 grid-cols-[minmax(184px,2fr)_16px_minmax(72px,1fr)] items-start gap-1 rounded px-0.5 py-1 hover:bg-white/60"
		>
			<span class="pt-1 font-mono text-xs text-gray-400">default</span>
			<span class="pt-1 text-center font-mono text-xs text-gray-300" aria-hidden="true">→</span>
			<ExpressionArgInputField
				class="min-w-0"
				parentValue={expression}
				index={fallbackIndex}
				{onChange}
			/>
		</div>
	</div>

	<div class="flex items-center justify-end border-t border-gray-200 pt-1">
		<ExpressionAppendArgButton
			value={expression}
			{onChange}
			label="+ Add case"
			ariaLabel="Add condition case"
			class="px-2 py-1 text-gray-500"
		/>
	</div>
	{@render children?.()}
</div>
