<script lang="ts">
	import type {
		ExpressionInputType,
		ExpressionSpecification
	} from '@maplibre/maplibre-gl-style-spec';
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
			'in',
			ExpressionInputType | ExpressionSpecification | null,
			string | ExpressionSpecification
		];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
</script>

<div
	{...props}
	class={cn(
		'flex flex-row flex-wrap items-center gap-2 rounded bg-black/5 px-0.5 py-0.5',
		className
	)}
>
	<ExpressionArgInputField parentValue={expression} index={2} {onChange} />
	<ExpressionOperatorSelect value={expression} {onChange} />
	<ExpressionArgInputField parentValue={expression} index={1} {onChange} />
	{@render children?.()}
</div>
