<script lang="ts" module>
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { StylePropertySpec } from '#lib/utils/layerSpec.ts';

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
	import { FunctionIcon, X } from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import { ExpressionInputField } from '#lib/components/common/FilterInputField/expressions';
	import { ExpressionInputTypeInputField } from '#lib/components/common/FilterInputField/expressions/common/ExpressionInputTypeInputField';
	import { useExpressionSuggestions } from '#lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';
	import {
		literalToExpression,
		replaceArgAt
	} from '#lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
	import { literalToSuggestedExpression } from '#lib/components/common/FilterInputField/expressions/utils/expressionSeed.ts';
	import { isExpression } from '#lib/components/common/FilterInputField/expressions/utils/isExpression.ts';
	import {
		SpecLiteralField,
		getEditableExpressionLiteral,
		getSpecLiteralFieldKind,
		replaceEditableExpressionLiteral
	} from '#lib/components/common/SpecLiteralField';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		class: className,
		children,
		parentValue,
		index,
		onChange,
		onRemove,
		removeLabel = '引数を削除',
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
		if (!isExpression(arg)) {
			handleChildChange?.(
				literalToSuggestedExpression(editableLiteral.value, {
					propertySpec,
					suggestions: suggestionsContext
				})
			);
		}
	};
</script>

<div
	{...props}
	class={cn('group/arg flex max-w-full min-w-0 flex-row flex-wrap items-center gap-1', className)}
>
	{#if propertySpec !== undefined && specLiteralFieldKind !== undefined && editableLiteral !== undefined && !editAsExpression}
		<SpecLiteralField
			class="min-w-0 flex-1"
			compact
			label="値"
			spec={propertySpec}
			value={editableLiteral.value}
			onChange={handleChildChange ? handleSpecLiteralChange : undefined}
		/>
	{:else if isExpression(arg)}
		<ExpressionInputField class="min-w-0 flex-1" value={arg} onChange={handleChildChange} nested />
	{:else}
		<ExpressionInputTypeInputField
			class="max-w-full min-w-0"
			value={arg}
			onChange={handleChildChange}
			{suggestions}
			{literalType}
		/>
	{/if}
	{#if handleChildChange && !disableConvert && !editAsExpression && !isExpression(arg)}
		<Button
			aria-label="式に変換"
			title="式に変換"
			class="flex size-6 items-center justify-center rounded-[6px] text-ink-3 opacity-0 transition-opacity group-hover/arg:opacity-100 hover:bg-white hover:text-ink-1 focus-visible:opacity-100"
			onclick={specLiteralFieldKind !== undefined
				? editSpecLiteralAsExpression
				: () => handleChildChange?.(literalToExpression(arg))}
		>
			<FunctionIcon size={14} weight="regular" aria-hidden="true" />
		</Button>
	{:else if handleChildChange && !disableConvert && specLiteralFieldKind !== undefined && !editAsExpression}
		<Button
			aria-label="式として編集"
			title="式として編集"
			class="flex size-6 items-center justify-center rounded-[6px] text-ink-3 opacity-0 transition-opacity group-hover/arg:opacity-100 hover:bg-white hover:text-ink-1 focus-visible:opacity-100"
			onclick={editSpecLiteralAsExpression}
		>
			<FunctionIcon size={14} weight="regular" aria-hidden="true" />
		</Button>
	{/if}
	{#if onRemove && onChange}
		<Button
			aria-label={removeLabel}
			title={removeLabel}
			class="flex size-6 shrink-0 items-center justify-center rounded-[6px] text-ink-3 transition-colors hover:bg-white hover:text-ink-1"
			onclick={onRemove}
		>
			<X size={14} weight="regular" aria-hidden="true" />
		</Button>
	{/if}
	{@render children?.()}
</div>
