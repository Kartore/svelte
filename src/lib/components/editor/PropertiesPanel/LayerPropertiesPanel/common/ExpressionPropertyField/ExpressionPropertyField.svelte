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
	import { PropertyErrorMessage } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/PropertyErrorMessage';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		label,
		value,
		defaultLiteral,
		onChange,
		rampable,
		showExpressionButton = true,
		propertyKey,
		propertyGroup = 'paint',
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
		/** shows the literal-to-expression button */
		showExpressionButton?: boolean;
		/** style-spec property name (e.g. 'fill-color') — enables inline validation errors */
		propertyKey?: string;
		/** property group the validation errors are looked up in */
		propertyGroup?: 'paint' | 'layout';
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
		{#if propertyKey}
			<PropertyErrorMessage group={propertyGroup} property={propertyKey} />
		{/if}
	</div>
{:else}
	<div {...props} class={cn('flex flex-col gap-1', className)}>
		<div class="group/property relative flex flex-row items-center">
			<div class="w-full min-w-0">{@render children()}</div>
			{#if rampable || showExpressionButton}
				<!-- ボタンをフロー外に置きラベルとコントロールの間の余白へ重ねる。
					フロー内に置くとボタン数 (0〜2) の分だけコントロールの右端がずれるため -->
				<div
					class="pointer-events-none absolute top-1/2 right-1/2 mr-1 flex -translate-y-1/2 flex-row items-center gap-0.5 rounded bg-white/90 opacity-0 transition-opacity focus-within:pointer-events-auto focus-within:opacity-100 group-hover/property:pointer-events-auto group-hover/property:opacity-100"
				>
					{#if rampable}
						<Button
							aria-label={`Interpolate ${label} by zoom`}
							title={`Interpolate ${label} by zoom`}
							class="rounded px-1 py-0.5 font-mono text-xs text-gray-400 hover:text-gray-600"
							onclick={() => onChange?.(literalToZoomInterpolate(value ?? defaultLiteral))}
						>
							∿
						</Button>
					{/if}
					{#if showExpressionButton}
						<Button
							aria-label={`Use expression for ${label}`}
							title={`Use expression for ${label}`}
							class="rounded px-1 py-0.5 font-mono text-xs text-gray-400 italic hover:text-gray-600"
							onclick={() => onChange?.(literalToExpression(value ?? defaultLiteral))}
						>
							fx
						</Button>
					{/if}
				</div>
			{/if}
		</div>
		{#if propertyKey}
			<PropertyErrorMessage group={propertyGroup} property={propertyKey} />
		{/if}
	</div>
{/if}
