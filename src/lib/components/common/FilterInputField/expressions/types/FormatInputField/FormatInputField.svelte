<script lang="ts">
	import type {
		ColorSpecification,
		ExpressionSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { ExpressionAppendArgButton } from '$lib/components/common/FilterInputField/expressions/common/ExpressionAppendArgButton';
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
			'format',
			...(
				| string
				| ['image', ExpressionSpecification]
				| ExpressionSpecification
				| {
						'font-scale'?: number | ExpressionSpecification;
						'text-font'?: string[] | ExpressionSpecification;
						'text-color'?: ColorSpecification | ExpressionSpecification;
				  }
			)[]
		];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
	const values = $derived(value.slice(1) as (unknown | ExpressionSpecification)[]);

	const isStyleOptionsObject = (arg: unknown): boolean => {
		return typeof arg === 'object' && arg !== null && !Array.isArray(arg);
	};
</script>

<div
	{...props}
	class={cn(
		'flex min-w-0 flex-row flex-wrap items-center gap-x-2 gap-y-1 rounded bg-black/5 px-2 py-2',
		className
	)}
>
	<ExpressionOperatorSelect value={expression} {onChange} />
	{#each values as arg, index (index)}
		{#if isStyleOptionsObject(arg)}
			<div class="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
				format option: {JSON.stringify(arg)}
			</div>
		{:else}
			<ExpressionArgInputField parentValue={expression} index={index + 1} {onChange} />
		{/if}
	{/each}
	<ExpressionAppendArgButton value={expression} {onChange} />
	{@render children?.()}
</div>
