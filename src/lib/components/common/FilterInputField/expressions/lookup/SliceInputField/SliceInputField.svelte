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
			'slice',
			string | ExpressionSpecification,
			number | ExpressionSpecification,
			(number | ExpressionSpecification)?
		];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const to = $derived(value[3]);
</script>

<div
	{...props}
	class={cn(
		'flex min-w-0 flex-row flex-wrap items-center gap-x-2 gap-y-1 rounded bg-black/5 px-2 py-2',
		className
	)}
>
	<ExpressionArgInputField parentValue={expression} index={1} {onChange} />
	<ExpressionOperatorSelect value={expression} {onChange} />
	<div class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">from</div>
	<ExpressionArgInputField parentValue={expression} index={2} {onChange} />
	{#if to !== undefined}
		<div class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">to</div>
		<ExpressionArgInputField parentValue={expression} index={3} {onChange} />
	{/if}
	{@render children?.()}
</div>
