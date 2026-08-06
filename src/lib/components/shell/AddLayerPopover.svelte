<script lang="ts">
	import {
		latest,
		type LayerSpecification,
		type StyleSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import { Plus, X } from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import { ComboBox } from '#lib/components/common/ComboBox';
	import { Popover } from '#lib/components/common/Popover';
	import { Select } from '#lib/components/common/Select';
	import { TextField } from '#lib/components/common/TextField';
	import { LayerIcon } from '#lib/components/icons';
	import { createSourceLayers } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSourceLayers/useSourceLayers.svelte.ts';
	import { isVectorSource } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/SourceUtil/SourceUtil.ts';
	import { compatibleSourcesForLayer } from '#lib/utils/layerSource.ts';

	type LayerType = LayerSpecification['type'];
	const preferredLayerTypes: LayerType[] = [
		'background',
		'fill',
		'line',
		'symbol',
		'circle',
		'heatmap',
		'fill-extrusion',
		'raster',
		'hillshade',
		'color-relief'
	];
	const availableLayerTypes = new Set(Object.keys(latest.layer.type.values) as LayerType[]);
	const layerTypes = preferredLayerTypes.filter((type) => availableLayerTypes.has(type));
	const topInsertion = '__top__';

	let {
		open = $bindable(false),
		mapStyle,
		readOnly = false,
		onAdd
	}: {
		open?: boolean;
		mapStyle: StyleSpecification;
		readOnly?: boolean;
		onAdd: (layer: LayerSpecification, aboveLayerId?: string) => void;
	} = $props();

	let draftId = $state('');
	let draftTypeOverride = $state<LayerType | null>(null);
	let draftSource = $state('');
	let draftSourceLayer = $state('');
	let insertion = $state(topInsertion);

	const defaultDraftType = $derived<LayerType>(
		mapStyle.layers.length === 0 && Object.keys(mapStyle.sources).length === 0
			? 'background'
			: 'line'
	);
	const draftType = $derived(draftTypeOverride ?? defaultDraftType);
	const existingIds = $derived(new Set(mapStyle.layers.map((layer) => layer.id)));
	const compatibleSources = $derived(compatibleSourcesForLayer(draftType, mapStyle.sources));
	const sourceRequired = $derived(draftType !== 'background');
	const selectedSourceId = $derived(
		sourceRequired && compatibleSources.some(([sourceId]) => sourceId === draftSource)
			? draftSource
			: (compatibleSources[0]?.[0] ?? '')
	);
	const selectedSourceData = $derived(mapStyle.sources[selectedSourceId]);
	const sourceLayersState = createSourceLayers(() =>
		isVectorSource(selectedSourceData) ? selectedSourceData : undefined
	);
	const sourceLayerItems = $derived(
		(sourceLayersState.sourceLayers ?? []).map(({ id }) => ({ value: id, label: id }))
	);
	const trimmedId = $derived(draftId.trim());
	const idError = $derived.by(() => {
		if (trimmedId === '') return 'ID を入力してください。';
		if (existingIds.has(trimmedId)) return 'ID は重複できません。';
		return undefined;
	});
	const sourceError = $derived(
		sourceRequired && compatibleSources.length === 0
			? '互換ソースがありません。Sources で追加してください。'
			: undefined
	);
	const canAdd = $derived(!readOnly && idError === undefined && sourceError === undefined);

	const reset = () => {
		draftId = '';
		draftTypeOverride = null;
		draftSource = '';
		draftSourceLayer = '';
		insertion = topInsertion;
	};
	const add = () => {
		if (!canAdd) return;
		const layer: LayerSpecification =
			draftType === 'background'
				? { id: trimmedId, type: 'background' }
				: ({
						id: trimmedId,
						type: draftType,
						source: selectedSourceId,
						...(isVectorSource(selectedSourceData) && draftSourceLayer.trim()
							? { 'source-layer': draftSourceLayer.trim() }
							: {})
					} as LayerSpecification);
		onAdd(layer, insertion === topInsertion ? undefined : insertion);
		open = false;
		reset();
	};
	const handleOpenChange = (next: boolean) => {
		open = readOnly ? false : next;
	};
</script>

<Popover
	bind:open
	onOpenChange={handleOpenChange}
	aria-label="レイヤーを追加"
	triggerClass="flex size-6 items-center justify-center rounded-[6px] bg-accent text-white hover:bg-accent"
	contentClass="w-[252px] overflow-hidden rounded-[10px] border border-hairline bg-white text-xs shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
>
	{#snippet trigger()}
		<Plus size={16} weight="regular" aria-hidden="true" />
	{/snippet}

	<div
		class="flex h-10 items-center gap-2 border-b border-hairline-soft px-3 text-[11.5px] font-semibold"
	>
		<span>新しいレイヤー</span>
		<Button
			class="ml-auto grid size-[26px] place-items-center rounded-[5px] text-ink-3 outline-none hover:bg-field hover:text-ink-1 focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]"
			aria-label="閉じる"
			onclick={() => (open = false)}
		>
			<X size={14} weight="regular" aria-hidden="true" />
		</Button>
	</div>

	<div class="px-3 pt-2.5 pb-3">
		<div class="mb-2.5 grid grid-cols-4 gap-1.5">
			{#each layerTypes as type (type)}
				<Button
					class={`grid min-h-[52px] place-items-center gap-0.5 rounded-[6px] border py-1.5 text-[9px] ${
						type === draftType
							? 'border-accent text-ink-1 shadow-[0_0_0_1px_var(--color-accent)]'
							: 'border-hairline-soft text-ink-2 hover:bg-field'
					}`}
					aria-pressed={type === draftType}
					onclick={() => {
						draftTypeOverride = type;
						draftSourceLayer = '';
					}}
				>
					<LayerIcon {type} size={14} aria-hidden="true" />
					<span>{type === 'fill-extrusion' ? 'fill-ext' : type}</span>
				</Button>
			{/each}
		</div>

		{#if sourceRequired && !sourceError}
			<Select
				label="source"
				items={compatibleSources.map(([sourceId]) => ({ value: sourceId, label: sourceId }))}
				value={selectedSourceId}
				onValueChange={(value) => {
					draftSource = value;
					draftSourceLayer = '';
				}}
			/>
			{#if isVectorSource(selectedSourceData)}
				<ComboBox
					label="source-layer"
					items={sourceLayerItems}
					allowsCustomValue
					value={draftSourceLayer}
					inputValue={draftSourceLayer}
					onValueChange={(value) => (draftSourceLayer = value)}
					onInputChange={(value) => (draftSourceLayer = value)}
				/>
			{/if}
		{/if}
		<TextField
			label="ID"
			placeholder="layer-id"
			value={draftId}
			onValueChange={(value) => (draftId = value)}
		/>
		<Select
			label="挿入位置"
			items={[
				{ value: topInsertion, label: '最前面' },
				...mapStyle.layers.map(({ id }) => ({ value: id, label: `${id} の上` }))
			]}
			bind:value={insertion}
		/>
		{#if draftId && idError}
			<p class="pl-[92px] text-[10px] text-ink-2">{idError}</p>
		{/if}
		{#if sourceError}
			<p class="text-[10px] text-ink-2">{sourceError}</p>
		{/if}
	</div>

	<div
		class="flex items-center justify-between gap-2 border-t border-hairline-soft px-3 py-2.5 text-[10px] text-ink-3"
	>
		<span>既定スタイルで追加</span>
		<Button
			class="h-6 rounded-[6px] bg-accent px-3 text-[11px] font-semibold text-white disabled:bg-ink-4"
			disabled={!canAdd}
			onclick={add}
		>
			追加
		</Button>
	</div>
</Popover>
