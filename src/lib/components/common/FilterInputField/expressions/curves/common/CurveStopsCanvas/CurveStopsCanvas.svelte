<script lang="ts" module>
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

	export type CurveStopsCanvasProps = {
		value: ExpressionSpecification;
		onChange?: (value: ExpressionSpecification) => void;
		selectedStopIndex?: number | null;
		onSelectStop?: (index: number) => void;
		class?: string;
	};
</script>

<script lang="ts">
	import { CurvePreview } from '$lib/components/common/FilterInputField/expressions/common/CurvePreview';
	import type { CurveSamplingResult } from '$lib/components/common/FilterInputField/expressions/utils/curveSampling.ts';
	import { sampleCurveExpression } from '$lib/components/common/FilterInputField/expressions/utils/curveSampling.ts';
	import { replaceArgAt } from '$lib/components/common/FilterInputField/expressions/utils/expressionEdit.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	import {
		clampCurveInput,
		curveStopInputIndex,
		getCurveInputBounds,
		roundCurveOutput,
		type CurveInputBounds
	} from './curveStopsEditing.ts';

	type StopHandle = {
		stopIndex: number;
		inputIndex: number;
		outputIndex: number;
		input: number;
		output: number | null;
		bounds: CurveInputBounds | null;
		xPercent: number;
		yPercent: number;
		pointerDraggable: boolean;
	};

	type DragState = {
		pointerId: number;
		handle: StopHandle;
		domain: [number, number];
		outputRange: [number, number] | null;
		startExpression: ExpressionSpecification;
		moved: boolean;
	};

	let {
		value,
		onChange,
		selectedStopIndex = null,
		onSelectStop,
		class: className
	}: CurveStopsCanvasProps = $props();

	let overlayElement = $state<HTMLDivElement | null>(null);
	let draftExpression = $state.raw<ExpressionSpecification | null>(null);
	let dragState = $state.raw<DragState | null>(null);

	const displayExpression = $derived(draftExpression ?? value);
	const result = $derived(sampleCurveExpression(displayExpression, 64));

	const toPercent = (input: number, domain: [number, number]): number => {
		const span = domain[1] - domain[0] || 1;
		return ((input - domain[0]) / span) * 100;
	};
	const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));
	const getOutputRange = (sampling: CurveSamplingResult): [number, number] | null => {
		if (sampling.outputType !== 'number') return null;
		const outputs = sampling.samples.map(({ output }) => output as number);
		if (outputs.length === 0) return null;
		const min = Math.min(...outputs);
		const max = Math.max(...outputs);
		return max === min ? [min, min + 1] : [min, max];
	};
	const toYPercent = (output: number, range: [number, number]): number => {
		const span = range[1] - range[0] || 1;
		return 100 - ((output - range[0]) / span) * 100;
	};

	const outputRange = $derived(result ? getOutputRange(result) : null);
	const displayOutputRange = $derived(dragState?.outputRange ?? outputRange);
	const handles = $derived.by((): StopHandle[] => {
		if (!result) return [];
		const next: StopHandle[] = [];
		for (let stopIndex = 0; stopIndex < result.stops.length; stopIndex += 1) {
			const inputIndex = curveStopInputIndex(stopIndex);
			const outputIndex = inputIndex + 1;
			const input = displayExpression[inputIndex];
			if (typeof input !== 'number') continue;

			const outputArg = displayExpression[outputIndex];
			const output =
				result.outputType === 'number'
					? typeof outputArg === 'number'
						? outputArg
						: (result.evaluateAt?.(input) ?? null)
					: null;
			const bounds = getCurveInputBounds(displayExpression, stopIndex, result.domain);
			next.push({
				stopIndex,
				inputIndex,
				outputIndex,
				input,
				output,
				bounds,
				xPercent: clampPercent(toPercent(input, result.domain)),
				yPercent:
					output !== null && displayOutputRange
						? clampPercent(toYPercent(output, displayOutputRange))
						: 50,
				pointerDraggable:
					onChange !== undefined &&
					bounds !== null &&
					(result.outputType !== 'number' || typeof outputArg === 'number')
			});
		}
		return next;
	});
	const overlayHeightClass = $derived(
		result?.outputType === 'number' ? 'h-12' : result?.outputType === 'text' ? 'h-6' : 'h-4'
	);
	const attachOverlayElement = (element: HTMLDivElement) => {
		overlayElement = element;
		return () => {
			if (overlayElement === element) overlayElement = null;
		};
	};

	const expressionsEqual = (
		left: ExpressionSpecification,
		right: ExpressionSpecification
	): boolean => JSON.stringify(left) === JSON.stringify(right);

	const updateDraftFromPointer = (event: PointerEvent) => {
		if (!dragState || !dragState.handle.bounds || !overlayElement) return;
		const rect = overlayElement.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return;

		const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
		const rawInput = dragState.domain[0] + x * (dragState.domain[1] - dragState.domain[0]);
		let next = replaceArgAt(
			draftExpression ?? dragState.startExpression,
			dragState.handle.inputIndex,
			clampCurveInput(rawInput, dragState.handle.bounds)
		);

		if (dragState.outputRange) {
			const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
			const span = dragState.outputRange[1] - dragState.outputRange[0];
			const rawOutput = dragState.outputRange[1] - y * span;
			next = replaceArgAt(next, dragState.handle.outputIndex, roundCurveOutput(rawOutput, span));
		}
		draftExpression = next;
	};

	const startDrag = (
		event: PointerEvent & { currentTarget: HTMLDivElement },
		handle: StopHandle
	) => {
		onSelectStop?.(handle.stopIndex);
		event.currentTarget.focus({ preventScroll: true });
		if (
			!result ||
			!handle.pointerDraggable ||
			(event.pointerType === 'mouse' &&
				(event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey))
		) {
			return;
		}

		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);
		draftExpression = value;
		dragState = {
			pointerId: event.pointerId,
			handle,
			domain: [...result.domain],
			outputRange: result.outputType === 'number' && outputRange ? [...outputRange] : null,
			startExpression: value,
			moved: false
		};
	};

	const moveDrag = (event: PointerEvent) => {
		if (!dragState || event.pointerId !== dragState.pointerId) return;
		event.preventDefault();
		dragState = { ...dragState, moved: true };
		updateDraftFromPointer(event);
	};

	const endDrag = (event: PointerEvent & { currentTarget: HTMLDivElement }) => {
		if (!dragState || event.pointerId !== dragState.pointerId) return;
		const { moved, startExpression } = dragState;
		if (moved) updateDraftFromPointer(event);
		const next = draftExpression;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		dragState = null;
		draftExpression = null;
		if (moved && next && !expressionsEqual(next, startExpression)) onChange?.(next);
	};

	const cancelDrag = (event: PointerEvent & { currentTarget: HTMLDivElement }) => {
		if (!dragState || event.pointerId !== dragState.pointerId) return;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		dragState = null;
		draftExpression = null;
	};

	const adjustWithKeyboard = (event: KeyboardEvent, handle: StopHandle) => {
		const delta =
			event.key === 'ArrowLeft' || event.key === 'ArrowDown'
				? -0.1
				: event.key === 'ArrowRight' || event.key === 'ArrowUp'
					? 0.1
					: 0;
		if (delta === 0 || !onChange || !handle.bounds) return;
		event.preventDefault();
		onSelectStop?.(handle.stopIndex);
		const nextInput = clampCurveInput(handle.input + delta, handle.bounds);
		if (nextInput === handle.input) return;
		onChange(replaceArgAt(value, handle.inputIndex, nextInput));
	};
