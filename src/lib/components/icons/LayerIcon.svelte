<script lang="ts">
	import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
	import {
		Checkerboard,
		Circle,
		Cube,
		Fire,
		LineSegment,
		Mountains,
		Square,
		SquareHalf,
		StackSimple,
		TextT,
		Waveform
	} from 'phosphor-svelte';
	import type { ComponentProps } from 'svelte';

	let {
		type,
		...props
	}: ComponentProps<typeof StackSimple> & {
		type: LayerSpecification['type'];
	} = $props();
</script>

{#if type === 'line'}
	<LineSegment {...props} color="currentColor" weight="regular" data-layer-type={type} />
{:else if type === 'fill'}
	<Square {...props} color="currentColor" weight="regular" data-layer-type={type} />
{:else if type === 'symbol'}
	<TextT {...props} color="currentColor" weight="regular" data-layer-type={type} />
{:else if type === 'circle'}
	<Circle {...props} color="currentColor" weight="regular" data-layer-type={type} />
{:else if type === 'raster'}
	<Checkerboard {...props} color="currentColor" weight="regular" data-layer-type={type} />
{:else if type === 'background'}
	<SquareHalf {...props} color="currentColor" weight="regular" data-layer-type={type} />
{:else if type === 'heatmap'}
	<Fire {...props} color="currentColor" weight="regular" data-layer-type={type} />
{:else if type === 'fill-extrusion'}
	<Cube {...props} color="currentColor" weight="regular" data-layer-type={type} />
{:else if type === 'hillshade'}
	<Mountains {...props} color="currentColor" weight="regular" data-layer-type={type} />
{:else if type === 'color-relief'}
	<Waveform {...props} color="currentColor" weight="regular" data-layer-type={type} />
{:else}
	<StackSimple {...props} color="currentColor" weight="regular" data-layer-type={type} />
{/if}
