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
		value,
		onChange,
		typeSelect,
		children,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		children?: Snippet;
		value: ['exponential', number | ExpressionSpecification];
		onChange?: (value: InterpolationSpecification) => void;
		/** rendered in place of the static interpolation-type token */
		typeSelect?: Snippet;
	} = $props();

	const num = $derived(value[1]);
	const handleBaseChange = $derived(
		onChange
			? (next: unknown) => onChange(['exponential', next] as InterpolationSpecification)
			: undefined
	);
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
		<div class="flex flex-row px-0.5 py-0.5">exp</div>
	{/if}
	<div class="flex flex-row px-0.5 py-0.5">(</div>
	{#if isExpression(num)}
		<ExpressionInputField value={num} onChange={handleBaseChange} />
	{:else}
		<ExpressionInputTypeInputField value={num} onChange={handleBaseChange} />
	{/if}
	<div class="flex flex-row px-0.5 py-0.5">)</div>
	{@render children?.()}
</div>
