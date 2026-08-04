<script lang="ts">
	import { CheckSquare, Copy, Square, StackSimple, X } from 'phosphor-svelte';
	import { onDestroy } from 'svelte';

	import { Button } from '#lib/components/common/Button';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	import {
		inspectFeatureContextLabel,
		inspectFeatureDisplayLabel,
		type InspectedFeature,
		type InspectPointResult,
		type InspectView
	} from './inspectUtils.ts';

	let {
		result,
		view = 'style',
		selectedIndex = 0,
		tileBoundaries = false,
		onSelectFeature,
		onHighlightFeature,
		onFilterProperty,
		onSelectLayer,
		onTileBoundariesChange,
		onClose
	}: {
		result: InspectPointResult;
		view?: InspectView;
		selectedIndex?: number;
		tileBoundaries?: boolean;
		onSelectFeature: (index: number) => void;
		onHighlightFeature: (feature: InspectedFeature | null) => void;
		onFilterProperty: (
			feature: InspectedFeature,
			key: string,
			value: string | number | boolean
		) => void;
		onSelectLayer: (feature: InspectedFeature) => void;
		onTileBoundariesChange: (visible: boolean) => void;
		onClose: () => void;
	} = $props();

	const selectedFeature = $derived(result.features[selectedIndex] ?? result.features[0]);
	let copied = $state(false);
	let copiedTimer: ReturnType<typeof setTimeout> | undefined;

	const displayValue = (value: unknown): string => {
		if (typeof value === 'string') return value;
		const serialized = JSON.stringify(value);
		return serialized === undefined ? String(value) : serialized;
	};
	const isFilterValue = (value: unknown): value is string | number | boolean =>
		typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
	const copyFeature = async () => {
		if (!selectedFeature) return;
		await navigator.clipboard.writeText(JSON.stringify(selectedFeature.geojson, undefined, 2));
		copied = true;
		if (copiedTimer !== undefined) clearTimeout(copiedTimer);
		copiedTimer = setTimeout(() => (copied = false), 1600);
	};

	onDestroy(() => {
		if (copiedTimer !== undefined) clearTimeout(copiedTimer);
		onHighlightFeature(null);
	});
</script>

<aside
	aria-label="ポイント検査"
	class="pointer-events-auto absolute z-30 flex w-[280px] flex-col overflow-hidden rounded-[10px] border border-hairline bg-white text-[11px] text-ink-1 shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
	style={`--inspect-top: clamp(12px, ${result.point.y + 12}px, calc(100% - 372px)); left: clamp(12px, ${result.point.x + 12}px, calc(100% - 292px)); top: var(--inspect-top); max-height: calc(100% - var(--inspect-top) - 12px);`}
