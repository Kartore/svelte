<script lang="ts" module>
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

	export type CurvePreviewProps = {
		value: ExpressionSpecification;
		class?: string;
	};
</script>

<script lang="ts">
	import type { CurveSamplingResult } from '$lib/components/common/FilterInputField/expressions/utils/curveSampling.ts';
	import { sampleCurveExpression } from '$lib/components/common/FilterInputField/expressions/utils/curveSampling.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let { value, class: className }: CurvePreviewProps = $props();

	const toPercent = (x: number, domain: [number, number]): number => {
		const span = domain[1] - domain[0] || 1;
		return ((x - domain[0]) / span) * 100;
	};

	const formatNumber = (value: number): string => {
		return Number.isInteger(value) ? String(value) : value.toFixed(2);
	};

	const result = $derived(sampleCurveExpression(value));
</script>

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
	</div>
{/snippet}

{#snippet curveGraphPreview(result: CurveSamplingResult)}
	{@const outputs = result.samples.map((sample) => sample.output as number)}
	{@const minOutput = Math.min(...outputs)}
	{@const maxOutput = Math.max(...outputs)}
	{@const outputSpan = maxOutput - minOutput || 1}
	{@const points = result.samples
		.map((sample) => {
			const x = toPercent(sample.x, result.domain);
			const y = 100 - (((sample.output as number) - minOutput) / outputSpan) * 100;
			return `${x.toFixed(2)},${y.toFixed(2)}`;
		})
		.join(' ')}
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
		</div>
		<div class="flex flex-row justify-between font-mono text-[10px] text-gray-400">
			<span
				>{`${formatNumber(result.domain[0])} → ${formatNumber(minOutput)}..${formatNumber(maxOutput)}`}</span
			>
			<span>{formatNumber(result.domain[1])}</span>
		</div>
	</div>
{/snippet}

<!--
	Renders a visual preview for interpolate/step expressions: a gradient bar
	for color outputs, a small line graph for numeric outputs. Hidden for
	anything that cannot be sampled (mid-edit or non-curve expressions).
-->
{#if result}
	<div class={cn('w-full min-w-48 px-0.5 py-1', className)}>
		{#if result.outputType === 'color'}
			{@render gradientPreview(result)}
		{:else}
			{@render curveGraphPreview(result)}
		{/if}
	</div>
{/if}
