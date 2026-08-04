<script lang="ts">
	import type {
		BackgroundLayerSpecification,
		ExpressionFilterSpecification,
		LayerSpecification,
		SourceSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import { FunctionIcon, LockSimple } from 'phosphor-svelte';
	import { onDestroy, onMount } from 'svelte';
	import type * as maplibregl from 'maplibre-gl';

	import { Button } from '#lib/components/common/Button';
	import {
		FilterQueryBuilder,
		isFilterBuilderSupported,
		parseFilter
	} from '#lib/components/common/FilterQueryBuilder';
	import { LayerSuggestionsProvider } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/LayerSuggestionsProvider';
	import { useBackgroundMap } from '#lib/contexts/backgroundMap.svelte.ts';
	import { useExpressionFlyout } from '#lib/contexts/expressionFlyout.svelte.ts';
	import { FILTER_HIGHLIGHT_LAYER_ID } from '#lib/utils/filterHighlight.ts';

	type FilterLayer = Exclude<LayerSpecification, BackgroundLayerSpecification>;
	let {
		layer,
		sources,
		onChange,
		onRequestJson
	}: {
		layer: FilterLayer;
		sources: Record<string, SourceSpecification>;
		onChange: (value: ExpressionFilterSpecification | undefined) => void;
		onRequestJson: () => void;
	} = $props();

	const backgroundMap = useBackgroundMap();
	const expressionFlyout = useExpressionFlyout();
	const parsed = $derived(parseFilter(layer.filter));
	const supported = $derived(isFilterBuilderSupported(parsed));
	let matchedCount = $state(0);
	let totalCount = $state(0);
	let highlight = $state(false);
	let matchTimer: ReturnType<typeof setTimeout> | undefined;
	let mapAttachTimer: ReturnType<typeof setTimeout> | undefined;
	let attachedMap: maplibregl.Map | null = null;

	const featureKey = (feature: {
		id?: string | number;
		source?: string;
		sourceLayer?: string;
		geometry?: unknown;
		properties?: unknown;
	}): string =>
		feature.id === undefined
			? JSON.stringify([feature.source, feature.sourceLayer, feature.geometry, feature.properties])
			: `${feature.source}:${feature.sourceLayer ?? ''}:${feature.id}`;
	const refreshCounts = () => {
		const map = backgroundMap.map;
		if (!map || !map.getLayer(layer.id)) {
			matchedCount = 0;
			totalCount = 0;
			return;
		}
		try {
			const rendered = map.queryRenderedFeatures();
			const sourceLayer = 'source-layer' in layer ? layer['source-layer'] : undefined;
			const total = rendered.filter(
				(feature) =>
					feature.source === layer.source &&
					(sourceLayer === undefined || feature.sourceLayer === sourceLayer) &&
					feature.layer.id !== FILTER_HIGHLIGHT_LAYER_ID
			);
			const matched = map.queryRenderedFeatures(undefined, { layers: [layer.id] });
			totalCount = new Set(total.map(featureKey)).size;
			matchedCount = new Set(matched.map(featureKey)).size;
		} catch {
			matchedCount = 0;
			totalCount = 0;
		}
	};
	const scheduleCountRefresh = () => {
		if (matchTimer !== undefined) clearTimeout(matchTimer);
		matchTimer = setTimeout(() => {
			matchTimer = undefined;
			refreshCounts();
		}, 160);
	};

	const toggleHighlight = () => {
		highlight = !highlight;
		backgroundMap.filterHighlight = highlight
			? {
					layerId: layer.id,
					accent: getComputedStyle(document.documentElement)
						.getPropertyValue('--color-accent')
						.trim()
				}
			: null;
	};
	const detachMap = () => {
		if (!attachedMap) return;
		attachedMap.off('idle', scheduleCountRefresh);
		attachedMap.off('moveend', scheduleCountRefresh);
		attachedMap.off('styledata', scheduleCountRefresh);
		attachedMap = null;
	};
	const attachMap = () => {
		const map = backgroundMap.map;
		if (!map) {
			mapAttachTimer = setTimeout(attachMap, 50);
			return;
		}
		attachedMap = map;
		map.on('idle', scheduleCountRefresh);
		map.on('moveend', scheduleCountRefresh);
		map.on('styledata', scheduleCountRefresh);
		scheduleCountRefresh();
	};
	onMount(attachMap);

	onDestroy(() => {
		backgroundMap.filterHighlight = null;
		detachMap();
		if (matchTimer !== undefined) clearTimeout(matchTimer);
		if (mapAttachTimer !== undefined) clearTimeout(mapAttachTimer);
	});
</script>

<div class="flex h-full min-h-0 flex-col bg-white">
	<div class="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-2.5">
		<div
			class="my-1 mb-2.5 flex min-h-7 items-center gap-2 rounded-[6px] border border-hairline-soft px-[9px] py-[3px] text-[10.5px] text-ink-2"
		>
			<LockSimple size={14} weight="regular" class="shrink-0 text-ink-3" aria-hidden="true" />
			<span>source-layer は</span>
			<span class="truncate font-mono text-ink-1">
				{'source-layer' in layer ? (layer['source-layer'] ?? '—') : '—'}
			</span>
		</div>

		<div>
			{#if supported}
				<LayerSuggestionsProvider {layer} {sources}>
					<FilterQueryBuilder value={layer.filter} {onChange} />
				</LayerSuggestionsProvider>
			{:else}
				<div class="flex flex-col gap-2 rounded-[6px] bg-field p-2">
					<p class="text-[10px] leading-4 text-ink-2">
						この filter はルールビルダーで安全に表現できないため、読み取り専用です。
					</p>
					<pre
						class="max-h-52 overflow-auto font-mono text-[10px] leading-4 break-all whitespace-pre-wrap text-ink-1">{JSON.stringify(
							layer.filter,
							undefined,
							2
						)}</pre>
					<div class="flex justify-end gap-1">
						<Button
							class="flex h-6 items-center gap-1 rounded-[6px] px-2 text-[10px] font-semibold text-ink-2 hover:bg-white"
							onclick={(event) =>
								expressionFlyout?.open(
									{ group: 'filter', key: 'filter', label: 'フィルター' },
									event.currentTarget
								)}
						>
							<FunctionIcon size={13} weight="regular" aria-hidden="true" />
							式として編集
						</Button>
						<Button
							class="h-6 rounded-[6px] px-2 text-[10px] font-semibold text-ink-2 hover:bg-white"
							onclick={onRequestJson}
						>
							JSON
						</Button>
					</div>
				</div>
			{/if}
		</div>
		<div class="mt-1.5 flex h-[30px] items-center gap-1.5 border-t border-hairline-soft">
			<p class="font-mono text-[10px] text-ink-2">
				<span class="font-mono font-normal text-ink-1">{matchedCount}</span> / {totalCount} がマッチ
			</p>
			<button
				type="button"
				class="ml-auto text-[10px] font-semibold text-accent"
				aria-pressed={highlight}
				onclick={toggleHighlight}
			>
				{highlight ? 'ハイライトを解除' : '地図でハイライト'}
			</button>
		</div>
	</div>
</div>
