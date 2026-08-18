<script lang="ts">
	import type { SourceSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
	import { Plus, X } from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import { Select } from '#lib/components/common/Select';
	import { TextField } from '#lib/components/common/TextField';
	import { createSourceLayers } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSourceLayers/useSourceLayers.svelte.ts';
	import { isVectorSource } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/SourceUtil/SourceUtil.ts';
	import { validateMapStyle } from '#lib/utils/styleValidation.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	import SourceEditor from './SourceEditor.svelte';

	type AddableSourceType = 'vector' | 'raster' | 'raster-dem' | 'geojson';
	type EditableSourceType = SourceSpecification['type'];

	const editableSourceTypes: EditableSourceType[] = [
		'vector',
		'raster',
		'raster-dem',
		'geojson',
		'video',
		'image'
	];
	const addableSourceTypes: AddableSourceType[] = ['vector', 'raster', 'raster-dem', 'geojson'];
	const sourceTemplates: Record<AddableSourceType, SourceSpecification> = {
		vector: { type: 'vector', tiles: ['https://example.com/tiles/{z}/{x}/{y}.pbf'] },
		raster: {
			type: 'raster',
			tiles: ['https://example.com/tiles/{z}/{x}/{y}.png'],
			tileSize: 256
		},
		'raster-dem': {
			type: 'raster-dem',
			tiles: ['https://example.com/dem/{z}/{x}/{y}.png'],
			tileSize: 256
		},
		geojson: {
			type: 'geojson',
			data: { type: 'FeatureCollection', features: [] }
		}
	};

	let {
		mapStyle,
		readOnly = false,
		onApply
	}: {
		mapStyle: StyleSpecification;
		readOnly?: boolean;
		onApply: (next: StyleSpecification) => void;
	} = $props();

	let search = $state('');
	let selectedSourceId = $state<string>();
	let adding = $state(false);
	let addSourceId = $state('');
	let addSourceType = $state<AddableSourceType>('vector');
	let editValue = $state('');
	let editError = $state<string>();
	let editWarnings = $state<string[]>([]);
	let editingSource = $state(false);

	const sourceEntries = $derived(
		Object.entries(mapStyle.sources)
			.filter(([sourceId]) =>
				sourceId.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
			)
			.sort(([left], [right]) => left.localeCompare(right))
	);
	const selectedSource = $derived(
		selectedSourceId ? mapStyle.sources[selectedSourceId] : undefined
	);
	const sourceLayersState = createSourceLayers(() =>
		selectedSource && isVectorSource(selectedSource) ? selectedSource : undefined
	);
	const trimmedAddSourceId = $derived(addSourceId.trim());
	const addSourceError = $derived.by(() => {
		if (trimmedAddSourceId === '') return 'ID を入力してください。';
		if (trimmedAddSourceId in mapStyle.sources) return '同じ ID のソースがあります。';
		return undefined;
	});

	const sourceJSON = (source: SourceSpecification): string => JSON.stringify(source, null, '\t');
	const usedLayerIds = (sourceId: string): string[] =>
		mapStyle.layers
			.filter((layer) => 'source' in layer && layer.source === sourceId)
			.map((layer) => layer.id);
	const usedSourceLayers = (sourceId: string): { id: string; count: number }[] => {
		const counts: { id: string; count: number }[] = [];
		for (const layer of mapStyle.layers) {
			if (!('source' in layer) || layer.source !== sourceId) continue;
			const sourceLayer = 'source-layer' in layer ? layer['source-layer'] : undefined;
			const key = typeof sourceLayer === 'string' ? sourceLayer : '(指定なし)';
			const item = counts.find(({ id }) => id === key);
			if (item) item.count += 1;
			else counts.push({ id: key, count: 1 });
		}
		return counts;
	};

	const selectSource = (sourceId: string, source: SourceSpecification) => {
		if (selectedSourceId === sourceId) {
			selectedSourceId = undefined;
			editingSource = false;
			return;
		}
		selectedSourceId = sourceId;
		editValue = sourceJSON(source);
		editError = undefined;
		editWarnings = [];
		editingSource = false;
	};
	const candidateWithSource = (
		sourceId: string,
		source: SourceSpecification
	): StyleSpecification => ({
		...($state.snapshot(mapStyle as object) as StyleSpecification),
		sources: {
			...($state.snapshot(mapStyle.sources as object) as StyleSpecification['sources']),
			[sourceId]: source
		}
	});
	const applySource = (source: SourceSpecification) => {
		if (!selectedSourceId || readOnly) return;
		const candidate = candidateWithSource(selectedSourceId, source);
		editValue = sourceJSON(source);
		editWarnings = validateMapStyle(candidate).styleErrors.filter((error) =>
			error.startsWith('sources.')
		);
		editError = undefined;
		onApply(candidate);
	};
	const applySourceJSONEdit = () => {
		if (!selectedSourceId || readOnly) return;
		let parsed: unknown;
		try {
			parsed = JSON.parse(editValue);
		} catch (error) {
			editError = `JSON が不正です: ${error instanceof Error ? error.message : String(error)}`;
			return;
		}
		if (
			typeof parsed !== 'object' ||
			parsed === null ||
			!('type' in parsed) ||
			typeof parsed.type !== 'string' ||
			!editableSourceTypes.includes(parsed.type as EditableSourceType)
		) {
			editError = '有効な type を持つソース JSON が必要です。';
			return;
		}
		applySource(parsed as SourceSpecification);
	};
	const deleteSource = (sourceId: string) => {
		if (readOnly || usedLayerIds(sourceId).length > 0) return;
		const current = $state.snapshot(mapStyle as object) as StyleSpecification;
		const sources = { ...current.sources };
		delete sources[sourceId];
		selectedSourceId = undefined;
		editingSource = false;
		onApply({ ...current, sources });
	};
	const addSource = () => {
		if (readOnly || addSourceError) return;
		const source = structuredClone(sourceTemplates[addSourceType]);
		onApply(candidateWithSource(trimmedAddSourceId, source));
		selectedSourceId = trimmedAddSourceId;
		editValue = sourceJSON(source);
		addSourceId = '';
		addSourceType = 'vector';
		adding = false;
	};
</script>

<aside class="flex w-60 shrink-0 flex-col border-r border-hairline bg-white">
	<header class="flex h-10 shrink-0 items-center gap-1.5 px-3">
		<h2 class="text-[12px] font-semibold text-ink-1">ソース</h2>
		<p class="text-[10.5px] text-ink-3">{Object.keys(mapStyle.sources).length}</p>
		<Button
			class="ml-auto flex size-6 items-center justify-center rounded-[5px] text-ink-2 hover:bg-field hover:text-ink-1 disabled:text-ink-4"
			aria-label="ソースを追加"
			title="ソースを追加"
			disabled={readOnly}
			onclick={() => (adding = !adding)}
		>
			<Plus size={16} weight="regular" aria-hidden="true" />
		</Button>
	</header>

	<div class="shrink-0 px-2 pb-1.5">
		<div class="relative">
			<TextField
				class="w-full [&>input]:h-[26px] [&>input]:w-full [&>input]:rounded-[6px] [&>input]:pr-7 [&>input]:text-[11px] [&>input]:font-normal"
				aria-label="ソースを検索"
				placeholder="検索"
				value={search}
				onValueChange={(value) => (search = value)}
			/>
			{#if search}
				<Button
					class="absolute top-0 right-0 flex size-6 items-center justify-center text-ink-3 hover:text-ink-1"
					aria-label="ソース検索をクリア"
					onclick={() => (search = '')}
				>
					<X size={14} weight="regular" aria-hidden="true" />
				</Button>
			{/if}
		</div>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto">
		{#if adding}
			<div class="flex flex-col gap-2 border-b border-hairline-soft px-3 py-2">
				<TextField
					class="[&>input]:w-full"
					aria-label="新しいソース ID"
					placeholder="source-id"
					value={addSourceId}
					onValueChange={(value) => (addSourceId = value)}
				/>
				<Select
					class="[&>button]:w-full"
					aria-label="新しいソースの種類"
					items={addableSourceTypes.map((type) => ({ value: type, label: type }))}
					value={addSourceType}
					onValueChange={(value) => (addSourceType = value as AddableSourceType)}
				/>
				{#if addSourceId && addSourceError}
					<p class="text-[10px] text-ink-2" role="alert">{addSourceError}</p>
				{/if}
				<Button
					class="h-6 rounded-[6px] bg-accent px-2 text-[11px] font-semibold text-white disabled:bg-ink-4"
					disabled={addSourceError !== undefined}
					onclick={addSource}
				>
					追加
				</Button>
			</div>
		{/if}

		{#if sourceEntries.length === 0}
			<p class="px-3 py-6 text-center text-[11px] text-ink-3">一致するソースはありません。</p>
		{/if}
		{#each sourceEntries as [sourceId, source] (sourceId)}
			{@const usedBy = usedLayerIds(sourceId)}
			{@const selected = selectedSourceId === sourceId}
			<button
				type="button"
				class={cn(
					'flex min-h-[42px] w-full items-center gap-2 px-3 py-1.5 text-left outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]',
					selected ? 'bg-accent-soft text-ink-1' : 'text-ink-2 hover:bg-field'
				)}
				onclick={() => selectSource(sourceId, source)}
			>
				<span class="min-w-0 flex-1">
					<span class="block truncate font-mono text-[11px] text-ink-1">{sourceId}</span>
					<span class="mt-0.5 block truncate text-[9.5px] text-ink-3">
						{source.type} ・ z{'minzoom' in source ? (source.minzoom ?? 0) : 0}–{'maxzoom' in source
							? (source.maxzoom ?? 24)
							: 24} ・ {usedBy.length === 0 ? '未使用' : `${usedBy.length} レイヤー`}
					</span>
				</span>
			</button>

			{#if selected}
				<div class="border-b border-hairline-soft px-3 pt-1.5 pb-3 text-[10px]">
					<SourceEditor {source} {readOnly} onChange={applySource} />
					{#each editWarnings as warning, index (warning + index)}
						<p class="mt-1 text-[10px] text-ink-3">{warning}</p>
					{/each}
					<div>
						<p class="mt-1.5 mb-0.5 text-[10px] text-ink-3">使用中の source-layer</p>
						{#if usedSourceLayers(sourceId).length === 0}
							<p class="text-ink-3">使用レイヤーなし</p>
						{:else}
							{#each usedSourceLayers(sourceId) as item (item.id)}
								<p class="flex h-[22px] items-center justify-between gap-2 font-mono text-ink-2">
									<span class="truncate">{item.id}</span><span class="text-ink-3">{item.count}</span
									>
								</p>
							{/each}
						{/if}
					</div>

					{#if isVectorSource(source) && source.url}
						<div>
							{#if sourceLayersState.error}
								<p class="text-ink-2" role="alert">{sourceLayersState.error.message}</p>
							{:else if sourceLayersState.isLoading}
								<p class="text-ink-3">取得中…</p>
							{/if}
							<Button
								class="mt-2 h-5 px-0 text-[10px] font-semibold text-accent hover:bg-transparent"
								disabled={sourceLayersState.isLoading}
								onclick={() => sourceLayersState.refetch()}
							>
								TileJSON を再取得
							</Button>
						</div>
					{/if}

					<div class="mt-2 flex min-h-5 items-center gap-3 border-t border-hairline-soft pt-1.5">
						<Button
							class="h-5 px-0 text-[10px] font-semibold text-accent hover:bg-transparent"
							onclick={() => (editingSource = !editingSource)}
						>
							{editingSource ? '詳細 JSON を閉じる' : '詳細 JSON を編集'}
						</Button>
						<Button
							class="h-5 px-0 text-[10px] text-ink-3 hover:bg-transparent hover:text-ink-1 disabled:text-ink-4"
							disabled={readOnly || usedBy.length > 0}
							title={usedBy.length > 0 ? '使用中のソースは削除できません' : 'ソースを削除'}
							onclick={() => deleteSource(sourceId)}
						>
							削除
						</Button>
					</div>

					{#if editingSource}
						<div class="mt-1.5">
							<textarea
								class="h-28 w-full resize-y rounded-[5px] border-0 bg-field p-2 font-mono text-[10px] leading-4 text-ink-1 outline-none focus:shadow-[inset_0_0_0_1px_var(--color-accent)]"
								aria-label={`${sourceId} のソース JSON`}
								spellcheck="false"
								bind:value={editValue}></textarea>
							{#if editError}
								<p class="mt-1 text-[10px] text-ink-2" role="alert">{editError}</p>
							{/if}
							{#each editWarnings as warning, index (warning + index)}
								<p class="mt-1 text-[10px] text-ink-3">{warning}</p>
							{/each}
							<Button
								class="mt-1 h-5 px-0 text-[10px] font-semibold text-accent hover:bg-transparent"
								disabled={readOnly}
								onclick={applySourceJSONEdit}
							>
								適用
							</Button>
						</div>
					{/if}
				</div>
			{/if}
		{/each}
	</div>

	<footer
		class="flex h-8 shrink-0 items-center justify-between border-t border-hairline-soft px-3 font-mono text-[10px] text-ink-3"
	>
		<span>{Object.keys(mapStyle.sources).length} ソース</span>
		<span>⌘3</span>
	</footer>
</aside>
