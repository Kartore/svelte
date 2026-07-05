<script lang="ts" module>
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

	export type ExpressionAppendArgButtonProps = {
		value: ExpressionSpecification;
		onChange?: (value: ExpressionSpecification) => void;
		class?: string;
	};
</script>

<script lang="ts">
	import { Button } from '$lib/components/common/Button';
	import { insertArgsAt } from '$lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
	import { getExpressionOperatorMeta } from '$lib/components/common/FilterInputField/expressions/utils/expressionRegistry.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let { value, onChange, class: className }: ExpressionAppendArgButtonProps = $props();

	const variadic = $derived(getExpressionOperatorMeta(value[0])?.variadic);
</script>

{#if variadic && onChange}
	<Button
		aria-label="Add argument"
		title="Add argument"
		class={cn(
			'rounded px-1.5 py-0.5 font-semibold text-gray-400 text-xs hover:text-gray-600',
			className
		)}
		onclick={() => {
			if (!variadic) return;
			onChange?.(
				insertArgsAt(value, value.length - variadic.tailCount, variadic.newArgsTemplate(value))
			);
		}}
	>
		+
	</Button>
{/if}
