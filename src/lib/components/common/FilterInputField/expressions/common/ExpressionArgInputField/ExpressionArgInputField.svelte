<script lang="ts" module>
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { StylePropertySpec } from '$lib/utils/layerSpec.ts';

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
		/** selects the same literal input component used by the sidebar property */
		propertySpec?: StylePropertySpec;
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
	import {
		SpecLiteralField,
		getEditableExpressionLiteral,
		getSpecLiteralFieldKind,
		replaceEditableExpressionLiteral
	} from '$lib/components/common/SpecLiteralField';
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
		propertySpec,
		...props
	}: ExpressionArgInputFieldProps = $props();

	let editAsExpression = $state(false);

	const arg = $derived(parentValue[index]);
	const editableLiteral = $derived(getEditableExpressionLiteral(arg));
	const specLiteralFieldKind = $derived(
		propertySpec !== undefined && editableLiteral !== undefined
			? getSpecLiteralFieldKind(propertySpec, editableLiteral.value)
			: undefined
	);
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
	const handleSpecLiteralChange = (next: unknown | undefined) => {
		if (next === undefined || editableLiteral === undefined) return;
		handleChildChange?.(replaceEditableExpressionLiteral(editableLiteral, next));
	};
	const editSpecLiteralAsExpression = () => {
		if (editableLiteral === undefined) return;
		editAsExpression = true;
		if (!isExpression(arg)) handleChildChange?.(literalToExpression(editableLiteral.value));
	};
</script>

<div {...props} class={cn('group/arg flex flex-row items-center gap-0.5', className)}>
	{#if propertySpec !== undefined && specLiteralFieldKind !== undefined && editableLiteral !== undefined && !editAsExpression}
		<SpecLiteralField
			class="min-w-0 flex-1"
			compact
			label="Value"
			spec={propertySpec}
			value={editableLiteral.value}
			onChange={handleChildChange ? handleSpecLiteralChange : undefined}
		/>
	{:else if isExpression(arg)}
		<ExpressionInputField value={arg} onChange={handleChildChange} />
	{:else}
		<ExpressionInputTypeInputField
			value={arg}
			onChange={handleChildChange}
			{suggestions}
			{literalType}
		/>
	{/if}
	{#if handleChildChange && !disableConvert && !editAsExpression && !isExpression(arg)}
		<Button
			aria-label="Convert to expression"
			title="Convert to expression"
			class="rounded px-1 py-0.5 font-mono text-xs text-gray-400 italic opacity-0 transition-opacity group-hover/arg:opacity-100 focus-visible:opacity-100"
			onclick={specLiteralFieldKind !== undefined
				? editSpecLiteralAsExpression
				: () => handleChildChange?.(literalToExpression(arg))}
		>
			fx
		</Button>
	{:else if handleChildChange && !disableConvert && specLiteralFieldKind !== undefined && !editAsExpression}
		<Button
			aria-label="Edit as expression"
			title="Edit as expression"
			class="rounded px-1 py-0.5 font-mono text-xs text-gray-400 italic opacity-0 transition-opacity group-hover/arg:opacity-100 focus-visible:opacity-100"
			onclick={editSpecLiteralAsExpression}
		>
			fx
		</Button>
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
