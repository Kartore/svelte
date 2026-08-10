<script lang="ts">
	import type {
		ExpressionInputType,
		ExpressionSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { X } from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import { ExpressionAppendArgButton } from '#lib/components/common/FilterInputField/expressions/common/ExpressionAppendArgButton';
	import { ExpressionArgInputField } from '#lib/components/common/FilterInputField/expressions/common/ExpressionArgInputField';
	import { ExpressionOperatorSelect } from '#lib/components/common/FilterInputField/expressions/common/ExpressionOperatorSelect';
	import { removeArgsOrCollapse } from '#lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
	import { isCompactExpression } from '#lib/components/common/FilterInputField/expressions/utils/isCompactExpression.ts';
	import { isExpression } from '#lib/components/common/FilterInputField/expressions/utils/isExpression.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		class: className,
		children,
		value,
		depth = 0,
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
		depth?: number;
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const pairCount = $derived(Math.floor((value.length - 2) / 2));
	const fallbackIndex = $derived(value.length - 1);
	const usesFieldSurface = $derived(depth % 2 === 0);
	const isCompoundOutput = (output: unknown) =>
		isExpression(output) && !isCompactExpression(output);
	const removePair = (conditionIndex: number) => {
		onChange?.(removeArgsOrCollapse(expression, conditionIndex, 2, expression[fallbackIndex]));
	};
</script>

<div
	{...props}
	class={cn(
		'flex min-w-0 flex-col gap-2 rounded px-2 py-2',
		usesFieldSurface ? 'bg-field' : 'border border-hairline-soft bg-white',
		className
	)}
	style:--expression-surface-background={usesFieldSurface ? 'var(--color-field)' : '#fff'}
	style:--expression-control-background={usesFieldSurface ? '#fff' : 'var(--color-field)'}
>
	<div class="flex min-w-0 items-center gap-1">
		<span class="text-[10px] font-semibold tracking-wide text-ink-3">演算子</span>
		<ExpressionOperatorSelect value={expression} {onChange} label="case" />
	</div>

	<div class="flex min-w-0 flex-col gap-1">
		<div
			class="grid grid-cols-[minmax(0,2fr)_16px_minmax(0,1fr)] gap-1 border-b border-hairline-soft px-0.5 pb-1 font-mono text-[10px] text-ink-3"
		>
			<span>条件</span>
			<span aria-hidden="true"></span>
			<span>出力</span>
		</div>

		{#each Array.from({ length: pairCount }, (_, pair) => pair) as pair (pair)}
			{@const conditionIndex = 1 + pair * 2}
			{@const outputIndex = conditionIndex + 1}
			{#if isCompoundOutput(value[outputIndex])}
				<div class="flex min-w-0 flex-col rounded px-0.5 py-1 hover:bg-black/5">
					<div class="flex min-w-0 items-start gap-1 pb-1">
						<ExpressionArgInputField
							class="min-w-0 flex-1"
							parentValue={expression}
							index={conditionIndex}
							{onChange}
						/>
						<span class="pt-1 text-center font-mono text-xs text-ink-4" aria-hidden="true">→</span>
						{#if onChange}
							<Button
								aria-label="条件ケースを削除"
								title="条件ケースを削除"
								class="ml-auto flex size-6 shrink-0 items-center justify-center rounded-[6px] text-ink-3 hover:bg-black/5 hover:text-ink-1"
								onclick={() => removePair(conditionIndex)}
							>
								<X size={14} weight="regular" aria-hidden="true" />
							</Button>
						{/if}
					</div>
					<div class="ml-1 min-w-0 border-l-2 border-hairline-soft pl-2">
						<ExpressionArgInputField
							class="w-full min-w-0"
							parentValue={expression}
							index={outputIndex}
							{onChange}
						/>
					</div>
				</div>
			{:else}
				<div
					class="grid min-w-0 grid-cols-[minmax(0,2fr)_16px_minmax(0,1fr)] items-start gap-1 rounded px-0.5 py-1 hover:bg-black/5"
				>
					<ExpressionArgInputField
						class="min-w-0"
						parentValue={expression}
						index={conditionIndex}
						{onChange}
					/>
					<span class="pt-1 text-center font-mono text-xs text-ink-4" aria-hidden="true">→</span>
					<ExpressionArgInputField
						class="min-w-0 justify-between"
						parentValue={expression}
						index={outputIndex}
						{onChange}
						onRemove={onChange ? () => removePair(conditionIndex) : undefined}
						removeLabel="条件ケースを削除"
					/>
				</div>
			{/if}
		{/each}

		{#if isCompoundOutput(value[fallbackIndex])}
			<div class="flex min-w-0 flex-col rounded px-0.5 py-1 hover:bg-black/5">
				<div class="flex min-w-0 items-start gap-1 pb-1">
					<span class="pt-1 font-mono text-xs text-ink-3">フォールバック</span>
					<span class="pt-1 text-center font-mono text-xs text-ink-4" aria-hidden="true">→</span>
				</div>
				<div class="ml-1 min-w-0 border-l-2 border-hairline-soft pl-2">
					<ExpressionArgInputField
						class="w-full min-w-0"
						parentValue={expression}
						index={fallbackIndex}
						{onChange}
					/>
				</div>
			</div>
		{:else}
			<div
				class="grid min-w-0 grid-cols-[minmax(0,2fr)_16px_minmax(0,1fr)] items-start gap-1 rounded px-0.5 py-1 hover:bg-black/5"
			>
				<span class="pt-1 font-mono text-xs text-ink-3">フォールバック</span>
				<span class="pt-1 text-center font-mono text-xs text-ink-4" aria-hidden="true">→</span>
				<ExpressionArgInputField
					class="min-w-0"
					parentValue={expression}
					index={fallbackIndex}
					{onChange}
				/>
			</div>
		{/if}
	</div>

	<div class="flex items-center justify-end border-t border-hairline-soft pt-1">
		<ExpressionAppendArgButton
			value={expression}
			{onChange}
			label="＋ ケースを追加"
			ariaLabel="条件ケースを追加"
			class="px-2 py-1 text-ink-3"
		/>
	</div>
	{@render children?.()}
</div>
