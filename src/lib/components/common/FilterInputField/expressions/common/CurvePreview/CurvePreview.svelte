<script lang="ts" module>
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

	export type CurvePreviewProps = {
		value: ExpressionSpecification;
		/** zoom curve のドメインをレイヤーの表示範囲に合わせる */
		zoomRange?: [number, number];
		/** 編集中も数値グラフの縦軸を固定するための表示範囲 */
		outputRange?: [number, number];
		class?: string;
	};
</script>

<script lang="ts">
	import type { CurveSamplingResult } from '$lib/components/common/FilterInputField/expressions/utils/curveSampling.ts';
	import { sampleCurveExpression } from '$lib/components/common/FilterInputField/expressions/utils/curveSampling.ts';
	import { useBackgroundMap } from '$lib/contexts/backgroundMap.svelte.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let { value, zoomRange, outputRange, class: className }: CurvePreviewProps = $props();

	const backgroundMap = useBackgroundMap();

	const toPercent = (x: number, domain: [number, number]): number => {
		const span = domain[1] - domain[0] || 1;
		return ((x - domain[0]) / span) * 100;
	};

	const formatNumber = (value: number): string => {
		return Number.isInteger(value) ? String(value) : value.toFixed(2);
	};

	const result = $derived(sampleCurveExpression(value, 64, zoomRange));

	// 現在ズームのマーカー位置 (%)。zoom 入力の curve でのみ表示し、
	// domain 外では端に張り付けて半透明にする
	const zoomMarker = $derived.by(() => {
		if (!result?.inputIsZoom) return null;
		const zoom = backgroundMap?.zoom;
		if (zoom === undefined) return null;
		const percent = toPercent(zoom, result.domain);
		return {
			zoom,
			percent: Math.min(100, Math.max(0, percent)),
			outOfDomain: percent < 0 || percent > 100
		};
	});
</script>

