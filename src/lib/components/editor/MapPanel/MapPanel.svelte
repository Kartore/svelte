<script lang="ts">
	import 'maplibre-gl/dist/maplibre-gl.css';
	import type { Map as MaplibreMap, StyleSpecification } from 'maplibre-gl';
	import { MapLibre } from 'svelte-maplibre-gl';

	import { useBackgroundMap } from '$lib/contexts/backgroundMap.svelte';
	import { cn } from '$lib/utils/tailwindUtil';

	let {
		class: className,
		mapStyle
	}: {
		class?: string;
		mapStyle: StyleSpecification;
	} = $props();

	const backgroundMap = useBackgroundMap();

	let map = $state<MaplibreMap | undefined>(undefined);
	let zoom = $state(15);
	let pitch = $state(0);
	let bearing = $state(0);

	// mapStyle is a deep $state proxy; take a snapshot so any deep edit
	// produces a new object and is reactively applied to the map.
	// (StyleSpecification は再帰 union のため Snapshot<T> の型展開を避けて widening する)
	const style = $derived($state.snapshot(mapStyle as object) as StyleSpecification);

	$effect(() => {
		backgroundMap.map = map ?? null;
		return () => {
			backgroundMap.map = null;
		};
	});
	$effect(() => {
		backgroundMap.zoom = zoom;
	});
	$effect(() => {
		backgroundMap.pitch = pitch;
	});
	$effect(() => {
		backgroundMap.bearing = bearing;
	});
</script>

<MapLibre
	bind:map
	bind:zoom
	bind:pitch
	bind:bearing
	class={cn('h-auto w-full', className)}
	{style}
	center={{ lng: 139.767, lat: 35.681 }}
	maplibreLogo={false}
	attributionControl={false}
	autoloadGlobalCss={false}
/>
