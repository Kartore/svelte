<script lang="ts" module>
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type CurveStopsEditorProps = Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		children?: Snippet;
		value: ExpressionSpecification;
		onChange?: (value: ExpressionSpecification) => void;
	};
</script>

<script lang="ts">
	import type { InterpolationSpecification } from '@maplibre/maplibre-gl-style-spec';

	import { ExpressionAppendArgButton } from '$lib/components/common/FilterInputField/expressions/common/ExpressionAppendArgButton';
	import { ExpressionArgInputField } from '$lib/components/common/FilterInputField/expressions/common/ExpressionArgInputField';
	import { ExpressionOperatorSelect } from '$lib/components/common/FilterInputField/expressions/common/ExpressionOperatorSelect';
	import { CurveStopsCanvas } from '$lib/components/common/FilterInputField/expressions/curves/common/CurveStopsCanvas';
	import InterpolationsInputField from '$lib/components/common/FilterInputField/expressions/curves/interpolations/InterpolationsInputField.svelte';
	import { curveHasColorOutputs } from '$lib/components/common/FilterInputField/expressions/utils/curveSampling.ts';
	import {
		removeArgsOrCollapse,
		replaceArgAt
	} from '$lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		children,
		value: expression,
		onChange,
		...props
	}: CurveStopsEditorProps = $props();

	let selectedStopIndex = $state<number | null>(null);

	const isStep = $derived(expression[0] === 'step');
	const inputIndex = $derived(isStep ? 1 : 2);
	const inputExpression = $derived(expression[inputIndex]);
	const inputLabel = $derived(
		Array.isArray(inputExpression) && inputExpression[0] === 'zoom' ? 'zoom' : 'input'
	);
	const interpolation = $derived(
		isStep ? undefined : (expression[1] as InterpolationSpecification)
	);
	const stopStartIndexes = $derived.by(() => {
		const indexes: number[] = [];
		for (let index = 3; index < expression.length; index += 2) {
			indexes.push(index);
		}
		return indexes;
	});
	const outputLiteralType = $derived(
		expression[0] === 'interpolate-hcl' ||
			expression[0] === 'interpolate-lab' ||
			curveHasColorOutputs(expression)
			? ('color' as const)
			: undefined
	);
	const removeStop = (stopStartIndex: number, stopIndex: number) => {
		if (!onChange) return;
		if (selectedStopIndex === stopIndex) selectedStopIndex = null;
		else if (selectedStopIndex !== null && selectedStopIndex > stopIndex) selectedStopIndex -= 1;
		onChange(
			removeArgsOrCollapse(
				expression,
				stopStartIndex,
				2,
				isStep ? expression[2] : expression[stopStartIndex + 1],
				isStep ? 4 : undefined
			)
		);
	};
</script>

<div {...props} class={cn('flex min-w-0 flex-col gap-2 rounded bg-black/5 px-2 py-2', className)}>
	<div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
		<div class="flex items-center gap-1">
			<span class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">curve</span>
			<ExpressionOperatorSelect value={expression} {onChange} />
		</div>
		{#if interpolation}
			<div class="flex min-w-0 items-center gap-1">
				<span class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">mode</span>
				<InterpolationsInputField
					value={interpolation}
					onChange={onChange ? (next) => onChange(replaceArgAt(expression, 1, next)) : undefined}
				/>
			</div>
		{/if}
		<div class="flex min-w-0 flex-1 items-center justify-end gap-1">
			<span class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">input</span>
			<ExpressionArgInputField
				class="min-w-0"
				parentValue={expression}
				index={inputIndex}
				{onChange}
			/>
		</div>
	</div>

	<CurveStopsCanvas
		value={expression}
		{onChange}
		{selectedStopIndex}
		onSelectStop={(index) => (selectedStopIndex = index)}
	/>

	<div class="flex min-w-0 flex-col gap-1">
		<div
			class="grid grid-cols-[56px_minmax(0,1fr)_24px] gap-1 border-b border-gray-200 px-0.5 pb-1 font-mono text-[10px] text-gray-400"
		>
			<span>{inputLabel}</span>
			<span>value</span>
			<span aria-hidden="true"></span>
		</div>

		{#if isStep}
			<div
				class="grid min-w-0 grid-cols-[56px_minmax(0,1fr)_24px] items-start gap-1 rounded px-0.5 py-1 hover:bg-white/60"
			>
				<span class="pt-1 font-mono text-xs text-gray-400">default</span>
				<ExpressionArgInputField
					class="col-span-2 min-w-0 justify-between"
					parentValue={expression}
					index={2}
					{onChange}
					literalType={outputLiteralType}
				/>
			</div>
		{/if}

		{#each stopStartIndexes as stopStartIndex, stopIndex (stopStartIndex)}
			<div
				class={cn(
					'grid min-w-0 grid-cols-[56px_minmax(0,1fr)_24px] items-start gap-1 rounded px-0.5 py-1 hover:bg-white/60',
					selectedStopIndex === stopIndex && 'bg-blue-50 ring-1 ring-blue-200'
				)}
				data-selected={selectedStopIndex === stopIndex ? 'true' : undefined}
			>
				<ExpressionArgInputField
					class="min-w-0 [&>input]:max-w-full"
					parentValue={expression}
					index={stopStartIndex}
					{onChange}
				/>
				{#if stopStartIndex + 1 < expression.length}
					<ExpressionArgInputField
						class="col-span-2 min-w-0 justify-between"
						parentValue={expression}
						index={stopStartIndex + 1}
						{onChange}
						literalType={outputLiteralType}
						onRemove={onChange ? () => removeStop(stopStartIndex, stopIndex) : undefined}
						removeLabel="Remove stop"
					/>
				{/if}
			</div>
		{/each}
	</div>

	<div class="flex items-center justify-end border-t border-gray-200 pt-1">
		<ExpressionAppendArgButton
			value={expression}
			{onChange}
			label="+ Add stop"
			ariaLabel="Add stop"
			class="px-2 py-1 text-gray-500"
		/>
	</div>
	{@render children?.()}
</div>