{#snippet markerLine(marker: { percent: number; outOfDomain: boolean; zoom: number })}
	<div
		class={cn(
			'pointer-events-none absolute top-0 h-full w-px -translate-x-1/2 bg-gray-900/80',
			marker.outOfDomain && 'opacity-30'
		)}
		style:left={`${marker.percent}%`}
		title={`current zoom ${formatNumber(marker.zoom)}`}
	></div>
{/snippet}

{#snippet markerDot(marker: { percent: number; outOfDomain: boolean; zoom: number }, top: string)}
	<div
		class={cn(
			'pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gray-900 bg-white shadow-sm',
			marker.outOfDomain && 'opacity-30'
		)}
		style:left={`${marker.percent}%`}
		style:top
		title={`current zoom ${formatNumber(marker.zoom)}`}
	></div>
{/snippet}

{#snippet gradientPreview(result: CurveSamplingResult)}
	{@const gradient = `linear-gradient(to right, ${result.samples
		.map((sample) => `${sample.output} ${toPercent(sample.x, result.domain).toFixed(2)}%`)
		.join(', ')})`}
	<div class="relative h-4 w-full overflow-hidden rounded" style:background={gradient}>
		{#each result.stops as stop, index (index)}
			<div
				class="absolute top-0 h-full w-px bg-white/70"
				style:left={`${toPercent(stop, result.domain)}%`}
			></div>
		{/each}
		{#if zoomMarker}
			{@render markerLine(zoomMarker)}
			{@render markerDot(zoomMarker, '50%')}
		{/if}
	</div>
{/snippet}

{#snippet curveGraphPreview(result: CurveSamplingResult)}
	{@const outputs = result.samples.map((sample) => sample.output as number)}
	{@const minOutput = outputRange?.[0] ?? Math.min(...outputs)}
	{@const maxOutput = outputRange?.[1] ?? Math.max(...outputs)}
	{@const outputSpan = maxOutput - minOutput || 1}
	{@const toYPercent = (output: number) => 100 - ((output - minOutput) / outputSpan) * 100}
	{@const points = result.samples
		.map((sample) => {
			const x = toPercent(sample.x, result.domain);
			const y = toYPercent(sample.output as number);
			return `${x.toFixed(2)},${y.toFixed(2)}`;
		})
		.join(' ')}
	{@const markerOutput = (() => {
		if (!zoomMarker) return null;
		if (result.evaluateAt) return result.evaluateAt(zoomMarker.zoom);
		return null;
	})()}
	<div class="w-full">
		<div class="relative h-12 w-full overflow-hidden rounded bg-gray-100">
			<svg
				aria-hidden="true"
				class="h-full w-full"
				viewBox="0 0 100 100"
				preserveAspectRatio="none"
			>
				<polyline
					{points}
					fill="none"
					stroke="currentColor"
					stroke-width={2}
					vector-effect="non-scaling-stroke"
					class="text-blue-500"
				/>
				{#each result.stops as stop, index (index)}
					<line
						x1={toPercent(stop, result.domain)}
						x2={toPercent(stop, result.domain)}
						y1={0}
						y2={100}
						stroke="currentColor"
						stroke-width={1}
						vector-effect="non-scaling-stroke"
						class="text-gray-300"
					/>
				{/each}
			</svg>
			{#if zoomMarker && markerOutput !== null}
				{@render markerLine(zoomMarker)}
				{@render markerDot(zoomMarker, `${toYPercent(markerOutput)}%`)}
			{/if}
		</div>
		<div class="flex flex-row justify-between font-mono text-[10px] text-gray-400">
			<span
				>{`${formatNumber(result.domain[0])} → ${formatNumber(minOutput)}..${formatNumber(maxOutput)}`}</span
			>
			{#if zoomMarker && markerOutput !== null}
				<span class="text-gray-600"
					>{`z${formatNumber(zoomMarker.zoom)}: ${formatNumber(markerOutput)}`}</span
				>
			{/if}
			<span>{formatNumber(result.domain[1])}</span>
		</div>
	</div>
{/snippet}

{#snippet textSegmentsPreview(result: CurveSamplingResult)}
	{@const labels = result.textOutputs ?? []}
	{@const edges = [result.domain[0], ...result.stops, result.domain[1]]}
	<div class="w-full">
		<div
			class="relative flex h-6 w-full flex-row overflow-hidden rounded bg-gray-100 font-mono text-[10px] text-gray-600"
		>
			{#each labels as label, index (index)}
				{@const width =
					toPercent(edges[index + 1], result.domain) - toPercent(edges[index], result.domain)}
				<div
					class="flex min-w-0 items-center justify-center border-r border-white odd:bg-gray-200/70 last:border-r-0"
					style:width={`${width}%`}
					title={label}
				>
					<span class="truncate px-1">{label}</span>
				</div>
			{/each}
			{#if zoomMarker}
				{@render markerLine(zoomMarker)}
			{/if}
		</div>
		<div class="flex flex-row justify-between font-mono text-[10px] text-gray-400">
			<span>{formatNumber(result.domain[0])}</span>
			<span>{formatNumber(result.domain[1])}</span>
		</div>
	</div>
{/snippet}

<!--
	Renders a visual preview for interpolate/step expressions: a gradient bar
	for color outputs, a small line graph for numeric outputs, a labelled
	segment bar for text (step) outputs. Curves driven by ['zoom'] overlay a
	marker at the map's current zoom level. Hidden for anything that cannot be
	sampled (mid-edit or non-curve expressions).
-->
{#if result}
	<div class={cn('w-full min-w-48 px-0.5 py-1', className)}>
		{#if result.outputType === 'color'}
			{@render gradientPreview(result)}
		{:else if result.outputType === 'text'}
			{@render textSegmentsPreview(result)}
		{:else}
			{@render curveGraphPreview(result)}
		{/if}
	</div>
{/if}
