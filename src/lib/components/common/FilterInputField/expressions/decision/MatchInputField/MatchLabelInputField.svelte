<script lang="ts">
	import type {
		ExpressionInputType,
		ExpressionSpecification
	} from '@maplibre/maplibre-gl-style-spec';

	import { Button } from '$lib/components/common/Button';
	import { ExpressionInputTypeInputField } from '$lib/components/common/FilterInputField/expressions/common/ExpressionInputTypeInputField';
	import type { ExpressionSuggestionValue } from '$lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';
	import { replaceArgAt } from '$lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';

	let {
		expression,
		label,
		labelIndex,
		onChange,
		suggestions
	}: {
		expression: ExpressionSpecification;
		label: ExpressionInputType | ExpressionInputType[];
		labelIndex: number;
		onChange?: (value: ExpressionSpecification) => void;
		suggestions?: ExpressionSuggestionValue[];
	} = $props();

	const replaceLabelArray = (newArray: ExpressionInputType[]) => {
		onChange?.(replaceArgAt(expression, labelIndex, newArray));
	};
</script>

{#if !Array.isArray(label)}
	<ExpressionInputTypeInputField
		value={label}
		onChange={onChange ? (next) => onChange(replaceArgAt(expression, labelIndex, next)) : undefined}
		{suggestions}
	/>
{:else}
	<div class="flex flex-row items-center gap-0.5">
		{#each label as element, elementIndex (elementIndex)}
			<ExpressionInputTypeInputField
				value={element}
				onChange={onChange
					? (next) =>
							replaceLabelArray(label.map((current, i) => (i === elementIndex ? next : current)))
					: undefined}
				{suggestions}
			/>
			{#if onChange && label.length > 1}
				<Button
					aria-label="Remove label"
					title="Remove label"
					class="rounded px-1 py-0.5 text-xs text-gray-400 transition-colors hover:text-red-500"
					onclick={() => replaceLabelArray(label.filter((_, i) => i !== elementIndex))}
				>
					×
				</Button>
			{/if}
			{#if elementIndex < label.length - 1}
				<div class="flex flex-row px-0.5 py-0.5">OR</div>
			{/if}
		{/each}
		{#if onChange}
			<Button
				aria-label="Add label"
				title="Add label"
				class="rounded px-1 py-0.5 text-xs font-semibold text-gray-400 hover:text-gray-600"
				onclick={() => replaceLabelArray([...label, ''])}
			>
				+
			</Button>
		{/if}
	</div>
{/if}
