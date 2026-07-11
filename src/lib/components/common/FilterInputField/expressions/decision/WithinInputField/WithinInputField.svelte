<script lang="ts">
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

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
		value: ['within', unknown];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const geometry = $derived(value[1]);
</script>

<div
	{...props}
	class={cn('flex min-w-0 flex-row items-center gap-2 rounded bg-black/5 px-2 py-2', className)}
>
	<ExpressionOperatorSelect value={expression} {onChange} />
	<div class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
		{JSON.stringify(geometry)}
	</div>
	{@render children?.()}
</div>
