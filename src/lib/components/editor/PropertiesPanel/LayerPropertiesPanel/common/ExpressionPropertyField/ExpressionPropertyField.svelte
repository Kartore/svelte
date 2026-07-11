<script lang="ts">
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { Button } from '$lib/components/common/Button';
	import { ExpressionInputField } from '$lib/components/common/FilterInputField/expressions';
	import { CurvePreview } from '$lib/components/common/FilterInputField/expressions/common/CurvePreview';
	import {
		literalToExpression,
		literalToZoomInterpolate
	} from '$lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
	import { sampleCurveExpression } from '$lib/components/common/FilterInputField/expressions/utils/curveSampling.ts';
	import { isExpression } from '$lib/components/common/FilterInputField/expressions/utils/isExpression.ts';
	import { PropertyErrorMessage } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/PropertyErrorMessage';
	import { useExpressionFlyout } from '$lib/contexts/expressionFlyout.svelte.ts';
	import type { StylePropertySpec } from '$lib/utils/layerSpec.ts';
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
		propertySpec,
		zoomRange,
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
		/** style-spec metadata used to select the same literal editor as the sidebar */
		propertySpec?: StylePropertySpec;
		/** zoom curve preview のドメインをレイヤーの表示範囲に合わせる */
		zoomRange?: [number, number];
		/** the literal editor, rendered while the value is not an expression */
		children: Snippet;
	} = $props();

	let confirmingRemove = $state(false);

	const flyout = useExpressionFlyout();
	// フライアウトは paint/layout プロパティ (propertyKey あり) でのみ使える。
	// context 未提供の場面 (単体利用など) ではインライン編集にフォールバックする
	const canUseFlyout = $derived(
		flyout !== undefined && propertyKey !== undefined && propertyGroup !== undefined
	);
	const isFlyoutOpen = $derived(
		canUseFlyout && flyout !== undefined && propertyKey !== undefined
			? flyout.isOpen(propertyGroup, propertyKey)
			: false
	);
	const openFlyout = (anchorElement: HTMLElement) => {
		if (!canUseFlyout || flyout === undefined || propertyKey === undefined) return;
		flyout.open({ group: propertyGroup, key: propertyKey, label }, anchorElement);
	};
	const toggleFlyout = (anchorElement: HTMLElement) => {
		if (isFlyoutOpen) flyout?.close();
		else openFlyout(anchorElement);
	};
	// literal → expression では押したボタンが置き換わるため、新しい fx ボタンへ付け替える。
	const handleExpressionButtonRef = (anchorElement: HTMLButtonElement | null) => {
		if (!anchorElement || propertyKey === undefined) return;
		flyout?.reanchor(propertyGroup, propertyKey, anchorElement);
	};
	const expressionSummary = $derived(
		Array.isArray(value) && typeof value[0] === 'string' ? value[0] : 'expression'
	);
	// curve 式のときだけサイドバーにプレビューを出す (二重サンプリングになるが 64 点評価で軽量)
	const hasCurvePreview = $derived(
		isExpression(value) && sampleCurveExpression(value as ExpressionSpecification) !== null
	);
</script>

<!--
	Wraps a paint/layout property editor: literal values render the existing
	editor plus an "fx" button converting to an expression; expression values
	render the expression editor with a remove action resetting the property.
-->
{#if isExpression(value)}
	<div {...props} class={cn('flex flex-col gap-1', className)}>
		<div class="flex flex-row items-center justify-between gap-2">
			<span class="shrink-0 text-sm font-semibold text-gray-600">{label}</span>
			{#if confirmingRemove}
				<div class="flex flex-row items-center gap-1">
					<Button
						aria-label={`Confirm removing expression for ${label}`}
						class="rounded px-2 py-0.5 text-xs font-semibold text-red-500"
						onclick={() => {
							confirmingRemove = false;
							if (isFlyoutOpen) flyout?.close();
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
				<div class="flex min-w-0 flex-row items-center gap-1">
					{#if canUseFlyout}
						<Button
							bind:ref={() => null, handleExpressionButtonRef}
							aria-label={`Edit expression for ${label}`}
							aria-pressed={isFlyoutOpen}
							class={cn(
								'flex min-w-0 flex-row items-center gap-1.5 rounded border px-2 py-0.5 text-xs transition-colors',
								isFlyoutOpen
									? 'border-blue-300 bg-blue-50 text-blue-600'
									: 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
							)}
							onclick={(event) => toggleFlyout(event.currentTarget)}
						>
							<span class="shrink-0 font-mono font-semibold italic">fx</span>
							<span class="truncate font-mono">{expressionSummary}</span>
						</Button>
					{/if}
					<Button
						aria-label={`Remove expression for ${label}`}
						class="shrink-0 rounded px-2 py-0.5 text-xs font-semibold text-gray-400 hover:text-red-500"
						onclick={() => (confirmingRemove = true)}
					>
						Remove
					</Button>
				</div>
			{/if}
		</div>
		{#if canUseFlyout}
			<!-- curve 式ならサイドバーでも値の分布が見えるようにプレビューを出す。
				クリックでフライアウトを開く -->
			{#if hasCurvePreview}
				<button
					type="button"
					class="w-full cursor-pointer text-left"
					aria-label={`Open ${label} expression editor`}
					title={`Open ${label} expression editor`}
					onclick={(event) => toggleFlyout(event.currentTarget)}
				>
					<CurvePreview value={value as ExpressionSpecification} {zoomRange} />
				</button>
			{/if}
		{:else}
			<ExpressionInputField
				class="text-sm"
				value={value as ExpressionSpecification}
				{propertySpec}
				{zoomRange}
				{onChange}
			/>
		{/if}
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
							onclick={(event) => {
								onChange?.(literalToZoomInterpolate(value ?? defaultLiteral));
								openFlyout(event.currentTarget);
							}}
						>
							∿
						</Button>
					{/if}
					{#if showExpressionButton}
						<Button
							aria-label={`Use expression for ${label}`}
							title={`Use expression for ${label}`}
							class="rounded px-1 py-0.5 font-mono text-xs text-gray-400 italic hover:text-gray-600"
							onclick={(event) => {
								onChange?.(literalToExpression(value ?? defaultLiteral));
								openFlyout(event.currentTarget);
							}}
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
