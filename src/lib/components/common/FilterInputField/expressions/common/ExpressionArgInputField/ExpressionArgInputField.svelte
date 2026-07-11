<script lang="ts" module>
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type ExpressionArgSuggestionHint = 'propertyKey' | { kind: 'propertyValue'; key: string };

	export type ExpressionArgInputFieldProps = Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		children?: Snippet;
		/** the WHOLE parent expression this argument belongs to */
		parentValue: ExpressionSpecification;
		/** this argument's index within parentValue */
		index: number;
		/** the PARENT's onChange — receives the rebuilt parent expression */
		onChange?: (value: ExpressionSpecification) => void;
		/** renders an inline remove button when provided */
		onRemove?: () => void;
		/** accessible label for the inline remove button */
		removeLabel?: string;
		/** hides the literal → expression conversion button */
		disableConvert?: boolean;
		/** offers completion candidates from the layer's source data */
		suggestion?: ExpressionArgSuggestionHint;
		/** renders a color picker next to string literals holding a color */
		literalType?: 'color';
	};
</script>

<script lang="ts">
	import { Button } from '$lib/components/common/Button';
	import { ExpressionInputField } from '$lib/components/common/FilterInputField/expressions';
	import { ExpressionInputTypeInputField } from '$lib/components/common/FilterInputField/expressions/common/ExpressionInputTypeInputField';
	import { useExpressionSuggestions } from '$lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';
	import {
		literalToExpression,
		replaceArgAt
	} from '$lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
	import { isExpression } from '$lib/components/common/FilterInputField/expressions/utils/isExpression.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		children,
		parentValue,
		index,
		onChange,
		onRemove,
		removeLabel = 'Remove argument',
		disableConvert,
		suggestion,
		literalType,
		...props
	}: ExpressionArgInputFieldProps = $props();

	const arg = $derived(parentValue[index]);
	const getSuggestionsContext = useExpressionSuggestions();
	const suggestionsContext = $derived(getSuggestionsContext());
	const suggestions = $derived.by(() => {
		if (!suggestion || !suggestionsContext) return undefined;
		if (suggestion === 'propertyKey') {
			return suggestionsContext.propertyKeys.map((propertyKey) => propertyKey.name);
		}
		return suggestionsContext.getValueSuggestions(suggestion.key);
	});
	const handleChildChange = $derived(
		onChange ? (next: unknown) => onChange?.(replaceArgAt(parentValue, index, next)) : undefined
	);
</script>

<div {...props} class={cn('group/arg flex flex-row items-center gap-0.5', className)}>
	{#if isExpression(arg)}
		<ExpressionInputField value={arg} onChange={handleChildChange} />
	{:else}
		<ExpressionInputTypeInputField
			value={arg}
			onChange={handleChildChange}
			{suggestions}
			{literalType}
		/>
		{#if handleChildChange && !disableConvert}
			<Button
				aria-label="Convert to expression"
				title="Convert to expression"
				class="rounded px-1 py-0.5 font-mono text-xs text-gray-400 italic opacity-0 transition-opacity group-hover/arg:opacity-100 focus-visible:opacity-100"
				onclick={() => handleChildChange?.(literalToExpression(arg))}
			>
				fx
			</Button>
		{/if}
	{/if}
	{#if onRemove && onChange}
		<Button
			aria-label={removeLabel}
			title={removeLabel}
			class="shrink-0 rounded px-1 py-0.5 text-xs text-gray-400 transition-colors hover:text-red-500"
			onclick={onRemove}
		>
			×
		</Button>
	{/if}
	{@render children?.()}
</div>
