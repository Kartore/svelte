<script lang="ts">
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { ExpressionOperatorSelect } from '#lib/components/common/FilterInputField/expressions/common/ExpressionOperatorSelect';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		class: className,
		children,
		value,
		nested = false,
		onChange,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		children?: Snippet;
		value: ['pi'];
		nested?: boolean;
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
</script>

<div
	{...props}
	class={cn(
		'flex min-w-0 flex-row items-center gap-x-2 gap-y-1',
		nested ? 'flex-nowrap' : 'flex-wrap',
		!nested && 'rounded bg-field px-2 py-2',
		className
	)}
>
	<ExpressionOperatorSelect value={expression} {onChange} />
	{@render children?.()}
</div>
