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
		class={cn('relative mt-2 flex h-0.5 w-full rounded-full bg-gray-300', disabled && 'opacity-60')}
	>
		{#snippet children({ thumbItems })}
			<Slider.Range class="absolute h-0.5 bg-gray-500" />
			{#each thumbItems as { index } (index)}
				<Slider.Thumb
					{index}
					aria-label={sliderThumbLabel?.[index]}
					class="mt-[1px] size-3 rounded-full border border-gray-500 bg-white"
				/>
			{/each}
		{/snippet}
	</Slider.Root>
</div>
