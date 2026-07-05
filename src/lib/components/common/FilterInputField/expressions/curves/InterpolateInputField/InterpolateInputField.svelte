<script lang="ts">
	import type {
		ColorSpecification,
		ExpressionSpecification,
		InterpolationSpecification,
		ProjectionDefinitionSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { CurvePreview } from '$lib/components/common/FilterInputField/expressions/common/CurvePreview';
	import { ExpressionAppendArgButton } from '$lib/components/common/FilterInputField/expressions/common/ExpressionAppendArgButton';
	import { ExpressionArgInputField } from '$lib/components/common/FilterInputField/expressions/common/ExpressionArgInputField';
	import { ExpressionOperatorSelect } from '$lib/components/common/FilterInputField/expressions/common/ExpressionOperatorSelect';
	import InterpolationsInputField from '$lib/components/common/FilterInputField/expressions/curves/interpolations/InterpolationsInputField.svelte';
	import { curveHasColorOutputs } from '$lib/components/common/FilterInputField/expressions/utils/curveSampling.ts';
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
			'interpolate',
			InterpolationSpecification,
			number | ExpressionSpecification,
			...(
				| number
				| number[]
				| ColorSpecification
				| ProjectionDefinitionSpecification
				| ExpressionSpecification
			)[]
		];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const interpolation = $derived(value[1]);
	const stopStartIndexes = $derived.by(() => {
		const indexes: number[] = [];
		for (let index = 3; index < value.length; index += 2) {
			indexes.push(index);
		}
		return indexes;
	});
	const canRemoveStop = $derived(stopStartIndexes.length > 1);
	const outputLiteralType = $derived(
		curveHasColorOutputs(expression) ? ('color' as const) : undefined
	);
</script>

<div
	{...props}
	class={cn(
		'flex flex-row flex-wrap items-center gap-2 rounded bg-black/5 px-0.5 py-0.5',
		className
	)}
>
	<CurvePreview value={expression} />
	<ExpressionOperatorSelect value={expression} {onChange} />
	<InterpolationsInputField
		value={interpolation}
		onChange={onChange
			? (newInterpolation) => onChange(replaceArgAt(expression, 1, newInterpolation))
			: undefined}
	/>
	<ExpressionArgInputField parentValue={expression} index={2} {onChange} />
	{#each stopStartIndexes as stopStartIndex (stopStartIndex)}
		<div class="flex flex-row px-0.5 py-0.5">at</div>
		<ExpressionArgInputField parentValue={expression} index={stopStartIndex} {onChange} />
		{#if stopStartIndex + 1 < value.length}
			<ExpressionArgInputField
				parentValue={expression}
				index={stopStartIndex + 1}
				{onChange}
				literalType={outputLiteralType}
				onRemove={onChange && canRemoveStop
					? () => onChange(removeArgsAt(expression, stopStartIndex, 2))
					: undefined}
			/>
		{/if}
	{/each}
	<ExpressionAppendArgButton value={expression} {onChange} />
	{@render children?.()}
</div>
