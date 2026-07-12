<script lang="ts">
	import type {
		ExpressionSpecification,
		InterpolationSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { ExpressionInputField } from '$lib/components/common/FilterInputField/expressions';
	import { ExpressionInputTypeInputField } from '$lib/components/common/FilterInputField/expressions/common/ExpressionInputTypeInputField';
	import { isExpression } from '$lib/components/common/FilterInputField/expressions/utils/isExpression.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		children,
		value,
		onChange,
		typeSelect,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		children?: Snippet;
		value: [
			'cubic-bezier',
			number | ExpressionSpecification,
			number | ExpressionSpecification,
			number | ExpressionSpecification,
			number | ExpressionSpecification
		];
		onChange?: (value: InterpolationSpecification) => void;
		/** rendered in place of the static interpolation-type token */
		typeSelect?: Snippet;
	} = $props();

	const controlValues = $derived([value[1], value[2], value[3], value[4]]);
	const handleControlValueChange = (index: number) =>
		onChange
			? (next: unknown) =>
					onChange(
						value.map((current, i) =>
							i === index ? next : current
						) as unknown as InterpolationSpecification
					)
			: undefined;
</script>

<div
	{...props}
	class={cn(
		'flex flex-row flex-wrap items-center gap-2 rounded bg-black/5 px-0.5 py-0.5',
		className
	)}
>
	{#if typeSelect}
		{@render typeSelect()}
	{:else}
		<div class="flex flex-row px-0.5 py-0.5">cubic-bezier</div>
	{/if}
	<div class="flex flex-row px-0.5 py-0.5">(</div>
	{#each controlValues as controlValue, i (i + 1)}
		{@const index = i + 1}
		{#if isExpression(controlValue)}
			<ExpressionInputField
				class="min-w-0 flex-1"
				value={controlValue}
				onChange={handleControlValueChange(index)}
				nested
			/>
		{:else}
			<ExpressionInputTypeInputField
				value={controlValue}
				onChange={handleControlValueChange(index)}
			/>
		{/if}
		{#if index < 4}
			<div class="flex flex-row px-0.5 py-0.5">,</div>
		{/if}
	{/each}
	<div class="flex flex-row px-0.5 py-0.5">)</div>
	{@render children?.()}
</div>