</script>

{#if result}
	<div class={cn('relative min-w-0', className)} data-curve-stops-canvas>
		<CurvePreview
			value={displayExpression}
			outputRange={dragState?.outputRange ?? undefined}
			class="pointer-events-none px-0"
		/>
		<div
			{@attach attachOverlayElement}
			class={cn('pointer-events-none absolute top-1 right-0 left-0', overlayHeightClass)}
		>
			{#each handles as handle (handle.stopIndex)}
				<div
					role="slider"
					tabindex="0"
					aria-label={`Stop ${handle.stopIndex + 1} input`}
					aria-orientation="horizontal"
					aria-valuemin={handle.bounds?.min ?? result.domain[0]}
					aria-valuemax={handle.bounds?.max ?? result.domain[1]}
					aria-valuenow={handle.input}
					aria-disabled={!onChange || !handle.bounds ? 'true' : undefined}
					aria-valuetext={handle.output === null
						? String(handle.input)
						: `${handle.input}, output ${handle.output}`}
					data-stop-index={handle.stopIndex}
					class={cn(
						'pointer-events-auto absolute flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none select-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
						handle.pointerDraggable
							? result.outputType === 'number'
								? 'cursor-move touch-none'
								: 'cursor-ew-resize touch-none'
							: 'cursor-not-allowed opacity-40',
						selectedStopIndex === handle.stopIndex && 'ring-2 ring-blue-500 ring-offset-1'
					)}
					style:left={`${handle.xPercent}%`}
					style:top={`${handle.yPercent}%`}
					title={handle.pointerDraggable
						? 'Drag to edit this stop'
						: 'Use the stop row or arrow keys to edit this input'}
					onfocus={() => onSelectStop?.(handle.stopIndex)}
					onkeydown={(event) => adjustWithKeyboard(event, handle)}
					onpointerdown={(event) => startDrag(event, handle)}
					onpointermove={moveDrag}
					onpointerup={endDrag}
					onpointercancel={cancelDrag}
				>
					<span
						aria-hidden="true"
						class={cn(
							'size-3 rounded-full border-2 border-white bg-blue-500 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]',
							selectedStopIndex === handle.stopIndex && 'bg-blue-600'
						)}
					></span>
				</div>
			{/each}
		</div>
	</div>
{/if}
