<script lang="ts" module>
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { StylePropertySpec } from '#lib/utils/layerSpec.ts';

	export type CurveStopsEditorProps = Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		children?: Snippet;
		value: ExpressionSpecification;
		zoomRange?: [number, number];
		propertySpec?: StylePropertySpec;
		onChange?: (value: ExpressionSpecification) => void;
	};
</script>

<script lang="ts">
	import type { InterpolationSpecification } from '@maplibre/maplibre-gl-style-spec';

	import { Button } from '#lib/components/common/Button';
	import { ExpressionAppendArgButton } from '#lib/components/common/FilterInputField/expressions/common/ExpressionAppendArgButton';
	import { ExpressionArgInputField } from '#lib/components/common/FilterInputField/expressions/common/ExpressionArgInputField';
	import { ExpressionOperatorSelect } from '#lib/components/common/FilterInputField/expressions/common/ExpressionOperatorSelect';
	import { CurveStopsCanvas } from '#lib/components/common/FilterInputField/expressions/curves/common/CurveStopsCanvas';
	import InterpolationsInputField from '#lib/components/common/FilterInputField/expressions/curves/interpolations/InterpolationsInputField.svelte';
	import { curveHasColorOutputs } from '#lib/components/common/FilterInputField/expressions/utils/curveSampling.ts';
	import {
		removeArgsOrCollapse,
		replaceArgAt
	} from '#lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
	import { useBackgroundMap } from '#lib/contexts/backgroundMap.svelte.ts';
	import { tryParseColor } from '#lib/utils/color.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		class: className,
		children,
		value: expression,
		zoomRange,
		propertySpec,
		onChange,
		...props
	}: CurveStopsEditorProps = $props();

	const backgroundMap = useBackgroundMap();
	let selectedStopIndex = $state<number | null>(null);
	let detailsOpen = $state(false);

	const isStep = $derived(expression[0] === 'step');
	const inputIndex = $derived(isStep ? 1 : 2);
	const inputExpression = $derived(expression[inputIndex]);
	const inputIsZoom = $derived(Array.isArray(inputExpression) && inputExpression[0] === 'zoom');
	const interpolation = $derived(
		isStep ? undefined : (expression[1] as InterpolationSpecification)
	);
	const stopStartIndexes = $derived.by(() => {
		const indexes: number[] = [];
		for (let index = 3; index < expression.length; index += 2) indexes.push(index);
		return indexes;
	});
	const outputLiteralType = $derived(
		expression[0] === 'interpolate-hcl' ||
			expression[0] === 'interpolate-lab' ||
			curveHasColorOutputs(expression)
			? ('color' as const)
			: undefined
	);
	const nearestZoomStop = $derived.by(() => {
		const currentZoom = backgroundMap?.zoom;
		if (!inputIsZoom || currentZoom === undefined) return null;
		let nearest: number | null = null;
		let distance = Number.POSITIVE_INFINITY;
		stopStartIndexes.forEach((startIndex, stopIndex) => {
			const input = expression[startIndex];
			if (typeof input !== 'number') return;
			const nextDistance = Math.abs(input - currentZoom);
			if (nextDistance < distance) {
				nearest = stopIndex;
				distance = nextDistance;
			}
		});
		return nearest;
	});
	const compactValue = (value: unknown): string => {
		if (typeof value === 'number') return Number.isInteger(value) ? String(value) : `${value}`;
		if (typeof value === 'string') return value;
		if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
		return JSON.stringify(value) ?? String(value);
	};
	const colorSummary = (value: unknown) => {
		if (typeof value !== 'string') return undefined;
		const color = tryParseColor(value);
		if (!color) return undefined;
		return {
			color: color.toString('css'),
			hex: color.toString('hex').toUpperCase(),
			alpha: Math.round(color.getChannelValue('alpha') * 100)
		};
	};
	const stopSummary = (stopStartIndex: number): string => {
		return `${inputIsZoom ? 'z' : ''}${compactValue(expression[stopStartIndex])} → ${compactValue(expression[stopStartIndex + 1])}`;
	};
	const removeStop = (stopStartIndex: number, stopIndex: number) => {
		if (!onChange) return;
		if (selectedStopIndex === stopIndex) selectedStopIndex = null;
		onChange(
			removeArgsOrCollapse(
				expression,
				stopStartIndex,
				2,
				isStep ? expression[2] : expression[stopStartIndex + 1],
				isStep ? 4 : undefined
			)
		);
	};
</script>

