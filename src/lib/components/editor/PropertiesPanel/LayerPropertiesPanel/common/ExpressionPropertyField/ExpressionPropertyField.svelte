<script lang="ts">
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import { Popover } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { CaretDown, ChartLine, DotsThree, FunctionIcon, Minus } from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import { ExpressionInputField } from '#lib/components/common/FilterInputField/expressions';
	import { CurveStopsEditor } from '#lib/components/common/FilterInputField/expressions/curves/common/CurveStopsEditor';
	import { useExpressionSuggestions } from '#lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';
	import { literalToZoomInterpolate } from '#lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
	import { literalToSuggestedExpression } from '#lib/components/common/FilterInputField/expressions/utils/expressionSeed.ts';
	import { sampleCurveExpression } from '#lib/components/common/FilterInputField/expressions/utils/curveSampling.ts';
	import { isExpression } from '#lib/components/common/FilterInputField/expressions/utils/isExpression.ts';
	import { PropertyErrorMessage } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/PropertyErrorMessage';
	import { PropertyHistoryPopover } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/PropertyHistoryPopover';
	import {
		VariableChip,
		VariablePickerPopover
	} from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/VariableBindingControl';
	import { useExpressionFlyout } from '#lib/contexts/expressionFlyout.svelte.ts';
	import { useStyleHistory } from '#lib/contexts/styleHistory.svelte.ts';
	import { useStyleVariables } from '#lib/contexts/styleVariables.svelte.ts';
	import type { StylePropertySpec } from '#lib/utils/layerSpec.ts';
	import type {
		PropertyBindingTarget,
		StyleVariable,
		StyleVariableType
	} from '#lib/utils/styleVariables.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		label,
		value,
		defaultLiteral,
		styleDefaultValue,
		onChange,
		onReset,
		rampable,
		showExpressionButton = true,
		layerId,
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
		/** effective style-spec value shown in history when the raw property is unset */
		styleDefaultValue?: unknown;
		/** property-level setter — receives an expression, or undefined to reset */
		onChange?: (value: unknown | undefined) => void;
		/** resets the configured property to its unset state */
		onReset?: () => void;
		/** offers the zoom-interpolate shortcut — only for interpolatable (number/color) properties */
		rampable?: boolean;
		/** shows the literal-to-expression button */
		showExpressionButton?: boolean;
		/** layer id used to resolve property history */
		layerId?: string;
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

	const flyout = useExpressionFlyout();
	const history = useStyleHistory();
	const variables = useStyleVariables();
	const getExpressionSuggestions = useExpressionSuggestions();
	const expressionSuggestions = $derived(getExpressionSuggestions());
	// フライアウトは paint/layout プロパティ (propertyKey あり) でのみ使える。
	// context 未提供の場面 (単体利用など) ではインライン編集にフォールバックする
	const canUseFlyout = $derived(
		flyout !== undefined && propertyKey !== undefined && propertyGroup !== undefined
	);
	const canShowHistory = $derived(
		history !== undefined &&
			history.provider !== null &&
			layerId !== undefined &&
			propertyKey !== undefined
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
	const expressionInputSummary = $derived.by(() => {
		if (!hasCurvePreview || !Array.isArray(value)) return '';
		const inputIndex = value[0] === 'step' ? 1 : 2;
		const input = value[inputIndex];
		return Array.isArray(input) && typeof input[0] === 'string' ? input[0] : 'input';
	});
	const expressionDisplaySummary = $derived(
		`${expressionSummary}${expressionInputSummary ? ` ・ ${expressionInputSummary}` : ''}`
	);
	const isInterpolateRoot = $derived(
		Array.isArray(value) &&
			(value[0] === 'interpolate' ||
				value[0] === 'interpolate-hcl' ||
				value[0] === 'interpolate-lab')
	);
	const interpolationTarget = $derived(
		propertyKey !== undefined
			? ({
					group: propertyGroup,
					key: propertyKey,
					slot: 'interpolation'
				} satisfies PropertyBindingTarget)
			: undefined
	);
	const interpolationBinding = $derived(
		variables !== undefined && layerId !== undefined && interpolationTarget !== undefined
			? variables.getBindingStatus(layerId, interpolationTarget)
			: undefined
	);
	const bindableType = $derived.by((): StyleVariableType | undefined => {
		if (propertySpec?.['property-type'] === 'color-ramp') return undefined;
		if (propertySpec?.type === 'color') return 'color';
		if (propertySpec?.type === 'number') return 'number';
		return undefined;
	});
	const literalVariableSeed = $derived(value !== undefined ? value : propertySpec?.default);
	const canCreateVariableFromLiteral = $derived(
		(bindableType === 'color' &&
			typeof literalVariableSeed === 'string' &&
			literalVariableSeed !== '') ||
			(bindableType === 'number' &&
				typeof literalVariableSeed === 'number' &&
				Number.isFinite(literalVariableSeed))
	);
	const literalTarget = $derived(
		propertyKey !== undefined
			? ({ group: propertyGroup, key: propertyKey } satisfies PropertyBindingTarget)
			: undefined
	);
	const literalBinding = $derived(
		variables !== undefined && layerId !== undefined && literalTarget !== undefined
			? variables.getBindingStatus(layerId, literalTarget)
			: undefined
	);
	const canBindLiteral = $derived(
		variables !== undefined &&
			layerId !== undefined &&
			bindableType !== undefined &&
			!isExpression(value)
	);
	const hasPropertyActions = $derived(
		canShowHistory ||
			onReset !== undefined ||
			(!isExpression(value) &&
				literalBinding === undefined &&
				(rampable || showExpressionButton || canBindLiteral))
	);
	const convertLiteralToExpression = () => {
		return literalToSuggestedExpression(value ?? defaultLiteral, {
			propertyKey,
			propertySpec,
			suggestions: expressionSuggestions
		});
	};
	const bindLiteral = (variableId: string) => {
		if (variables === undefined || layerId === undefined || literalTarget === undefined) return;
		variables.bind(layerId, literalTarget, variableId);
	};
	const createAndBindLiteral = () => {
		if (
			variables === undefined ||
			layerId === undefined ||
			literalTarget === undefined ||
			bindableType === undefined
		) {
			return;
		}
		if (!canCreateVariableFromLiteral) return;
		variables.createAndBind(
			{
				name: propertyKey ?? label,
				type: bindableType,
				value: literalVariableSeed as StyleVariable['value']
			},
			layerId,
			literalTarget
		);
	};

	let actionsOpen = $state(false);
</script>

<!--
	Wraps a paint/layout property editor: literal values render the existing
	editor plus an "fx" button converting to an expression; expression values
	render the expression editor with a remove action resetting the property.
-->
{#snippet propertyActions()}
	{#if hasPropertyActions}
		<div class="flex size-6 shrink-0 items-center justify-center">
			<Popover.Root bind:open={actionsOpen}>
				<Popover.Trigger
					aria-label={`${label} の操作`}
					title={`${label} の操作`}
					class="flex size-6 items-center justify-center rounded-[5px] text-ink-3 opacity-0 transition-opacity group-hover/property-field:opacity-100 hover:bg-field hover:text-ink-1 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-accent data-[state=open]:bg-field data-[state=open]:text-ink-1 data-[state=open]:opacity-100"
				>
					<DotsThree size={15} weight="bold" aria-hidden="true" />
				</Popover.Trigger>
				<Popover.Portal>
					<Popover.Content
						class="z-50 w-[252px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-[10px] border border-hairline bg-white text-[11px] shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
						side="left"
						align="start"
						sideOffset={8}
						collisionPadding={8}
					>
						<div class="border-b border-hairline-soft px-3 py-2">
							<p class="truncate font-mono text-[10px] text-ink-2" title={label}>{label}</p>
						</div>
						<div class="flex flex-col p-1">
							{#if canShowHistory && layerId !== undefined && propertyKey !== undefined}
								<div class="flex h-7 items-center rounded-[6px] px-2 hover:bg-field">
									<span class="min-w-0 flex-1 truncate">履歴</span>
									<PropertyHistoryPopover
										{layerId}
										group={propertyGroup}
										key={propertyKey}
										{label}
										currentValue={value}
										defaultValue={styleDefaultValue}
										onRestore={(restoredValue) => onChange?.(restoredValue)}
									/>
								</div>
							{/if}
							{#if !isExpression(value) && literalBinding === undefined}
								{#if canBindLiteral && bindableType !== undefined}
									<div class="flex h-7 items-center rounded-[6px] px-2 hover:bg-field">
										<span class="min-w-0 flex-1 truncate">スタイル変数</span>
										<VariablePickerPopover
											type={bindableType}
											currentValue={literalVariableSeed}
											onPick={bindLiteral}
											onCreateFromValue={canCreateVariableFromLiteral
												? createAndBindLiteral
												: undefined}
										/>
									</div>
								{/if}
								{#if rampable}
									<Button
										class="flex h-7 w-full items-center gap-2 rounded-[6px] px-2 text-left hover:bg-field"
										onclick={(event) => {
											onChange?.(literalToZoomInterpolate(value ?? defaultLiteral));
											openFlyout(event.currentTarget);
											actionsOpen = false;
										}}
									>
										<ChartLine size={14} weight="regular" class="shrink-0" aria-hidden="true" />
										<span class="min-w-0 flex-1 truncate">ズーム補間</span>
									</Button>
								{/if}
								{#if showExpressionButton}
									<Button
										class="flex h-7 w-full items-center gap-2 rounded-[6px] px-2 text-left hover:bg-field"
										onclick={(event) => {
											onChange?.(convertLiteralToExpression());
											openFlyout(event.currentTarget);
											actionsOpen = false;
										}}
									>
										<FunctionIcon size={14} weight="regular" class="shrink-0" aria-hidden="true" />
										<span class="min-w-0 flex-1 truncate">式で編集</span>
									</Button>
								{/if}
							{/if}
							{#if onReset}
								<Button
									class="flex h-7 w-full items-center gap-2 rounded-[6px] px-2 text-left hover:bg-field"
									onclick={() => {
										onReset?.();
										actionsOpen = false;
									}}
								>
									<Minus size={14} weight="regular" class="shrink-0" aria-hidden="true" />
									<span class="min-w-0 flex-1 truncate">未設定に戻す</span>
								</Button>
							{/if}
						</div>
					</Popover.Content>
				</Popover.Portal>
			</Popover.Root>
		</div>
	{/if}
{/snippet}

{#if isExpression(value)}
	<div {...props} class={cn('flex min-w-0 flex-col', className)}>
		<div class="group/property-field flex h-[30px] min-w-0 items-center gap-2">
			<span
				class="w-28 shrink-0 truncate font-mono text-[10px] font-normal text-ink-2"
				title={label}
			>
				{label}
			</span>
			{#if canUseFlyout}
				<Button
					bind:ref={() => null, handleExpressionButtonRef}
					aria-label={`${label} の式を編集`}
					aria-pressed={isFlyoutOpen}
					class="flex h-6 min-w-24 flex-1 items-center gap-1.5 rounded-[5px] bg-field px-2 text-[10.5px] text-ink-1 hover:bg-field focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)] focus-visible:outline-none"
					onclick={(event) => toggleFlyout(event.currentTarget)}
				>
					<span
						class="font-[Georgia,serif] text-[11px] leading-none font-normal text-ink-3 italic"
						aria-hidden="true">ƒ</span
					>
					<span
						class="min-w-0 flex-1 truncate text-left font-mono"
						title={expressionDisplaySummary}
					>
						{expressionDisplaySummary}
					</span>
					<CaretDown size={10} weight="regular" class="shrink-0 text-ink-3" aria-hidden="true" />
				</Button>
			{/if}
			{@render propertyActions()}
		</div>
		{#if canUseFlyout}
			{#if hasCurvePreview}
				<CurveStopsEditor
					class="mt-1"
					value={value as ExpressionSpecification}
					{zoomRange}
					{propertySpec}
					{onChange}
				/>
			{/if}
		{:else}
			<ExpressionInputField
				class="font-mono text-[11px]"
				value={value as ExpressionSpecification}
				{propertySpec}
				{zoomRange}
				{onChange}
			/>
		{/if}
		{#if isInterpolateRoot && variables !== undefined && layerId !== undefined && interpolationTarget !== undefined && Array.isArray(value)}
			{#if interpolationBinding !== undefined}
				<div class="mt-1 flex h-6 items-center justify-between gap-2">
					<span class="shrink-0 font-mono text-[10px] font-normal text-ink-3">補間変数</span>
					<div class="flex min-w-0 justify-end">
						<VariableChip
							variable={interpolationBinding.variable}
							stale={interpolationBinding.stale}
							onDetach={() => variables.unbind(layerId, interpolationTarget)}
							onReapply={() => variables.reapply()}
						/>
					</div>
				</div>
			{/if}
		{/if}
		{#if propertyKey}
			<PropertyErrorMessage group={propertyGroup} property={propertyKey} />
		{/if}
	</div>
{:else}
	<div {...props} class={cn('flex min-w-0 flex-col', className)}>
		<div class="group/property-field flex h-[30px] min-w-0 flex-row items-center">
			<div class="min-w-[216px] flex-1" style="--field-label-width: 112px; --field-column-gap: 8px">
				{#if literalBinding !== undefined && layerId !== undefined && literalTarget !== undefined}
					<div class="flex min-w-0 items-center gap-2">
						<span
							class="w-28 shrink-0 truncate font-mono text-[10px] font-normal text-ink-2"
							title={label}>{label}</span
						>
						<div class="min-w-24 flex-1">
							<VariableChip
								variable={literalBinding.variable}
								stale={literalBinding.stale}
								onDetach={() => variables?.unbind(layerId, literalTarget)}
								onReapply={() => variables?.reapply()}
							/>
						</div>
					</div>
				{:else}
					{@render children()}
				{/if}
			</div>
			{@render propertyActions()}
		</div>
		{#if propertyKey}
			<PropertyErrorMessage group={propertyGroup} property={propertyKey} />
		{/if}
	</div>
{/if}
