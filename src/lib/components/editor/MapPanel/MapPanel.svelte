<script lang="ts">
	import 'maplibre-gl/dist/maplibre-gl.css';
	import type {
		LayerSpecification,
		Map as MaplibreMap,
		MapGeoJSONFeature,
		MapMouseEvent,
		StyleSpecification
	} from 'maplibre-gl';
	import { X } from 'phosphor-svelte';
	import { onDestroy, onMount } from 'svelte';
	import { fromAction } from 'svelte/attachments';
	import { MapLibre } from 'svelte-maplibre-gl';

	import { Button } from '#lib/components/common/Button';
	import {
		createFeatureHighlightFilter,
		createInspectHighlightLayer,
		dedupeInspectedFeatures,
		inspectFeatureHighlightKey,
		inspectQueryBox,
		inspectTileTemplates,
		INSPECT_CLICK_TOLERANCE_PX,
		INSPECT_HIGHLIGHT_ALTERNATE_LAYER_ID,
		INSPECT_HIGHLIGHT_LAYER_ID,
		INSPECT_HIGHLIGHT_LAYER_IDS,
		isInspectHighlightLayerId,
		longitudeLatitudeToTile,
		resolveTileUrl,
		type InspectedFeature,
		type InspectHoverResult,
		type InspectPointResult,
		type InspectSourceMetadata
	} from '#lib/components/editor/InspectMode';
	import { useBackgroundMap } from '#lib/contexts/backgroundMap.svelte';
	import { createDisplayStyle } from '#lib/fonts/displayStyle.ts';
	import { applyFilterHighlight, FILTER_HIGHLIGHT_LAYER_ID } from '#lib/utils/filterHighlight.ts';
	import { getLayerGroup } from '#lib/utils/layerGroup.ts';
	import { cn } from '#lib/utils/tailwindUtil';

	type LayerPickCandidate = {
		layer: LayerSpecification;
		featureCount: number;
	};

	let {
		class: className,
		mapStyle,
		hasLocalFonts = false,
		onClickLayer,
		inspectActive = false,
		inspectSession = 0,
		inspectHighlight = null,
		inspectSourceMetadata = {},
		onInspectHover,
		onInspectClick
	}: {
		class?: string;
		mapStyle: StyleSpecification;
		hasLocalFonts?: boolean;
		onClickLayer?: (layer: LayerSpecification) => void;
		inspectActive?: boolean;
		inspectSession?: number;
		inspectHighlight?: InspectedFeature | null;
		inspectSourceMetadata?: Record<string, InspectSourceMetadata | undefined>;
		onInspectHover?: (result: InspectHoverResult | null) => void;
		onInspectClick?: (result: InspectPointResult) => void;
	} = $props();

	const backgroundMap = useBackgroundMap();

	let map = $state<MaplibreMap | undefined>(undefined);
	let zoom = $state(15);
	let pitch = $state(0);
	let bearing = $state(0);
	let interactiveCursor = $state('');
	const cursor = $derived(inspectActive ? 'crosshair' : interactiveCursor);
	let inspectAccent = $state('#0d8de3');
	let pendingInspectHover: MapMouseEvent['point'] | null = null;
	let inspectHoverFrame: number | undefined;
	let previousInspectHoverFeature: InspectedFeature | null = null;
	let previousInspectHoverKey: string | null = null;
	let appliedInspectHighlightKey: string | null = null;
	let appliedInspectSourceLayerId: string | null = null;
	let appliedInspectDisplayStyle: StyleSpecification | null = null;
	let appliedInspectMapLayerId: string | null = null;
	let syncingInspectHighlight = false;
	let layerPickerSession = $state(0);
	let layerPicker = $state<{
		x: number;
		y: number;
		candidates: LayerPickCandidate[];
	} | null>(null);

	// 派生値を遅延評価し、MapLibre には編集プロキシではなく snapshot を渡す。
	const style = $derived.by(() => {
		const displayed = createDisplayStyle(
			$state.snapshot(mapStyle as object) as StyleSpecification,
			hasLocalFonts
		);
		return applyFilterHighlight(displayed, backgroundMap.filterHighlight);
	});

	const resetAppliedInspectHighlight = () => {
		appliedInspectHighlightKey = null;
		appliedInspectSourceLayerId = null;
		appliedInspectDisplayStyle = null;
		appliedInspectMapLayerId = null;
	};

	const removeInspectHighlightLayers = (currentMap: MaplibreMap) => {
		for (const layerId of INSPECT_HIGHLIGHT_LAYER_IDS) {
			if (currentMap.getLayer(layerId)) currentMap.removeLayer(layerId);
		}
	};

	const syncInspectHighlight = (
		currentMap: MaplibreMap,
		active: boolean,
		feature: InspectedFeature | null,
		accent: string,
		displayStyle: StyleSpecification
	) => {
		if (syncingInspectHighlight) return;
		syncingInspectHighlight = true;
		try {
			if (!active || !feature) {
				resetAppliedInspectHighlight();
				removeInspectHighlightLayers(currentMap);
				return;
			}
			if (!currentMap.isStyleLoaded()) return;

			const nextKey = `${accent}:${inspectFeatureHighlightKey(feature)}`;
			const existing = appliedInspectMapLayerId
				? currentMap.getLayer(appliedInspectMapLayerId)
				: undefined;
			const canUpdateFilter =
				existing &&
				appliedInspectSourceLayerId === feature.layerId &&
				appliedInspectDisplayStyle === displayStyle;
			const nextMapLayerId = canUpdateFilter
				? appliedInspectMapLayerId
				: appliedInspectMapLayerId === INSPECT_HIGHLIGHT_LAYER_ID
					? INSPECT_HIGHLIGHT_ALTERNATE_LAYER_ID
					: INSPECT_HIGHLIGHT_LAYER_ID;
			if (!nextMapLayerId) return;
			const highlightLayer = createInspectHighlightLayer(
				displayStyle,
				{
					layerId: feature.layerId,
					accent,
					filter: feature.highlightFilter
				},
				nextMapLayerId
			);
			if (!highlightLayer) {
				resetAppliedInspectHighlight();
				removeInspectHighlightLayers(currentMap);
				return;
			}

			if (canUpdateFilter) {
				if (appliedInspectHighlightKey !== nextKey) {
					appliedInspectHighlightKey = nextKey;
					currentMap.setFilter(
						nextMapLayerId,
						'filter' in highlightLayer ? (highlightLayer.filter ?? null) : null
					);
				}
				return;
			}

			if (currentMap.getLayer(nextMapLayerId)) currentMap.removeLayer(nextMapLayerId);
			currentMap.addLayer(highlightLayer);
			const previousMapLayerId = appliedInspectMapLayerId;
			appliedInspectHighlightKey = nextKey;
			appliedInspectSourceLayerId = feature.layerId;
			appliedInspectDisplayStyle = displayStyle;
			appliedInspectMapLayerId = nextMapLayerId;
			if (previousMapLayerId && currentMap.getLayer(previousMapLayerId)) {
				currentMap.removeLayer(previousMapLayerId);
			}
		} catch {
			resetAppliedInspectHighlight();
		} finally {
			syncingInspectHighlight = false;
		}
	};

	type InspectHighlightActionParameters = {
		map: MaplibreMap | undefined;
		active: boolean;
		feature: InspectedFeature | null;
		accent: string;
		displayStyle: StyleSpecification;
	};

	const inspectHighlightAction = (
		_node: HTMLElement,
		initialParameters: InspectHighlightActionParameters
	) => {
		let parameters = initialParameters;
		let currentMap: MaplibreMap | undefined;
		const handleStyleData = () => {
			if (!currentMap) return;
			syncInspectHighlight(
				currentMap,
				parameters.active,
				parameters.feature,
				parameters.accent,
				parameters.displayStyle
			);
		};
		const setMap = (nextMap: MaplibreMap | undefined) => {
			if (currentMap === nextMap) return;
			if (currentMap) {
				currentMap.off('styledata', handleStyleData);
				syncInspectHighlight(currentMap, false, null, parameters.accent, parameters.displayStyle);
			}
			currentMap = nextMap;
			currentMap?.on('styledata', handleStyleData);
		};
		const update = (nextParameters: InspectHighlightActionParameters) => {
			parameters = nextParameters;
			setMap(parameters.map);
			handleStyleData();
		};

		setMap(parameters.map);
		handleStyleData();
		return {
			update,
			destroy: () => setMap(undefined)
		};
	};

	const inspectHighlightParameters = $derived<InspectHighlightActionParameters>({
		map,
		active: inspectActive,
		feature: inspectHighlight,
		accent: inspectAccent,
		displayStyle: style
	});
	const inspectHighlightAttachment = fromAction(
		inspectHighlightAction,
		() => inspectHighlightParameters
	);

	const isTemporaryHighlight = (feature: MapGeoJSONFeature): boolean =>
		feature.layer.id === FILTER_HIGHLIGHT_LAYER_ID ||
		isInspectHighlightLayerId(feature.layer.id) ||
		feature.layer.id.startsWith('kartore-palette-highlight-');

	const inspectedFeature = (feature: MapGeoJSONFeature): InspectedFeature => {
		const properties = { ...(feature.properties as Record<string, unknown>) };
		return {
			id: feature.id,
			layerId: feature.layer.id,
			sourceId: feature.source,
			sourceLayer: feature.sourceLayer,
			geometryType: feature.geometry.type,
			properties,
			geojson: {
				type: 'Feature',
				...(feature.id === undefined ? {} : { id: feature.id }),
				properties,
				geometry: JSON.parse(JSON.stringify(feature.geometry)) as unknown
			},
			highlightFilter: createFeatureHighlightFilter(feature)
		};
	};

	const queryInspectFeatures = (
		point: MapMouseEvent['point'],
		tolerance = 0
	): InspectedFeature[] => {
		if (!map) return [];
		const features = map
			.queryRenderedFeatures(tolerance > 0 ? inspectQueryBox(point, tolerance) : point)
			.filter((feature) => !isTemporaryHighlight(feature))
			.map(inspectedFeature);
		return dedupeInspectedFeatures(features);
	};

	const inspectResult = (event: MapMouseEvent): InspectPointResult => {
		const features = queryInspectFeatures(event.point, INSPECT_CLICK_TOLERANCE_PX);
		const tile = longitudeLatitudeToTile(
			event.lngLat.lng,
			event.lngLat.lat,
			map?.getZoom() ?? zoom
		);
		const sourceIds = [
			...new Set(
				features.length > 0
					? features.map(({ sourceId }) => sourceId)
					: Object.keys(mapStyle.sources)
			)
		];
		const tileUrls = sourceIds.flatMap((sourceId) =>
			inspectTileTemplates(mapStyle, inspectSourceMetadata, sourceId)
				.slice(0, 1)
				.map((template) => ({ sourceId, url: resolveTileUrl(template, tile) }))
		);
		return {
			point: { x: event.point.x, y: event.point.y },
			longitude: event.lngLat.lng,
			latitude: event.lngLat.lat,
			features,
			tile,
			tileUrls
		};
	};

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
		if (inspectActive) {
			layerPicker = null;
			onInspectClick?.(inspectResult(event));
			return;
		}
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
		layerPickerSession = inspectSession;
	};

	const handleMapMouseMove = (event: MapMouseEvent) => {
		if (inspectActive) {
			pendingInspectHover = event.point.clone();
			if (inspectHoverFrame === undefined) {
				inspectHoverFrame = requestAnimationFrame(() => {
					inspectHoverFrame = undefined;
					const point = pendingInspectHover;
					pendingInspectHover = null;
					if (!point || !inspectActive) return;
					const queriedFeature = queryInspectFeatures(point)[0];
					if (!queriedFeature) {
						previousInspectHoverFeature = null;
						previousInspectHoverKey = null;
						onInspectHover?.(null);
						return;
					}

					const nextKey = inspectFeatureHighlightKey(queriedFeature);
					const feature =
						nextKey === previousInspectHoverKey && previousInspectHoverFeature
							? previousInspectHoverFeature
							: queriedFeature;
					previousInspectHoverFeature = feature;
					previousInspectHoverKey = nextKey;
					onInspectHover?.({ point: { x: point.x, y: point.y }, feature });
				});
			}
			return;
		}
		interactiveCursor = queryEventLayers(event).length > 0 ? 'pointer' : '';
	};

	const handleMapMouseOut = () => {
		interactiveCursor = '';
		pendingInspectHover = null;
		previousInspectHoverFeature = null;
		previousInspectHoverKey = null;
		onInspectHover?.(null);
	};

	const handleMapMove = () => {
		const center = map?.getCenter();
		if (!center) return;
		backgroundMap.longitude = center.lng;
		backgroundMap.latitude = center.lat;
	};

	const selectLayer = (layer: LayerSpecification) => {
		layerPicker = null;
		onClickLayer?.(layer);
	};

	onMount(() => {
		inspectAccent =
			getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() ||
			inspectAccent;
	});
	onDestroy(() => {
		if (inspectHoverFrame !== undefined) cancelAnimationFrame(inspectHoverFrame);
		onInspectHover?.(null);
	});

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

