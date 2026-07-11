<script lang="ts">
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { ExpressionInputTypeInputField } from '$lib/components/common/FilterInputField/expressions/common/ExpressionInputTypeInputField';
	import { ExpressionOperatorSelect } from '$lib/components/common/FilterInputField/expressions/common/ExpressionOperatorSelect';
	import { replaceArgAt } from '$lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
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
		value: ['var', string];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as unknown as ExpressionSpecification);
</script>

<div
	{...props}
	class={cn('flex min-w-0 flex-row items-center gap-2 rounded bg-black/5 px-2 py-2', className)}
>
	<ExpressionOperatorSelect value={expression} {onChange} />
	<ExpressionInputTypeInputField
		value={value[1]}
		onChange={onChange ? (v) => onChange(replaceArgAt(expression, 1, v)) : undefined}
	/>
	<div class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">from variables</div>
	{@render children?.()}
</div>
