<script lang="ts" module>
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

	export type ExpressionOperatorSelectProps = {
		/** the whole expression whose operator is being changed */
		value: ExpressionSpecification;
		onChange?: (value: ExpressionSpecification) => void;
		/** display override for the operator token ("switch" for match, etc.) */
		label?: string;
		class?: string;
	};
</script>

<script lang="ts">
	import { changeOperator } from '$lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
	import {
		getExpressionOperatorMeta,
		listOperatorsByCategory
	} from '$lib/components/common/FilterInputField/expressions/utils/expressionRegistry.ts';
	import type { SelectSection } from '$lib/components/common/Select';
	import { Select } from '$lib/components/common/Select';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let { value, onChange, label, class: className }: ExpressionOperatorSelectProps = $props();

	const operatorSections: SelectSection[] = listOperatorsByCategory().map(
		({ category, operators }) => ({
			title: category,
			items: operators.map((operatorMeta) => ({
				value: operatorMeta.operator,
				label: operatorMeta.label ?? operatorMeta.operator
			}))
		})
	);

	const operator = $derived(value[0]);
	const meta = $derived(getExpressionOperatorMeta(operator));
	const displayLabel = $derived(label ?? meta?.label ?? String(operator));
</script>

{#if !meta || !onChange}
	<div
		class={cn(
			'flex min-w-0 max-w-full flex-row rounded bg-gray-100 px-2 py-1 font-mono text-sm font-normal text-gray-700',
			className
		)}
	>
		<span class="truncate">{displayLabel}</span>
	</div>
{:else}
	<Select
		aria-label="expression operator"
		class={cn('inline-flex min-w-0 max-w-full font-mono', className)}
		triggerClass="w-auto min-w-0 max-w-full font-mono font-normal text-gray-700"
		sections={operatorSections}
		value={String(operator)}
		onValueChange={(key) => {
			if (key === operator) return;
			onChange?.(changeOperator(value, String(key)));
		}}
	/>
{/if}
