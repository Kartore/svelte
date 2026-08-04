<script lang="ts">
	import type {
		BackgroundLayerSpecification,
		LayerSpecification,
		SourceSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import { ComboBox } from '#lib/components/common/ComboBox';
	import { Select } from '#lib/components/common/Select';
	import { createLayerFeatureSuggestions } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useLayerFeatureSuggestions';
	import { createSourceLayers } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSourceLayers/useSourceLayers.svelte.ts';
	import { isVectorSource } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/SourceUtil/SourceUtil.ts';
	import { useBackgroundMap } from '#lib/contexts/backgroundMap.svelte.ts';
	import { compatibleSourcesForLayer } from '#lib/utils/layerSource.ts';

	type DataLayer = Exclude<LayerSpecification, BackgroundLayerSpecification>;

	let {
		layer,
		sources,
		onApplyLayer,
		onFilterProperty
	}: {
		layer: DataLayer;
		sources: Record<string, SourceSpecification>;
		onApplyLayer: (layer: LayerSpecification, previousId: string) => void;
		onFilterProperty: (key: string, value: string | number | boolean) => void;
	} = $props();

	const compatibleSources = $derived(compatibleSourcesForLayer(layer.type, sources));
	const backgroundMap = useBackgroundMap();
	const sourceData = $derived(sources[layer.source]);
	const sourceLayersState = createSourceLayers(() =>
		isVectorSource(sourceData) ? sourceData : undefined
	);
	const sourceLayerItems = $derived(
		(sourceLayersState.sourceLayers ?? []).map(({ id }) => ({ value: id, label: id }))
	);
	const featureSuggestions = createLayerFeatureSuggestions(
		() => sources,
		() => layer
	);
	const properties = $derived(featureSuggestions.suggestions.propertyKeys);
	const tileJson = $derived(sourceLayersState.tileJson);
	const sourceRecord = $derived(sourceData as unknown as Record<string, unknown> | undefined);
	const minzoom = $derived(
		typeof tileJson?.minzoom === 'number'
			? tileJson.minzoom
			: typeof sourceRecord?.minzoom === 'number'
				? sourceRecord.minzoom
				: 0
	);
	const maxzoom = $derived(
		typeof tileJson?.maxzoom === 'number'
			? tileJson.maxzoom
			: typeof sourceRecord?.maxzoom === 'number'
				? sourceRecord.maxzoom
				: 24
	);
	const sourceUrl = $derived(
		isVectorSource(sourceData) ? (sourceData.url ?? tileJson?.tiles?.[0] ?? '—') : '—'
	);
	const viewportFeatures = $derived.by(() => {
		void backgroundMap.zoom;
		const map = backgroundMap.map;
		if (!map?.getLayer(layer.id)) return [];
		try {
			return map.queryRenderedFeatures(undefined, { layers: [layer.id] });
		} catch {
			return [];
		}
	});
	const geometryType = $derived(
		viewportFeatures[0]?.geometry.type ??
			(layer.type === 'line'
				? 'LineString'
				: layer.type === 'fill' || layer.type === 'fill-extrusion'
					? 'Polygon'
					: layer.type === 'circle'
						? 'Point'
						: '—')
	);
	const typeAbbreviation = (type: string | undefined) =>
		type?.toLocaleLowerCase().startsWith('string')
			? 'str'
			: type?.toLocaleLowerCase().startsWith('number')
				? 'num'
				: type?.toLocaleLowerCase().startsWith('boolean')
					? 'bool'
					: '—';

	const applyPatch = (patch: Record<string, unknown>, remove: string[] = []) => {
		const next = structuredClone(layer) as LayerSpecification;
		const record = next as unknown as Record<string, unknown>;
		for (const key of remove) Reflect.deleteProperty(record, key);
		Object.assign(record, patch);
		onApplyLayer(next, layer.id);
	};
</script>

<div class="flex h-full min-h-0 flex-col overflow-y-auto bg-white">
	<section class="shrink-0 border-b border-hairline-soft px-4 pt-1.5 pb-2.5">
		<h3 class="flex h-7 items-center text-[11px] font-semibold text-ink-1">ソース</h3>
		<Select
			label="source"
			items={compatibleSources.map(([id]) => ({ value: id, label: id }))}
			value={layer.source}
			onValueChange={(source) => applyPatch({ source }, ['source-layer'])}
		/>
		{#if isVectorSource(sourceData)}
			<ComboBox
				label="source-layer"
				items={sourceLayerItems}
				allowsCustomValue
				value={layer['source-layer'] ?? ''}
				inputValue={layer['source-layer'] ?? ''}
				onValueChange={(value) => applyPatch({ 'source-layer': value || undefined })}
				onCommit={(value) => applyPatch({ 'source-layer': value || undefined })}
			/>
		{/if}
		<p class="mt-1.5 font-mono text-[10px] leading-[1.6] text-ink-3">
			<span class="font-mono text-[11px] font-normal text-ink-2">{sourceData?.type ?? '—'}</span>
			・ z{minzoom}–{maxzoom} ・ 超過分はオーバーズーム<br />
			<span class="break-all">{sourceUrl}</span>
		</p>
	</section>

	<section class="shrink-0 border-b border-hairline-soft px-4 pt-1.5 pb-2.5">
		<h3 class="flex h-7 items-center text-[11px] font-semibold text-ink-1">ジオメトリ</h3>
		<dl>
			<div class="flex h-[30px] items-center">
				<dt class="w-[84px] shrink-0 font-mono text-[10px] text-ink-2">タイプ</dt>
				<dd class="ml-auto font-mono text-[11px] text-ink-1">{geometryType}</dd>
			</div>
			<div class="flex h-[30px] items-center">
				<dt class="w-[84px] shrink-0 font-mono text-[10px] text-ink-2">ビューポート内</dt>
				<dd class="ml-auto font-mono text-[11px] text-ink-1">
					{viewportFeatures.length.toLocaleString()}
				</dd>
			</div>
		</dl>
	</section>

	<section class="min-h-0 px-4 pt-1.5 pb-2.5">
		<h3 class="flex h-7 items-center gap-1.5 text-[11px] font-semibold text-ink-1">
			属性
			<span class="font-mono text-[9px] font-semibold tracking-[0.04em] text-ink-3">
				{'source-layer' in layer ? (layer['source-layer'] ?? '') : ''}
			</span>
		</h3>
		{#if properties.length === 0}
			<p class="py-5 text-center text-[10px] text-ink-3">
				表示中のタイルから属性を取得できませんでした。
			</p>
		{:else}
			{#each properties as property (property.name)}
				{@const values = featureSuggestions.suggestions.getValueSuggestions(property.name)}
				<div class="group flex h-[26px] items-center gap-[7px] rounded-[4px] px-1 hover:bg-field">
					<span class="truncate font-mono text-[11px] text-ink-1">{property.name}</span>
					<span class="font-mono text-[9px] text-ink-3">
						{typeAbbreviation(property.type)}
					</span>
					<span
						class="ml-auto max-w-[116px] truncate font-mono text-[9.5px] text-ink-4"
						title={values.join(', ')}
					>
						{values.length > 0 ? values.slice(0, 3).join(', ') : '—'}
					</span>
					<button
						type="button"
						class="shrink-0 text-[9.5px] font-semibold text-accent opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
						onclick={() => onFilterProperty(property.name, values[0] ?? '')}
					>
						絞り込む
					</button>
				</div>
			{/each}
		{/if}
		<p class="mt-1.5 text-[9.5px] text-ink-4">TileJSON + ビューポート内フィーチャーから取得</p>
	</section>
</div>
