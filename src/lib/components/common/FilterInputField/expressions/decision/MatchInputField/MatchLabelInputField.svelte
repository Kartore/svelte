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
		class="min-w-0 [&>input]:max-w-full"
		value={label}
		onChange={onChange ? (next) => onChange(replaceArgAt(expression, labelIndex, next)) : undefined}
		{suggestions}
	/>
{:else}
	<div class="flex min-w-0 flex-wrap items-center gap-1 rounded bg-gray-100 px-1 py-0.5">
		{#each label as element, elementIndex (elementIndex)}
			<div class="flex max-w-full min-w-0 items-center rounded bg-white px-0.5 ring-1 ring-black/5">
				<ExpressionInputTypeInputField
					class="min-w-0 px-0 [&>input]:max-w-full"
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
			</div>
		{/each}
		{#if onChange}
			<Button
				aria-label="Add label"
				title="Add label"
				class="rounded px-1.5 py-0.5 text-xs font-semibold text-gray-400 hover:text-gray-600"
				onclick={() => replaceLabelArray([...label, ''])}
			>
				+ Value
			</Button>
		{/if}
	</div>
{/if}