<div {...props} class={cn('min-w-0', className)}>
	<div class="relative rounded-[6px] border border-[#e9e9e9] bg-white px-[7px] pt-[7px] pb-[5px]">
		<Button
			class="absolute top-1 right-1 z-20 h-[18px] rounded-[4px] bg-white/90 px-1.5 text-[9.5px] text-ink-3 hover:bg-field hover:text-ink-1"
			aria-expanded={detailsOpen}
			onclick={() => (detailsOpen = !detailsOpen)}
		>
			詳細
		</Button>
		<CurveStopsCanvas
			value={expression}
			{zoomRange}
			{onChange}
			{selectedStopIndex}
			onSelectStop={(index) => (selectedStopIndex = index)}
		/>

		<div
			class={cn(
				'mt-[5px] flex min-w-0 gap-1',
				outputLiteralType === 'color' ? 'flex-wrap' : 'justify-between'
			)}
		>
			{#each stopStartIndexes as stopStartIndex, stopIndex (stopStartIndex)}
				{@const stopColor = colorSummary(expression[stopStartIndex + 1])}
				<Button
					class={cn(
						'inline-flex max-w-full min-w-0 items-center gap-1 overflow-hidden rounded-[4px] border px-1.5 py-0.5 font-mono text-[9.5px]',
						selectedStopIndex === stopIndex || nearestZoomStop === stopIndex
							? 'border-accent bg-accent-soft text-accent'
							: 'border-transparent bg-transparent text-ink-3 hover:bg-field hover:text-ink-1'
					)}
					aria-pressed={selectedStopIndex === stopIndex}
					title={stopSummary(stopStartIndex)}
					onclick={() => (selectedStopIndex = selectedStopIndex === stopIndex ? null : stopIndex)}
				>
					<span class="min-w-0 truncate">
						{inputIsZoom ? 'z' : ''}{compactValue(expression[stopStartIndex])} →
					</span>
					{#if stopColor}
						<span
							class="size-4 shrink-0 rounded-[4px] border border-black/5"
							style:background={stopColor.color}
						></span>
						<span class="min-w-0 truncate">{stopColor.hex}</span>
						<span class="shrink-0 text-ink-3">{stopColor.alpha}%</span>
					{:else}
						<span class="min-w-0 truncate">
							{compactValue(expression[stopStartIndex + 1])}
						</span>
					{/if}
				</Button>
			{/each}
		</div>

		{#if selectedStopIndex !== null}
			{@const selectedStartIndex = stopStartIndexes[selectedStopIndex]}
			{#if selectedStartIndex !== undefined}
				<div class="mt-1 flex min-h-6 min-w-0 items-center gap-1 rounded-[5px] bg-field p-0.5">
					<ExpressionArgInputField
						class="min-w-0 flex-1"
						parentValue={expression}
						index={selectedStartIndex}
						{onChange}
					/>
					<span class="text-[10px] text-ink-3">→</span>
					<ExpressionArgInputField
						class="min-w-0 flex-[2]"
						parentValue={expression}
						index={selectedStartIndex + 1}
						{onChange}
						{propertySpec}
						literalType={outputLiteralType}
						onRemove={onChange
							? () => removeStop(selectedStartIndex, selectedStopIndex ?? 0)
							: undefined}
						removeLabel="ストップを削除"
					/>
				</div>
			{/if}
		{/if}

		<ExpressionAppendArgButton
			value={expression}
			{onChange}
			label="ストップを追加"
			ariaLabel="ストップを追加"
			class="mt-1 h-5 justify-start px-0 text-[10px] font-normal text-ink-3 hover:bg-transparent hover:text-accent"
		/>

		{#if detailsOpen}
			<div class="mt-1.5 flex flex-col gap-1.5 border-l-2 border-hairline-soft pl-2">
				<div class="flex h-6 min-w-0 items-center justify-between gap-2">
					<span class="font-mono text-[10px] text-ink-2">式</span>
					<ExpressionOperatorSelect value={expression} {onChange} />
				</div>
				{#if interpolation}
					<div class="flex h-6 min-w-0 items-center justify-between gap-2">
						<span class="font-mono text-[10px] text-ink-2">補間</span>
						<InterpolationsInputField
							value={interpolation}
							onChange={onChange
								? (next) => onChange(replaceArgAt(expression, 1, next))
								: undefined}
						/>
					</div>
				{/if}
				<div class="flex h-6 min-w-0 items-center justify-between gap-2">
					<span class="font-mono text-[10px] text-ink-2">入力</span>
					<ExpressionArgInputField
						class="min-w-0 flex-1 justify-end"
						parentValue={expression}
						index={inputIndex}
						{onChange}
					/>
				</div>
			</div>
		{/if}
	</div>
	{@render children?.()}
</div>
