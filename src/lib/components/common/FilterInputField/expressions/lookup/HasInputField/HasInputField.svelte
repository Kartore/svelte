<script lang="ts">
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { ExpressionArgInputField } from '$lib/components/common/FilterInputField/expressions/common/ExpressionArgInputField';
	import { ExpressionOperatorSelect } from '$lib/components/common/FilterInputField/expressions/common/ExpressionOperatorSelect';
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
			'has',
			string | ExpressionSpecification,
			(Record<string, unknown> | ExpressionSpecification)?
		];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const items = $derived(value[2]);
</script>

<div
	{...props}
	class={cn(
		'flex min-w-0 flex-row flex-wrap items-center gap-x-2 gap-y-1 rounded bg-black/5 px-2 py-2',
		className
	)}
>
	<ExpressionOperatorSelect value={expression} {onChange} />
	<ExpressionArgInputField parentValue={expression} index={1} {onChange} suggestion="propertyKey" />
	<div class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">in</div>
	{#if items !== undefined}
		<ExpressionArgInputField parentValue={expression} index={2} {onChange} />
	{:else}
		<div class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">this features</div>
	{/if}
	{@render children?.()}
</div>
