<script lang="ts" module>
	import type { ExpressionFilterSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type FilterInputFieldProps = Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		children?: Snippet;
		value?: ExpressionFilterSpecification;
		onChange?: (value: ExpressionFilterSpecification) => void;
	};
</script>

<script lang="ts">
	import { ExpressionInputField } from '#lib/components/common/FilterInputField/expressions';
	import { ExpressionInputTypeInputField } from '#lib/components/common/FilterInputField/expressions/common/ExpressionInputTypeInputField';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let { class: className, children, value, onChange, ...props }: FilterInputFieldProps = $props();
</script>

{#if value !== undefined}
	{#if typeof value === 'boolean'}
		<div {...props} class={cn('font-mono text-[11px]', className)}>
			<ExpressionInputTypeInputField
				{value}
				onChange={onChange ? (next) => onChange?.(next === true) : undefined}
			/>
			{@render children?.()}
		</div>
	{:else}
		<ExpressionInputField class="font-mono text-[11px]" {value} {onChange} {...props}>
			{@render children?.()}
		</ExpressionInputField>
	{/if}
{/if}