>
	<header class="flex h-10 shrink-0 items-center gap-2 border-b border-hairline-soft pr-1.5 pl-3">
		<span class="font-semibold">ポイント検査</span>
		<span class="truncate font-mono text-[10px] font-normal text-ink-3">
			{result.longitude.toFixed(5)}, {result.latitude.toFixed(5)}
		</span>
		<Button
			class="ml-auto flex size-[26px] shrink-0 items-center justify-center rounded-[5px] text-ink-3 hover:bg-field hover:text-ink-1"
			aria-label="ポイント検査を閉じる"
			onclick={onClose}
		>
			<X size={14} weight="regular" aria-hidden="true" />
		</Button>
	</header>

	<div class="min-h-0 flex-1 overflow-y-auto">
		<section class="border-b border-hairline-soft px-2 py-2">
			<h2 class="h-6 px-1 text-[10px] font-semibold text-ink-2">
				フィーチャー {result.features.length}
			</h2>
			{#if result.features.length === 0}
				<p class="px-1 py-2 text-[10px] text-ink-3">描画中のフィーチャーはありません。</p>
			{:else}
				<ol>
					{#each result.features as feature, index (`${feature.layerId}-${feature.id ?? 'unidentified'}-${index}`)}
						<li>
							<button
								type="button"
								class={cn(
									'flex min-h-9 w-full items-center gap-2 rounded-[6px] px-2 text-left hover:bg-field focus-visible:outline-2 focus-visible:outline-accent',
									index === selectedIndex && 'bg-accent-soft'
								)}
								onmouseenter={() => onHighlightFeature(feature)}
								onmouseleave={() => onHighlightFeature(null)}
								onclick={() => onSelectFeature(index)}
							>
								<span class="min-w-0 flex-1">
									<span
										class="block truncate font-mono text-[11px]"
										title={inspectFeatureDisplayLabel(feature, view)}
										>{inspectFeatureDisplayLabel(feature, view)}</span
									>
									<span
										class="block truncate font-mono text-[9.5px] text-ink-3"
										title={inspectFeatureContextLabel(feature, view)}
									>
										{inspectFeatureContextLabel(feature, view)}
									</span>
								</span>
								<span class="shrink-0 font-mono text-[9px] text-ink-3">{index + 1}</span>
							</button>
						</li>
					{/each}
				</ol>
			{/if}
		</section>

		{#if selectedFeature}
			<section class="border-b border-hairline-soft px-2 py-2">
				<h2 class="h-6 px-1 text-[10px] font-semibold text-ink-2">属性</h2>
				{#if Object.keys(selectedFeature.properties).length === 0}
					<p class="px-1 py-2 text-[10px] text-ink-3">属性はありません。</p>
				{:else}
					<dl>
						{#each Object.entries(selectedFeature.properties) as [key, value] (key)}
							<div
								class="group flex h-7 min-w-0 items-center gap-2 rounded-[5px] px-1 hover:bg-field"
							>
								<dt class="w-[84px] shrink-0 truncate font-mono text-[10px] text-ink-2" title={key}>
									{key}
								</dt>
								<dd
									class="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-1"
									title={displayValue(value)}
								>
									{displayValue(value)}
								</dd>
								<span class="flex w-[72px] shrink-0 justify-end">
									{#if isFilterValue(value)}
										<button
											type="button"
											class="h-6 w-[72px] truncate rounded-[5px] text-[9.5px] font-semibold text-accent opacity-0 group-hover:opacity-100 hover:bg-white focus-visible:opacity-100"
											aria-label={`${key}=${displayValue(value)} で絞り込む`}
											title="この属性で絞り込む"
											onclick={() => onFilterProperty(selectedFeature, key, value)}
										>
											絞り込む
										</button>
									{/if}
								</span>
							</div>
						{/each}
					</dl>
				{/if}
			</section>

			<section class="border-b border-hairline-soft px-3 py-2">
				<div class="flex gap-1">
					<Button
						class="flex h-6 min-w-0 flex-1 items-center justify-center gap-1 rounded-[6px] text-[10px] font-semibold text-ink-2 hover:bg-field hover:text-ink-1"
						onclick={() => onSelectLayer(selectedFeature)}
					>
						<StackSimple size={13} weight="regular" aria-hidden="true" />
						レイヤーを選択
					</Button>
					<Button
						class="flex h-6 min-w-0 flex-1 items-center justify-center gap-1 rounded-[6px] text-[10px] font-semibold text-ink-2 hover:bg-field hover:text-ink-1"
						onclick={() => void copyFeature()}
					>
						<Copy size={13} weight="regular" aria-hidden="true" />
						{copied ? 'コピー済み' : 'JSON をコピー'}
					</Button>
				</div>
			</section>
		{/if}

		<section class="px-3 py-2.5">
			<h2 class="mb-1 text-[10px] font-semibold text-ink-2">タイル</h2>
			<p class="font-mono text-[11px] text-ink-1">
				z {result.tile.z} / x {result.tile.x} / y {result.tile.y}
			</p>
			{#if result.tileUrls.length === 0}
				<p class="mt-1 text-[10px] text-ink-3">解決できるタイル URL はありません。</p>
			{:else}
				{#each result.tileUrls as item (`${item.sourceId}-${item.url}`)}
					<div class="mt-1">
						<p class="font-mono text-[9px] text-ink-3">{item.sourceId}</p>
						<p class="truncate font-mono text-[10px] text-ink-2" title={item.url}>{item.url}</p>
					</div>
				{/each}
			{/if}
			<button
				type="button"
				class="mt-2 flex h-6 items-center gap-1.5 rounded-[6px] px-1 text-[10px] font-semibold text-ink-2 hover:bg-field hover:text-ink-1"
				aria-pressed={tileBoundaries}
				onclick={() => onTileBoundariesChange(!tileBoundaries)}
			>
				{#if tileBoundaries}
					<CheckSquare size={14} weight="regular" class="text-accent" aria-hidden="true" />
				{:else}
					<Square size={14} weight="regular" class="text-ink-3" aria-hidden="true" />
				{/if}
				タイル境界を表示
			</button>
		</section>
	</div>
</aside>
