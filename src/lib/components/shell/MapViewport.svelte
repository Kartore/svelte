<script lang="ts">
	import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
	import { Compass, Crosshair, Minus, Plus } from 'phosphor-svelte';
	import type { Snippet } from 'svelte';

	import { Button } from '#lib/components/common/Button';
	import {
		InspectDataOverlay,
		InspectPopover,
		inspectFeatureDisplayLabel,
		type InspectedFeature,
		type InspectHoverResult,
		type InspectLegendEntry,
		type InspectPointResult,
		type InspectSourceMetadata,
		type InspectView
	} from '#lib/components/editor/InspectMode';
	import { MapPanel } from '#lib/components/editor/MapPanel';
	import { useBackgroundMap } from '#lib/contexts/backgroundMap.svelte.ts';
	import { colorVisionMatrixValues, type ColorVisionMode } from '#lib/utils/colorVision.ts';

	let {
		mapStyle,
		hasLocalFonts = false,
		onClickLayer,
		inspectActive = false,
		inspectSession = 0,
		inspectView = 'style',
		inspectLegend = [],
		inspectHiddenDataKeys = new Set<string>(),
		inspectHover = null,
		inspectPopup = null,
		inspectSelectedIndex = 0,
		inspectHighlight = null,
		inspectTileBoundaries = false,
		inspectSourceMetadata = {},
		onToggleInspect,
		onInspectViewChange,
		onInspectLegendToggle,
		onInspectHover,
		onInspectClick,
		onInspectSelectFeature,
		onInspectHighlightFeature,
		onInspectFilterProperty,
		onInspectSelectLayer,
		onInspectTileBoundariesChange,
		onInspectClosePopup,
		colorVisionMode = 'none',
		children
	}: {
		mapStyle: StyleSpecification;
		hasLocalFonts?: boolean;
		onClickLayer?: (layer: LayerSpecification) => void;
		inspectActive?: boolean;
		inspectSession?: number;
		inspectView?: InspectView;
		inspectLegend?: InspectLegendEntry[];
		inspectHiddenDataKeys?: ReadonlySet<string>;
		inspectHover?: InspectHoverResult | null;
		inspectPopup?: InspectPointResult | null;
		inspectSelectedIndex?: number;
		inspectHighlight?: InspectedFeature | null;
		inspectTileBoundaries?: boolean;
		inspectSourceMetadata?: Record<string, InspectSourceMetadata | undefined>;
		onToggleInspect?: () => void;
		onInspectViewChange?: (view: InspectView) => void;
		onInspectLegendToggle?: (key: string) => void;
		onInspectHover?: (result: InspectHoverResult | null) => void;
		onInspectClick?: (result: InspectPointResult) => void;
		onInspectSelectFeature?: (index: number) => void;
		onInspectHighlightFeature?: (feature: InspectedFeature | null) => void;
		onInspectFilterProperty?: (
			feature: InspectedFeature,
			key: string,
			value: string | number | boolean
		) => void;
		onInspectSelectLayer?: (feature: InspectedFeature) => void;
		onInspectTileBoundariesChange?: (visible: boolean) => void;
		onInspectClosePopup?: () => void;
		colorVisionMode?: ColorVisionMode;
		children?: Snippet;
	} = $props();

	const backgroundMap = useBackgroundMap();
	const longitude = $derived(backgroundMap.longitude);
	const latitude = $derived(backgroundMap.latitude);
	const zoom = $derived(backgroundMap.zoom ?? 0);
	const isMaxZoom = $derived(backgroundMap.map ? zoom >= backgroundMap.map.getMaxZoom() : false);
	const isMinZoom = $derived(backgroundMap.map ? zoom <= backgroundMap.map.getMinZoom() : false);
	const isNorthUpFlat = $derived(backgroundMap.bearing === 0 && backgroundMap.pitch === 0);
	const compassTransform = $derived(`rotate(${backgroundMap.bearing}deg)`);
	const activeColorVisionMode = $derived(colorVisionMode === 'none' ? null : colorVisionMode);
	const colorVisionFilter = $derived(
		activeColorVisionMode ? 'url(#kartore-color-vision-map)' : undefined
	);
	const colorVisionMatrix = $derived(
		activeColorVisionMode ? colorVisionMatrixValues(activeColorVisionMode) : ''
	);
</script>

