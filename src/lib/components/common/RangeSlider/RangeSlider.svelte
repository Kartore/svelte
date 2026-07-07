<script lang="ts">
	import { NumberFormatter, type NumberFormatOptions } from '@internationalized/number';
	import { Slider } from 'bits-ui';

	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label,
		value = $bindable([0, 1]),
		onValueChange,
		minValue = 0,
		maxValue = 100,
		step = 1,
		formatOptions,
		sliderThumbLabel,
		disabled
	}: {
		class?: string;
		label?: string;
		value?: number[];
		onValueChange?: (value: number[]) => void;
		minValue?: number;
		maxValue?: number;
		step?: number;
		formatOptions?: NumberFormatOptions;
		sliderThumbLabel?: [string, string];
		disabled?: boolean;
	} = $props();

	const formatter = $derived(new NumberFormatter('en-US', formatOptions));
</script>

<div class={cn('h-auto w-full', className)}>
	{#if label}
		<div class="flex items-center justify-between">
			<span class="text-sm font-semibold text-gray-600">{label}</span>
			<output class="text-sm font-semibold text-gray-800">
				{`${formatter.format(value[0])} - ${formatter.format(value[1])}`}
			</output>
		</div>
	{/if}

	<Slider.Root
		type="multiple"
		bind:value
		{onValueChange}
		min={minValue}
		max={maxValue}
		{step}
		{disabled}
		class={cn(
			'relative flex h-4 w-full touch-none items-center select-none',
			disabled && 'opacity-60'
		)}
	>
		{#snippet children({ thumbItems })}
			<span class="relative h-1 w-full grow overflow-hidden rounded-full bg-gray-300">
				<Slider.Range class="absolute h-full bg-gray-500" />
			</span>
			{#each thumbItems as { index } (index)}
				<Slider.Thumb
					{index}
					aria-label={sliderThumbLabel?.[index]}
					class="block size-3.5 rounded-full border border-gray-500 bg-white shadow-sm transition-colors hover:border-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:outline-none"
				/>
			{/each}
		{/snippet}
	</Slider.Root>
</div>
