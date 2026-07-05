<script lang="ts">
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { ExpressionInputField } from '$lib/components/common/FilterInputField/expressions';
	import { ExpressionOperatorSelect } from '$lib/components/common/FilterInputField/expressions/common/ExpressionOperatorSelect';
	import { isExpression } from '$lib/components/common/FilterInputField/expressions/utils/isExpression.ts';
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
		value: ['distance', unknown] | ['distance', Record<string, unknown> | ExpressionSpecification];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as unknown as ExpressionSpecification);
	const object = $derived(value[1]);
</script>

<div
	{...props}
	class={cn(
		'flex flex-row flex-wrap items-center gap-2 rounded bg-black/5 px-0.5 py-0.5',
		className
	)}
>
	<ExpressionOperatorSelect value={expression} {onChange} />
	{#if isExpression(object)}
		<ExpressionInputField value={object} {onChange} />
	{:else}
		<div class="flex flex-row px-0.5 py-0.5">{JSON.stringify(object)}</div>
	{/if}
	{@render children?.()}
</div>