<main class="relative min-w-0 flex-1 overflow-hidden bg-canvas">
	{#if activeColorVisionMode}
		<svg class="pointer-events-none absolute size-0" width="0" height="0" aria-hidden="true">
			<defs>
				<filter id="kartore-color-vision-map" color-interpolation-filters="sRGB">
					<feColorMatrix type="matrix" values={colorVisionMatrix} />
				</filter>
			</defs>
		</svg>
	{/if}
	<div class="absolute inset-0" style:filter={colorVisionFilter}>
		<MapPanel
			class="h-full"
			{mapStyle}
			{hasLocalFonts}
			{onClickLayer}
			{inspectActive}
			{inspectSession}
			{inspectHighlight}
			{inspectSourceMetadata}
			{onInspectHover}
			{onInspectClick}
		/>
	</div>

	<div
		class="absolute top-3 right-3 z-10 flex flex-col overflow-hidden rounded-[6px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.16)]"
		aria-label="地図ナビゲーション"
	>
		<Button
			class="flex size-7 items-center justify-center border-b border-hairline-soft text-ink-2 hover:bg-field disabled:text-ink-4"
			aria-label="拡大"
			disabled={isMaxZoom}
			onclick={() => backgroundMap.map?.zoomIn()}
		>
			<Plus size={16} weight="regular" aria-hidden="true" />
		</Button>
		<Button
			class="flex size-7 items-center justify-center border-b border-hairline-soft text-ink-2 hover:bg-field disabled:text-ink-4"
			aria-label="縮小"
			disabled={isMinZoom}
			onclick={() => backgroundMap.map?.zoomOut()}
		>
			<Minus size={16} weight="regular" aria-hidden="true" />
		</Button>
		<Button
			class="flex size-7 items-center justify-center border-b border-hairline-soft text-ink-2 hover:bg-field disabled:text-ink-4"
			aria-label="北向きと傾きをリセット"
			disabled={isNorthUpFlat}
			onclick={() => backgroundMap.map?.resetNorthPitch()}
		>
			<Compass
				size={16}
				weight="regular"
				style={`transform: ${compassTransform}`}
				aria-hidden="true"
			/>
		</Button>
		<Button
			class="flex size-7 items-center justify-center text-ink-2 hover:bg-field aria-pressed:bg-accent aria-pressed:text-white"
			aria-label={inspectActive ? 'ポイント検査を終了' : 'ポイント検査'}
			aria-pressed={inspectActive}
			title="ポイント検査 (I)"
			onclick={onToggleInspect}
		>
			<Crosshair size={16} weight="regular" aria-hidden="true" />
		</Button>
	</div>

	{#if inspectActive}
		<InspectDataOverlay
			view={inspectView}
			legend={inspectLegend}
			hiddenKeys={inspectHiddenDataKeys}
			onViewChange={(view) => onInspectViewChange?.(view)}
			onLegendToggle={(key) => onInspectLegendToggle?.(key)}
		/>
	{/if}

	{#if inspectActive && inspectHover && !inspectPopup}
		<div
			class="pointer-events-none absolute z-20 flex h-6 max-w-[220px] items-center rounded-[5px] bg-white px-2 font-mono text-[10px] text-ink-2 shadow-[0_1px_4px_rgba(0,0,0,0.16)]"
			style={`left: clamp(8px, ${inspectHover.point.x + 12}px, calc(100% - 228px)); top: clamp(8px, ${inspectHover.point.y + 12}px, calc(100% - 32px));`}
			title={inspectFeatureDisplayLabel(inspectHover.feature, inspectView)}
		>
			<span class="truncate">{inspectFeatureDisplayLabel(inspectHover.feature, inspectView)}</span>
		</div>
	{/if}

	{#if inspectActive && inspectPopup}
		<InspectPopover
			result={inspectPopup}
			view={inspectView}
			selectedIndex={inspectSelectedIndex}
			tileBoundaries={inspectTileBoundaries}
			onSelectFeature={(index) => onInspectSelectFeature?.(index)}
			onHighlightFeature={(feature) => onInspectHighlightFeature?.(feature)}
			onFilterProperty={(feature, key, value) => onInspectFilterProperty?.(feature, key, value)}
			onSelectLayer={(feature) => onInspectSelectLayer?.(feature)}
			onTileBoundariesChange={(visible) => onInspectTileBoundariesChange?.(visible)}
			onClose={() => onInspectClosePopup?.()}
		/>
	{/if}

	<div
		class="absolute bottom-3 left-3 z-10 flex h-6 items-center gap-2 rounded-[5px] bg-white px-[9px] font-mono text-[10px] text-ink-2 shadow-[0_1px_4px_rgba(0,0,0,0.16)]"
	>
		<span>z {zoom.toFixed(1)}</span>
		<span>{latitude.toFixed(3)}, {longitude.toFixed(3)}</span>
	</div>

	<a
		class="absolute right-3 bottom-3 z-10 rounded-[4px] bg-white/90 px-1.5 py-0.5 text-[9px] text-ink-3 hover:text-accent"
		href="https://www.openstreetmap.org/copyright"
		target="_blank"
		rel="noreferrer"
	>
		© OpenStreetMap contributors
	</a>

	{@render children?.()}
</main>
