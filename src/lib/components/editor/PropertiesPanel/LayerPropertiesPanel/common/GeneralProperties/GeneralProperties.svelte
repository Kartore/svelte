<script lang="ts">
	import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { NumberField } from '#lib/components/common/NumberField';
	import { RangeSlider } from '#lib/components/common/RangeSlider';
	import type { onChangeType } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		layer,
		onChange,
		children,
		class: className,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: LayerSpecification;
		onChange?: onChangeType;
		children?: Snippet;
	} = $props();

	const ZOOM_STEP = 0.1;
	const ZOOM_STEPS = Array.from({ length: 241 }, (_, index) => index * ZOOM_STEP);
	const minzoom = $derived(layer.minzoom ?? 0);
	const maxzoom = $derived(layer.maxzoom ?? 24);
	// Bits UI normalizes values that are not in the step list on mount.
	// Keep the current values in the list so opening a style never edits it.
	const zoomSteps = $derived([...new Set([...ZOOM_STEPS, minzoom, maxzoom])].sort((a, b) => a - b));
	const updateMinzoom = (value: number) => {
		const next = Math.min(value, maxzoom);
		onChange?.(layer, undefined, 'minzoom', next === 0 ? undefined : next);
	};
	const updateMaxzoom = (value: number) => {
		const next = Math.max(value, minzoom);
		onChange?.(layer, undefined, 'maxzoom', next === 24 ? undefined : next);
	};
</script>

<div {...props} class={cn('border-b border-hairline-soft px-4 pt-1.5 pb-2.5', className)}>
	<h3 class="flex h-7 items-center text-[11px] font-semibold text-ink-1">ズーム範囲</h3>
	<div class="flex h-[30px] items-center gap-2">
		<NumberField
			class="w-10 shrink-0 [&>div]:w-full"
			aria-label="最小ズーム"
			value={minzoom}
			minValue={0}
			maxValue={maxzoom}
			step={ZOOM_STEP}
			onValueChange={updateMinzoom}
		/>
		<RangeSlider
			class="min-w-0 flex-1 [&_[data-slider-range]]:bg-accent"
			value={[minzoom, maxzoom]}
			minValue={0}
			maxValue={24}
			step={zoomSteps}
			sliderThumbLabel={['最小ズーム', '最大ズーム']}
			onValueChange={([min, max]) => {
				updateMinzoom(min);
				updateMaxzoom(max);
			}}
		/>
		<NumberField
			class="w-10 shrink-0 [&>div]:w-full"
			aria-label="最大ズーム"
			value={maxzoom}
			minValue={minzoom}
			maxValue={24}
			step={ZOOM_STEP}
			onValueChange={updateMaxzoom}
		/>
	</div>
	{@render children?.()}
</div>
