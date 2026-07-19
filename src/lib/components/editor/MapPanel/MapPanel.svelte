<script lang="ts">
	import 'maplibre-gl/dist/maplibre-gl.css';
	import type {
		LayerSpecification,
		Map as MaplibreMap,
		MapGeoJSONFeature,
		MapMouseEvent,
		StyleSpecification
	} from 'maplibre-gl';
	import { MapLibre } from 'svelte-maplibre-gl';

	import { Button } from '$lib/components/common/Button';
	import { useBackgroundMap } from '$lib/contexts/backgroundMap.svelte';
	import { createDisplayStyle } from '$lib/fonts/displayStyle.ts';
	import { getLayerGroup } from '$lib/utils/layerGroup.ts';
	import { cn } from '$lib/utils/tailwindUtil';

	type LayerPickCandidate = {
		layer: LayerSpecification;
		featureCount: number;
	};

	let {
		class: className,
		mapStyle,
		hasLocalFonts = false,
		onClickLayer
	}: {
		class?: string;
		mapStyle: StyleSpecification;
		hasLocalFonts?: boolean;
		onClickLayer?: (layer: LayerSpecification) => void;
	} = $props();

	const backgroundMap = useBackgroundMap();

	let map = $state<MaplibreMap | undefined>(undefined);
	let zoom = $state(15);
	let pitch = $state(0);
	let bearing = $state(0);
	let cursor = $state('');
	let layerPicker = $state<{
		x: number;
		y: number;
		candidates: LayerPickCandidate[];
	} | null>(null);

	// mapStyle は編集のたびルート参照が差し替わる。フレームに 1 回だけ snapshot し、
	// raw state として MapLibre に渡して大きなスタイルの再 proxy 化を避ける。
	// 初期描画用の値であり、以後の更新は下の effect で反映する。
	// svelte-ignore state_referenced_locally
	let style = $state.raw<StyleSpecification>(
		createDisplayStyle($state.snapshot(mapStyle as object) as StyleSpecification, hasLocalFonts)
	);
	$effect(() => {
		void mapStyle;
		void hasLocalFonts;
		const id = requestAnimationFrame(() => {
			style = createDisplayStyle(
				$state.snapshot(mapStyle as object) as StyleSpecification,
				hasLocalFonts
			);
		});
		return () => cancelAnimationFrame(id);
	});

	const resolveFeatureLayers = (features: MapGeoJSONFeature[]): LayerPickCandidate[] => {
		const candidates: LayerPickCandidate[] = [];

		for (const feature of features) {
			const layer = mapStyle.layers.find((currentLayer) => currentLayer.id === feature.layer.id);
			if (!layer) continue;

			const existing = candidates.find((candidate) => candidate.layer.id === layer.id);
			if (existing) {
				existing.featureCount += 1;
			} else {
				candidates.push({ layer, featureCount: 1 });
			}
		}

		return candidates;
	};

	const queryEventLayers = (event: MapMouseEvent): LayerPickCandidate[] => {
		return map ? resolveFeatureLayers(map.queryRenderedFeatures(event.point)) : [];
	};

	const handleMapClick = (event: MapMouseEvent) => {
		const candidates = queryEventLayers(event);
		if (candidates.length === 0) {
			layerPicker = null;
			return;
		}
		if (candidates.length === 1) {
			layerPicker = null;
			onClickLayer?.(candidates[0].layer);
			return;
		}
		layerPicker = {
			x: event.point.x,
			y: event.point.y,
			candidates
		};
	};

	const handleMapMouseMove = (event: MapMouseEvent) => {
		cursor = queryEventLayers(event).length > 0 ? 'pointer' : '';
	};

	const handleMapMouseOut = () => {
		cursor = '';
	};

	const selectLayer = (layer: LayerSpecification) => {
		layerPicker = null;
		onClickLayer?.(layer);
	};

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

<div class={cn('relative h-auto w-full', className)}>
	<MapLibre
		bind:map
		bind:zoom
		bind:pitch
		bind:bearing
		class="h-full w-full"
		{style}
		{cursor}
		center={{ lng: 139.767, lat: 35.681 }}
		maplibreLogo={false}
		attributionControl={false}
		localIdeographFontFamily={false}
		autoloadGlobalCss={false}
		onclick={handleMapClick}
		onmousemove={handleMapMouseMove}
		onmouseout={handleMapMouseOut}
	/>

	{#if layerPicker}
		<div
			class="pointer-events-auto absolute z-20 w-64 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xl shadow-gray-950/20"
			style={`left: clamp(0.75rem, ${layerPicker.x}px, calc(100% - 17rem)); top: clamp(0.75rem, ${layerPicker.y + 12}px, calc(100% - 18rem));`}
		>
			<div
				class="flex items-start justify-between gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2"
			>
				<div class="min-w-0">
					<p class="font-montserrat text-sm font-semibold text-gray-900">Select Layer</p>
					<p class="text-xs font-medium text-gray-500">
						{layerPicker.candidates.length} layers hit
					</p>
				</div>
				<Button
					class="rounded-md px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-200"
					aria-label="Close layer picker"
					onclick={() => (layerPicker = null)}
				>
					x
				</Button>
			</div>
			<div class="max-h-64 overflow-auto p-1">
				{#each layerPicker.candidates as { layer, featureCount } (layer.id)}
					<Button
						class="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-gray-100"
						onclick={() => selectLayer(layer)}
					>
						<span class="min-w-0">
							<span class="block truncate text-sm font-semibold text-gray-800">{layer.id}</span>
							<span class="block truncate text-xs text-gray-500">
								{getLayerGroup(layer) ?? 'ungrouped'} / {layer.type}
							</span>
						</span>
						{#if featureCount > 1}
							<span
								class="shrink-0 rounded-sm bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500"
							>
								{featureCount}
							</span>
						{/if}
					</Button>
				{/each}
			</div>
		</div>
	{/if}
</div>
