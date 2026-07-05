<script lang="ts">
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { Button } from '$lib/components/common/Button';
	import { ExpressionInputField } from '$lib/components/common/FilterInputField/expressions';
	import {
		literalToExpression,
		literalToZoomInterpolate
	} from '$lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
	import { isExpression } from '$lib/components/common/FilterInputField/expressions/utils/isExpression.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		label,
		value,
		defaultLiteral,
		onChange,
		rampable,
		children,
		class: className,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'children'> & {
		class?: string;
		label: string;
		/** current raw property value (literal or expression) */
		value: unknown;
		/** literal used as conversion seed when the property is unset */
		defaultLiteral: unknown;
		/** property-level setter — receives an expression, or undefined to reset */
		onChange?: (value: unknown | undefined) => void;
		/** offers the zoom-interpolate shortcut — only for interpolatable (number/color) properties */
		rampable?: boolean;
		/** the literal editor, rendered while the value is not an expression */
		children: Snippet;
	} = $props();

	let confirmingRemove = $state(false);
</script>

<!--
	Wraps a paint/layout property editor: literal values render the existing
	editor plus an "fx" button converting to an expression; expression values
	render the expression editor with a remove action resetting the property.
-->
{#if isExpression(value)}
	<div {...props} class={cn('flex flex-col gap-1', className)}>
		<div class="flex flex-row items-center justify-between">
			<span class="text-sm font-semibold text-gray-600">{label}</span>
			{#if confirmingRemove}
				<div class="flex flex-row items-center gap-1">
					<Button
						aria-label={`Confirm removing expression for ${label}`}
						class="rounded px-2 py-0.5 text-xs font-semibold text-red-500"
						onclick={() => {
							confirmingRemove = false;
							onChange?.(undefined);
						}}
					>
						Reset property
					</Button>
					<Button
						aria-label="Cancel"
						class="rounded px-2 py-0.5 text-xs font-semibold text-gray-500"
						onclick={() => (confirmingRemove = false)}
					>
						Cancel
					</Button>
				</div>
			{:else}
				<Button
					aria-label={`Remove expression for ${label}`}
					class="rounded px-2 py-0.5 text-xs font-semibold text-gray-500 hover:text-red-500"
					onclick={() => (confirmingRemove = true)}
				>
					Remove expression
				</Button>
			{/if}
		</div>
		<ExpressionInputField class="text-sm" value={value as ExpressionSpecification} {onChange} />
	</div>
{:else}
	<div {...props} class={cn('group/property flex flex-row items-center gap-1', className)}>
		<div class="min-w-0 flex-1">{@render children()}</div>
		{#if rampable}
			<Button
				aria-label={`Interpolate ${label} by zoom`}
				title={`Interpolate ${label} by zoom`}
				class="rounded px-1 py-0.5 font-mono text-xs text-gray-400 opacity-0 transition-opacity group-hover/property:opacity-100 focus-visible:opacity-100"
				onclick={() => onChange?.(literalToZoomInterpolate(value ?? defaultLiteral))}
			>
				∿
			</Button>
		{/if}
		<Button
			aria-label={`Use expression for ${label}`}
			title={`Use expression for ${label}`}
			class="rounded px-1 py-0.5 font-mono text-xs text-gray-400 italic opacity-0 transition-opacity group-hover/property:opacity-100 focus-visible:opacity-100"
			onclick={() => onChange?.(literalToExpression(value ?? defaultLiteral))}
		>
			fx
		</Button>
	</div>
{/if}
