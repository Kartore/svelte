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
		value: ['!', boolean | ExpressionSpecification];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
</script>

<div {...props} class={cn('flex min-w-0 flex-col gap-2 rounded bg-black/5 px-2 py-2', className)}>
	<div class="flex min-w-0 items-center gap-1">
		<span class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">logic</span>
		<ExpressionOperatorSelect value={expression} {onChange} />
	</div>
	<div class="min-w-0 border-l border-gray-200 pl-2">
		<ExpressionArgInputField
			class="min-w-0 rounded px-0.5 py-1 hover:bg-white/60 [&>:first-child]:min-w-0 [&>:first-child]:flex-1"
			parentValue={expression}
			index={1}
			{onChange}
		/>
	</div>
	{@render children?.()}
</div>
