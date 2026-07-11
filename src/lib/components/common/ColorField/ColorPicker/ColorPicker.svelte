<script lang="ts">
	import { Button } from '$lib/components/common/Button';
	import { ColorArea } from '$lib/components/common/ColorField/ColorPicker/ColorArea';
	import { ColorChannelField } from '$lib/components/common/ColorField/ColorPicker/ColorChannelField';
	import { ColorChannelSlider } from '$lib/components/common/ColorField/ColorPicker/ColorChannelSlider';
	import { EyeDropperButton } from '$lib/components/common/ColorField/ColorPicker/EyeDropperButton';
	import { ColorSwatch } from '$lib/components/common/ColorField/ColorSwatch';
	import { Popover } from '$lib/components/common/Popover';
	import { Select } from '$lib/components/common/Select';
	import { CloseIcon } from '$lib/components/icons';
	import type { Color } from '$lib/utils/color';
	import { cn } from '$lib/utils/tailwindUtil';

	let {
		class: className,
		value,
		onChange,
		'aria-label': ariaLabel
	}: {
		class?: string;
		value?: Color | null;
		onChange?: (color: Color) => void;
		'aria-label'?: string;
	} = $props();

	let open = $state(false);
	let colorFormat = $state<'Hex' | 'RGB' | 'HSL' | 'HSB'>('RGB');

	const handleChange = (color: Color | null) => {
		if (color) {
			onChange?.(color);
		}
	};
</script>

<div class={cn('h-4 w-4', className)}>
	<Popover
		bind:open
		aria-label={ariaLabel}
		triggerClass="h-full w-full border border-gray-300 transition-colors hover:bg-gray-100 active:bg-gray-300 focus:outline-0"
	>
		{#snippet trigger()}
			<ColorSwatch color={value ? value : undefined} class="block h-full w-full" />
		{/snippet}
		<div
			class="flex w-64 max-w-[calc(100vw-1rem)] flex-col border border-gray-300 bg-white shadow-xl"
		>
			<div class="flex flex-row items-center justify-end border-b border-b-gray-300 p-1">
				<Button
					class="rounded p-1"
					onclick={() => {
						open = false;
					}}
				>
					<CloseIcon class="h-4 w-4" />
				</Button>
			</div>
			<ColorArea
				value={value ? value.toFormat(colorFormat === 'HSL' ? 'hsl' : 'hsb') : undefined}
				xChannel="saturation"
				yChannel={colorFormat === 'HSL' ? 'lightness' : 'brightness'}
				onChange={handleChange}
			/>
			<div class="flex flex-row items-center gap-3 px-3 pt-4 pb-2">
				<EyeDropperButton onChange={handleChange} class="h-7 min-w-7 rounded p-1" />
				<div class="flex w-full flex-col gap-3">
					<ColorChannelSlider
						label="Hue"
						channel="hue"
						value={value ? value.toFormat('hsl') : undefined}
						onChange={handleChange}
					/>
					<ColorChannelSlider
						label="Alpha"
						channel="alpha"
						value={value ? value.toFormat('rgba') : undefined}
						onChange={handleChange}
					/>
				</div>
			</div>
			<div class="flex min-w-0 flex-row px-3 pt-2 pb-4">
				<Select
					class="w-14 shrink-0 text-xs"
					triggerClass="h-8 w-full bg-gray-100 hover:bg-gray-200 rounded-none"
					aria-label="Color format"
					items={[
						// { value: 'Hex', label: 'Hex' },
						{ value: 'RGB', label: 'RGB' },
						{ value: 'HSL', label: 'HSL' },
						{ value: 'HSB', label: 'HSB' }
					]}
					value={colorFormat}
					onValueChange={(value) => {
						colorFormat = value as 'Hex' | 'RGB' | 'HSL' | 'HSB';
					}}
				/>
				{#if colorFormat === 'RGB'}
					<div class="flex min-w-0 flex-1 flex-row">
						<ColorChannelField
							class="h-8 min-w-0 flex-1"
							channel="red"
							value={value?.toFormat('rgb')}
							onChange={handleChange}
						/>
						<ColorChannelField
							class="h-8 min-w-0 flex-1"
							channel="green"
							value={value?.toFormat('rgb')}
							onChange={handleChange}
						/>
						<ColorChannelField
							class="h-8 min-w-0 flex-1"
							channel="blue"
							value={value?.toFormat('rgb')}
							onChange={handleChange}
						/>
					</div>
				{/if}
				{#if colorFormat === 'HSL'}
					<div class="flex min-w-0 flex-1 flex-row">
						<ColorChannelField
							class="h-8 min-w-0 flex-1"
							channel="hue"
							value={value?.toFormat('hsl')}
							onChange={handleChange}
						/>
						<ColorChannelField
							class="h-8 min-w-0 flex-1"
							channel="saturation"
							value={value?.toFormat('hsl')}
							onChange={handleChange}
						/>
						<ColorChannelField
							class="h-8 min-w-0 flex-1"
							channel="lightness"
							value={value?.toFormat('hsl')}
							onChange={handleChange}
						/>
					</div>
				{/if}
				{#if colorFormat === 'HSB'}
					<div class="flex min-w-0 flex-1 flex-row">
						<ColorChannelField
							class="h-8 min-w-0 flex-1"
							channel="hue"
							value={value?.toFormat('hsb')}
							onChange={handleChange}
						/>
						<ColorChannelField
							class="h-8 min-w-0 flex-1"
							channel="saturation"
							value={value?.toFormat('hsb')}
							onChange={handleChange}
						/>
						<ColorChannelField
							class="h-8 min-w-0 flex-1"
							channel="brightness"
							value={value?.toFormat('hsb')}
							onChange={handleChange}
						/>
					</div>
				{/if}
				<ColorChannelField
					class="h-8 w-12 shrink-0"
					channel="alpha"
					value={value?.toFormat('rgb')}
					onChange={handleChange}
				/>
			</div>
		</div>
	</Popover>
</div>
