<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { ZoomLevelControlButton } from '$lib/components/editor/ControlPanel/ZoomLevelControl/ZoomLevelControlButton';
	import { CompassIcon, MinusIcon, PlusIcon } from '$lib/components/icons';
	import { useBackgroundMap } from '$lib/contexts/backgroundMap.svelte';
	import { cn } from '$lib/utils/tailwindUtil';

	let { class: className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'children'> = $props();

	const backgroundMap = useBackgroundMap();
	const zoomLevel = $derived(backgroundMap.zoom?.toFixed(2));
	const isMaxZoom = $derived(zoomLevel === backgroundMap.map?.getMaxZoom().toFixed(2));
	const isMinZoom = $derived(zoomLevel === backgroundMap.map?.getMinZoom().toFixed(2));
	const handleZoomIn = () => {
		if (isMaxZoom) return;
		backgroundMap.map?.zoomIn();
	};
	const handleZoomOut = () => {
		if (isMinZoom) return;
		backgroundMap.map?.zoomOut();
	};
	const handleResetNorthPitch = () => {
		backgroundMap.map?.resetNorthPitch();
	};
	const rotateCompassArrow = $derived.by(() => {
		if (!backgroundMap.map) return '';
		const pitch = backgroundMap.pitch;
		const bearing = backgroundMap.bearing;
		return `scale(${1 / Math.cos(pitch * (Math.PI / 180)) ** 0.5}) rotateX(${pitch}deg) rotateZ(${bearing}deg)`;
	});
</script>

<div {...props} class={cn('pointer-events-auto flex flex-col', className)}>
	<ZoomLevelControlButton
		class="rounded-b-none border-b-0"
		aria-label="Zoom In"
		onclick={handleZoomIn}
		disabled={isMaxZoom}
	>
		<PlusIcon />
	</ZoomLevelControlButton>
	<ZoomLevelControlButton
		class="rounded-none border-b-0"
		aria-label="Zoom Out"
		onclick={handleZoomOut}
		disabled={isMinZoom}
	>
		<MinusIcon />
	</ZoomLevelControlButton>
	<ZoomLevelControlButton
		class="rounded-t-none"
		aria-label="Reset North Pitch"
		onclick={handleResetNorthPitch}
		disabled={isMinZoom}
	>
		<CompassIcon style={`transform: ${rotateCompassArrow}`} />
	</ZoomLevelControlButton>
</div>
