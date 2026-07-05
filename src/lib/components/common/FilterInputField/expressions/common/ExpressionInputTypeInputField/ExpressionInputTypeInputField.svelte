<script lang="ts" module>
	import type { ExpressionInputType } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import type { ExpressionSuggestionValue } from '$lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';

	export type ExpressionInputTypeInputFieldProps = Omit<
		HTMLAttributes<HTMLDivElement>,
		'onchange'
	> & {
		class?: string;
		children?: Snippet;
		value: ExpressionInputType | unknown;
		onChange?: (value: ExpressionInputType) => void;
		/** completion candidates offered while editing */
		suggestions?: ExpressionSuggestionValue[];
		/** renders a color swatch/picker next to string literals holding a color */
		literalType?: 'color';
	};
</script>

<script lang="ts">
	import { Button } from '$lib/components/common/Button';
	import { ColorPicker } from '$lib/components/common/ColorField/ColorPicker';
	import type { Color } from '$lib/utils/color.ts';
	import { parseColor } from '$lib/utils/color.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	import LiteralTextInput, { literalInputClassName } from './LiteralTextInput.svelte';

	let {
		class: className,
		children,
		value,
		onChange,
		suggestions,
		literalType,
		...props
	}: ExpressionInputTypeInputFieldProps = $props();

	const toDisplayText = (value: unknown): string => {
		return typeof value === 'string'
			? `"${value}"`
			: typeof value === 'number' || typeof value === 'boolean'
				? value.toString()
				: JSON.stringify(value);
	};

	const tryParseColor = (value: string): Color | undefined => {
		try {
			return parseColor(value);
		} catch {
			return undefined;
		}
	};

	const isEditable = $derived(
		onChange !== undefined &&
			(typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
	);
	const color = $derived(
		literalType === 'color' && typeof value === 'string' ? tryParseColor(value) : undefined
	);
</script>

<div {...props} class={cn('flex flex-row items-center gap-1 px-0.5 py-0.5', className)}>
	{#if color}
		<ColorPicker
			value={color}
			onChange={onChange ? (next: Color) => next && onChange?.(next.toString('rgba')) : undefined}
		/>
	{/if}
	{#if !isEditable || onChange === undefined}
		{toDisplayText(value)}
	{:else if typeof value === 'boolean'}
		<Button
			aria-label="toggle boolean value"
			class={cn(literalInputClassName, 'cursor-pointer')}
			onclick={() => onChange?.(!value)}
		>
			{value.toString()}
		</Button>
	{:else if typeof value === 'number'}
		<LiteralTextInput
			aria-label="number value"
			value={String(value)}
			parse={(text) => {
				if (text.trim() === '') return undefined;
				const parsed = Number(text);
				return Number.isNaN(parsed) ? undefined : parsed;
			}}
			onCommit={onChange}
			{suggestions}
		/>
	{:else}
		<LiteralTextInput
			aria-label="text value"
			value={value as string}
			parse={(text) => text}
			onCommit={onChange}
			{suggestions}
		/>
	{/if}
	{@render children?.()}
</div>
