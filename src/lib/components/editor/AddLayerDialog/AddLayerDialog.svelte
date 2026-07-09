<script lang="ts">
	import { Dialog } from 'bits-ui';
	import {
		latest,
		type LayerSpecification,
		type SourceSpecification,
		type StyleSpecification
	} from '@maplibre/maplibre-gl-style-spec';

	import { Button } from '$lib/components/common/Button';
	import { ComboBox } from '$lib/components/common/ComboBox';
	import { Select } from '$lib/components/common/Select';
	import { TextField } from '$lib/components/common/TextField';
	import { createSourceLayers } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSourceLayers/useSourceLayers.svelte.ts';
	import { isVectorSource } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/SourceUtil/SourceUtil.ts';

	type LayerType = LayerSpecification['type'];
	type SourceType = SourceSpecification['type'];

	const layerTypes = Object.keys(latest.layer.type.values) as LayerType[];
	const sourceTypesByLayerType: Record<LayerType, SourceType[]> = {
		fill: ['vector', 'geojson'],
		line: ['vector', 'geojson'],
		symbol: ['vector', 'geojson'],
		circle: ['vector', 'geojson'],
		heatmap: ['vector', 'geojson'],
		'fill-extrusion': ['vector', 'geojson'],
		raster: ['raster'],
		hillshade: ['raster-dem'],
		'color-relief': ['raster-dem'],
		background: []
	};

	let {
		open = $bindable(false),
		mapStyle,
		onAdd
	}: {
		open?: boolean;
		mapStyle: StyleSpecification;
		onAdd: (layer: LayerSpecification) => void;
	} = $props();

	let draftId = $state('');
	let draftType = $state<LayerType>('fill');
	let draftSource = $state('');
	let draftSourceLayer = $state('');

	const existingIds = $derived(new Set(mapStyle.layers.map((layer) => layer.id)));
	const compatibleSourceTypes = $derived(sourceTypesByLayerType[draftType]);
	const compatibleSources = $derived(
		Object.entries(mapStyle.sources).filter(([, source]) =>
			compatibleSourceTypes.includes(source.type)
		)
	);
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
		if (trimmedId === '') return 'Layer ID is required.';
		if (existingIds.has(trimmedId)) return 'Layer ID must be unique.';
		return undefined;
	});
	const sourceError = $derived(
		sourceRequired && compatibleSources.length === 0
			? 'No compatible source. Add one in Sources.'
			: undefined
	);
	const canAdd = $derived(idError === undefined && sourceError === undefined);

	const reset = () => {
		draftId = '';
		draftType = 'fill';
		draftSource = '';
		draftSourceLayer = '';
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
						...(isVectorSource(selectedSourceData) && draftSourceLayer.trim() !== ''
							? { 'source-layer': draftSourceLayer.trim() }
							: {})
					} as LayerSpecification);

		onAdd(layer);
		open = false;
		reset();
	};

	const cancel = () => {
		open = false;
		reset();
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-40 bg-gray-950/35 backdrop-blur-[1px]" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex w-[min(92vw,34rem)] -translate-1/2 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xl shadow-gray-950/20"
		>
			<div class="border-b border-gray-200 px-4 py-3">
				<div class="flex flex-col gap-1">
					<Dialog.Title class="font-montserrat text-base font-semibold text-gray-950">
						Add Layer
					</Dialog.Title>
					<p class="text-xs font-medium text-gray-500">
						Create a minimal layer and edit details later.
					</p>
				</div>
			</div>

			<div class="flex flex-col gap-4 px-4 py-4">
				<section class="flex flex-col gap-3">
					<div>
						<h3 class="font-montserrat text-sm font-semibold text-gray-800">Layer</h3>
						<p class="text-xs text-gray-500">Choose the layer identity and rendering type.</p>
					</div>
					<div class="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50/60 p-3">
						<div class="flex flex-col gap-1">
							<TextField class="[&>input]:w-[70%]" label="ID" bind:value={draftId} />
							{#if idError}
								<p class="self-end text-xs text-red-600">{idError}</p>
							{/if}
						</div>

						<Select
							class="[&>button]:w-[70%]"
							label="Type"
							items={layerTypes.map((type) => ({ value: type, label: type }))}
							bind:value={draftType}
							onValueChange={(value) => {
								draftType = value as LayerType;
							}}
						/>
					</div>
				</section>

				{#if sourceRequired}
					<section class="flex flex-col gap-3">
						<div>
							<h3 class="font-montserrat text-sm font-semibold text-gray-800">Source</h3>
							<p class="text-xs text-gray-500">Connect this layer to compatible source data.</p>
						</div>
						<div class="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50/60 p-3">
							{#if sourceError}
								<div class="flex justify-end">
									<p class="w-[70%] text-xs text-red-600">{sourceError}</p>
								</div>
							{:else}
								<Select
									class="[&>button]:w-[70%]"
									label="Source"
									items={compatibleSources.map(([sourceId]) => ({
										value: sourceId,
										label: sourceId
									}))}
									value={selectedSourceId}
									onValueChange={(value) => {
										draftSource = value;
										draftSourceLayer = '';
									}}
								/>
							{/if}

							{#if isVectorSource(selectedSourceData)}
								<ComboBox
									class="[&>div:last-child]:w-[70%]"
									label="Source Layer"
									items={sourceLayerItems}
									allowsCustomValue
									value={draftSourceLayer}
									inputValue={draftSourceLayer}
									onValueChange={(value) => (draftSourceLayer = value)}
									onInputChange={(value) => (draftSourceLayer = value)}
								/>
							{/if}
						</div>
					</section>
				{/if}
			</div>

			<div class="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
				<Button
					class="h-8 rounded-md px-3 text-xs font-semibold text-gray-600 hover:bg-gray-200"
					onclick={cancel}
				>
					Cancel
				</Button>
				<Button
					class="h-8 rounded-md bg-gray-900 px-3 text-xs font-semibold text-white hover:bg-gray-700 disabled:cursor-default disabled:bg-gray-300"
					disabled={!canAdd}
					onclick={add}
				>
					Add Layer
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
