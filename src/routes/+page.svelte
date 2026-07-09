<script lang="ts">
	import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

	import { isExpression } from '$lib/components/common/FilterInputField/expressions/utils/isExpression.ts';
	import { AddLayerDialog } from '$lib/components/editor/AddLayerDialog';
	import { ControlPanel } from '$lib/components/editor/ControlPanel';
	import { ImportStyleDialog } from '$lib/components/editor/ImportStyleDialog';
	import { MapPanel } from '$lib/components/editor/MapPanel';
	import { NavigationPanel } from '$lib/components/editor/NavigationPanel';
	import { PropertiesPanel } from '$lib/components/editor/PropertiesPanel';
	import { ExpressionFlyoutPanel } from '$lib/components/editor/PropertiesPanel/ExpressionFlyoutPanel';
	import { isExpressionFilter } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/FilterProperties/utils/isExpressionFilter.ts';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { replaceLayerData } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { SourcesDialog } from '$lib/components/editor/SourcesDialog';
	import { StyleSettingsDialog } from '$lib/components/editor/StyleSettingsDialog';
	import { provideBackgroundMap } from '$lib/contexts/backgroundMap.svelte.ts';
	import { provideExpressionFlyout } from '$lib/contexts/expressionFlyout.svelte.ts';
	import { osmLibertyMigrated } from '$lib/samples/osm-liberty.ts';
	import { localStorageMapStyleStoreAdapter, MapStyleStore } from '$lib/stores/mapStyle';
	import { validateMapStyle } from '$lib/utils/styleValidation.ts';

	const store = new MapStyleStore({
		adapter: localStorageMapStyleStoreAdapter,
		initialStyle: osmLibertyMigrated
	});

	provideBackgroundMap();
	const expressionFlyout = provideExpressionFlyout();

	let selectedLayerId = $state<string>(osmLibertyMigrated.layers[4].id);
	let importDialogOpen = $state(false);
	let settingsDialogOpen = $state(false);
	let addLayerDialogOpen = $state(false);
	let sourcesDialogOpen = $state(false);
	const selectedLayer = $derived(
		store.mapStyle.layers.find((layer) => layer.id === selectedLayerId) ?? store.mapStyle.layers[0]
	);
	const effectiveSelectedLayerId = $derived(selectedLayer?.id ?? null);

	// StyleSpecification は再帰 union のため Snapshot<T> の型展開を避けて widening する
	const validation = $derived(
		validateMapStyle($state.snapshot(store.mapStyle as object) as StyleSpecification)
	);

	const handleChangeLayerOrder = (layers: LayerSpecification[]) => {
		store.setMapStyle((currentStyle) => ({ ...currentStyle, layers }));
	};

	const handleChangeLayerData: onChangeType = (layer, group, key, value) => {
		store.setMapStyle((currentStyle) => replaceLayerData(currentStyle, layer, group, key, value));
	};

	const handleImport = (style: StyleSpecification) => {
		store.setMapStyle(style);
	};

	const handleExport = () => {
		const style = $state.snapshot(store.mapStyle as object) as StyleSpecification;
		const blob = new Blob([JSON.stringify(style, null, '\t')], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `${(style.name ?? 'style').replace(/[\\/:*?"<>|]/g, '_')}.json`;
		anchor.click();
		URL.revokeObjectURL(url);
	};

	const handleSelectLayer = (layer: LayerSpecification) => {
		selectedLayerId = layer.id;
	};

	const duplicateId = (baseId: string, layers: LayerSpecification[]): string => {
		let candidate = `${baseId} copy`;
		for (let n = 2; layers.some((layer) => layer.id === candidate); n++) {
			candidate = `${baseId} copy ${n}`;
		}
		return candidate;
	};

	const handleAddLayer = (layer: LayerSpecification) => {
		store.setMapStyle((currentStyle) => ({
			...currentStyle,
			layers: [...currentStyle.layers, layer]
		}));
		selectedLayerId = layer.id;
	};

	const handleDuplicateLayer = () => {
		store.setMapStyle((currentStyle) => {
			const index = currentStyle.layers.findIndex((layer) => layer.id === selectedLayer.id);
			if (index === -1) return currentStyle;
			const copy = structuredClone(currentStyle.layers[index]);
			copy.id = duplicateId(copy.id, currentStyle.layers);
			const layers = [...currentStyle.layers];
			layers.splice(index + 1, 0, copy);
			selectedLayerId = copy.id;
			return { ...currentStyle, layers };
		});
	};

	const handleDeleteLayer = () => {
		if (store.mapStyle.layers.length <= 1) return;
		store.setMapStyle((currentStyle) => {
			const index = currentStyle.layers.findIndex((layer) => layer.id === selectedLayer.id);
			if (index === -1 || currentStyle.layers.length <= 1) return currentStyle;
			const layers = currentStyle.layers.filter((_, i) => i !== index);
			selectedLayerId = (layers[index] ?? layers[index - 1]).id;
			return { ...currentStyle, layers };
		});
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
		const target = event.target;
		if (
			target instanceof HTMLElement &&
			target.closest('input, textarea, select, [contenteditable="true"], .monaco-editor')
		) {
			return;
		}
		event.preventDefault();
		if (event.shiftKey) store.redo();
		else store.undo();
	};

	// 対象プロパティが expression でなくなったら (Reset された等) フライアウトは意味を失う
	const flyoutValue = $derived.by(() => {
		const target = expressionFlyout.target;
		if (!target || !selectedLayer) return undefined;
		if (target.group === 'filter') {
			return 'filter' in selectedLayer ? selectedLayer.filter : undefined;
		}
		return (
			selectedLayer[target.group as keyof LayerSpecification] as Record<string, unknown> | undefined
		)?.[target.key];
	});
	const flyoutVisible = $derived.by(() => {
		const target = expressionFlyout.target;
		if (target === null) return false;
		if (target.group === 'filter') {
			return flyoutValue !== undefined && isExpressionFilter(flyoutValue);
		}
		return isExpression(flyoutValue);
	});

	// レイヤーを切り替えたら編集中プロパティとの対応が切れるため閉じる
	$effect(() => {
		void effectiveSelectedLayerId;
		expressionFlyout.target = null;
	});
</script>

<svelte:head>
	<title>Kartore</title>
</svelte:head>

<svelte:window onkeydown={handleKeyDown} />

{#if store.isLoading}
	<div class="flex min-h-screen items-center justify-center text-sm text-gray-600">
		Loading map style...
	</div>
{:else}
	<div class="relative flex max-h-screen min-h-screen w-full flex-row overflow-hidden">
		<MapPanel mapStyle={store.mapStyle} onClickLayer={handleSelectLayer} />
		<div class="pointer-events-none absolute inset-3 flex gap-3">
			<NavigationPanel
				class="w-[20rem] min-w-[18rem] max-w-[22rem]"
				mapStyle={store.mapStyle}
				layerErrors={validation.layerErrors}
				onChangeLayerOrder={handleChangeLayerOrder}
				selectedLayerId={effectiveSelectedLayerId}
				canUndo={store.canUndo}
				canRedo={store.canRedo}
				onClickUndo={() => store.undo()}
				onClickRedo={() => store.redo()}
				onClickExport={handleExport}
				onClickImport={() => (importDialogOpen = true)}
				onClickSettings={() => (settingsDialogOpen = true)}
				onClickAddLayer={() => (addLayerDialogOpen = true)}
				onClickSources={() => (sourcesDialogOpen = true)}
				onClickLayer={handleSelectLayer}
			/>

			<ControlPanel class="flex-1" />

			{#if flyoutVisible && expressionFlyout.target}
				<ExpressionFlyoutPanel
					class="w-[24rem] min-w-[22rem]"
					layer={selectedLayer}
					target={expressionFlyout.target}
					errors={validation.layerErrors[selectedLayer.id]}
					onChange={handleChangeLayerData}
					onClose={() => expressionFlyout.close()}
				/>
			{/if}

			{#key selectedLayer.id}
				<PropertiesPanel
					class="w-[min(42rem,42vw)] min-w-[25rem]"
					sprite={store.mapStyle.sprite}
					layer={selectedLayer}
					sources={store.mapStyle.sources}
					errors={validation.layerErrors[selectedLayer.id]}
					onChange={handleChangeLayerData}
					onDuplicateLayer={handleDuplicateLayer}
					onDeleteLayer={handleDeleteLayer}
					canDeleteLayer={store.mapStyle.layers.length > 1}
				/>
			{/key}
		</div>
		<ImportStyleDialog bind:open={importDialogOpen} onImport={handleImport} />
		{#if settingsDialogOpen}
			<StyleSettingsDialog
				bind:open={settingsDialogOpen}
				mapStyle={store.mapStyle}
				onApply={(next) => store.setMapStyle(next)}
			/>
		{/if}
		{#if addLayerDialogOpen}
			<AddLayerDialog
				bind:open={addLayerDialogOpen}
				mapStyle={store.mapStyle}
				onAdd={handleAddLayer}
			/>
		{/if}
		{#if sourcesDialogOpen}
			<SourcesDialog
				bind:open={sourcesDialogOpen}
				mapStyle={store.mapStyle}
				onApply={(next) => store.setMapStyle(next)}
			/>
		{/if}
	</div>
{/if}