<div class={cn('relative h-auto w-full', className)} {@attach inspectHighlightAttachment}>
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
		onmove={handleMapMove}
		onmousemove={handleMapMouseMove}
		onmouseout={handleMapMouseOut}
	/>

	{#if layerPicker && !inspectActive && layerPickerSession === inspectSession}
		<div
			class="pointer-events-auto absolute z-20 w-64 overflow-hidden rounded-lg border border-hairline bg-white shadow-xl shadow-ink-1/20"
			style={`left: clamp(0.75rem, ${layerPicker.x}px, calc(100% - 17rem)); top: clamp(0.75rem, ${layerPicker.y + 12}px, calc(100% - 18rem));`}
		>
			<div
				class="flex items-start justify-between gap-3 border-b border-hairline-soft bg-field px-3 py-2"
			>
				<div class="min-w-0">
					<p class="text-[11.5px] font-semibold text-ink-1">レイヤーを選択</p>
					<p class="text-[10px] font-normal text-ink-3">
						{layerPicker.candidates.length} レイヤーが該当
					</p>
				</div>
				<Button
					class="rounded-md px-2 py-1 text-xs font-semibold text-ink-3 hover:bg-field"
					aria-label="レイヤー選択を閉じる"
					onclick={() => (layerPicker = null)}
				>
					<X size={14} weight="regular" aria-hidden="true" />
				</Button>
			</div>
			<div class="max-h-64 overflow-auto p-1">
				{#each layerPicker.candidates as { layer, featureCount } (layer.id)}
					<Button
						class="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-field"
						onclick={() => selectLayer(layer)}
					>
						<span class="min-w-0">
							<span class="block truncate font-mono text-[11px] font-normal text-ink-1"
								>{layer.id}</span
							>
							<span class="block truncate text-[10px] text-ink-3">
								{getLayerGroup(layer) ?? 'グループなし'} / {layer.type}
							</span>
						</span>
						{#if featureCount > 1}
							<span
								class="shrink-0 rounded-sm bg-field px-1.5 py-0.5 font-mono text-[11px] font-normal text-ink-3"
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
