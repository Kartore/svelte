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
			'number-format',
			number | ExpressionSpecification,
			{
				locale?: string | ExpressionSpecification;
				currency?: string | ExpressionSpecification;
				'min-fraction-digits'?: number | ExpressionSpecification;
				'max-fraction-digits'?: number | ExpressionSpecification;
			}
		];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
</script>

<div
	{...props}
	class={cn('flex flex-row items-center gap-2 rounded bg-black/5 px-0.5 py-0.5', className)}
>
	<ExpressionOperatorSelect value={expression} {onChange} />
	<ExpressionArgInputField parentValue={expression} index={1} {onChange} />
	<div class="flex flex-row px-0.5 py-0.5">option: {JSON.stringify(value[2])}</div>
	{@render children?.()}
</div>
