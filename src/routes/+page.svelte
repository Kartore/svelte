<script lang="ts">
	import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
	import { Popover } from 'bits-ui';
	import { onDestroy, setContext } from 'svelte';

	import { isExpression } from '$lib/components/common/FilterInputField/expressions/utils/isExpression.ts';
	import { AddLayerDialog } from '$lib/components/editor/AddLayerDialog';
	import { ControlPanel } from '$lib/components/editor/ControlPanel';
	import { ImportStyleDialog } from '$lib/components/editor/ImportStyleDialog';
	import { MapPanel } from '$lib/components/editor/MapPanel';
	import { NavigationPanel } from '$lib/components/editor/NavigationPanel';
	import { PropertiesPanel } from '$lib/components/editor/PropertiesPanel';
	import { ExpressionFlyoutPanel } from '$lib/components/editor/PropertiesPanel/ExpressionFlyoutPanel';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { replaceLayerData } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { SourcesDialog } from '$lib/components/editor/SourcesDialog';
	import { StyleSettingsDialog } from '$lib/components/editor/StyleSettingsDialog';
	import { provideBackgroundMap } from '$lib/contexts/backgroundMap.svelte.ts';
	import { provideExpressionFlyout } from '$lib/contexts/expressionFlyout.svelte.ts';
	import type { EditorApi, EditorPreview } from '$lib/editor/EditorModule.ts';
	import { adapterModules } from 'virtual:kartore-adapter';
	import { osmLibertyMigrated } from '$lib/samples/osm-liberty.ts';
	import { localStorageMapStyleStoreAdapter, MapStyleStore } from '$lib/stores/mapStyle';
	import { validateMapStyle, type StyleValidationResult } from '$lib/utils/styleValidation.ts';

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
	let previewState = $state<EditorPreview | null>(null);
	const effectiveStyle = $derived(previewState?.style ?? store.mapStyle);
	const selectedLayer = $derived(
		effectiveStyle.layers.find((layer) => layer.id === selectedLayerId) ?? effectiveStyle.layers[0]
	);
	const effectiveSelectedLayerId = $derived(selectedLayer?.id ?? null);

	let validation = $state<StyleValidationResult>({ layerErrors: {}, styleErrors: [] });
	$effect(() => {
		void effectiveStyle;
		const timer = setTimeout(() => {
			// StyleSpecification は再帰 union のため Snapshot<T> の型展開を避けて widening する
			validation = validateMapStyle(
				$state.snapshot(effectiveStyle as object) as StyleSpecification
			);
		}, 200);
		return () => clearTimeout(timer);
	});

	const editorApi: EditorApi = {
		getStyle: () => store.mapStyle,
		setStyle: (style) => store.setMapStyle(style),
		setPreview: (preview) => (previewState = preview),
		getPreview: () => previewState
	};
	for (const module of adapterModules) {
		setContext(`module:${module.id}`, module.setup?.(editorApi));
	}

	const handleChangeLayerOrder = (layers: LayerSpecification[]) => {
		if (previewState) return;
		store.setMapStyle((currentStyle) => ({ ...currentStyle, layers }));
	};

	const handleChangeLayerData: onChangeType = (layer, group, key, value) => {
		if (previewState) return;
		store.setMapStyle((currentStyle) => replaceLayerData(currentStyle, layer, group, key, value));
	};

	const handleImport = (style: StyleSpecification) => {
		if (previewState) return;
		store.setMapStyle(style);
	};

	const handleApplyStyle = (style: StyleSpecification) => {
		if (previewState) return;
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
		if (previewState) return;
		store.setMapStyle((currentStyle) => ({
			...currentStyle,
			layers: [...currentStyle.layers, layer]
		}));
		selectedLayerId = layer.id;
	};

	const handleDuplicateLayer = () => {
		if (previewState) return;
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
		if (previewState) return;
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
			return flyoutValue !== undefined;
		}
		return isExpression(flyoutValue);
	});

	// レイヤーを切り替えたら編集中プロパティとの対応が切れるため閉じる
	$effect(() => {
		void effectiveSelectedLayerId;
		expressionFlyout.close();
	});

	// 保存は 500ms デバウンスされるため、SPA 遷移によるアンマウント時に
	// 未保存の編集が落ちないよう flush する
	onDestroy(() => store.flushSave());
</script>

<svelte:head>
	<title>Kartore</title>
</svelte:head>

<!-- pagehide: モバイル Safari 等では beforeunload が発火しないため両方で flush する -->
<svelte:window
	onkeydown={handleKeyDown}
	onbeforeunload={() => store.flushSave()}
	onpagehide={() => store.flushSave()}
/>

{#if store.isLoading}
	<div class="flex min-h-screen items-center justify-center text-sm text-gray-600">
		Loading map style...
	</div>
{:else}
	<div class="relative flex max-h-screen min-h-screen w-full flex-row overflow-hidden">
		<MapPanel mapStyle={effectiveStyle} onClickLayer={handleSelectLayer} />
		{#if previewState}
			<div
				class="pointer-events-auto absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900 shadow-lg shadow-gray-950/10"
			>
				<span>Previewing {previewState.label}. Editing is disabled.</span>
				<button
					type="button"
					class="cursor-pointer rounded px-2 py-1 text-blue-700 transition-colors hover:bg-blue-100"
					onclick={() => (previewState = null)}
				>
					Exit preview
				</button>
			</div>
		{/if}
		<div class="pointer-events-none absolute inset-3 flex gap-3">
			<NavigationPanel
				class="w-[20rem] min-w-[18rem] max-w-[22rem]"
				mapStyle={effectiveStyle}
				layerErrors={validation.layerErrors}
				onChangeLayerOrder={handleChangeLayerOrder}
				selectedLayerId={effectiveSelectedLayerId}
				canUndo={!previewState && store.canUndo}
				canRedo={!previewState && store.canRedo}
				onClickUndo={() => store.undo()}
				onClickRedo={() => store.redo()}
				onClickExport={handleExport}
				onClickImport={() => (importDialogOpen = true)}
				onClickSettings={() => (settingsDialogOpen = true)}
				onClickAddLayer={() => (addLayerDialogOpen = true)}
				onClickSources={() => (sourcesDialogOpen = true)}
				onClickLayer={handleSelectLayer}
			>
				{#snippet headerActions()}
					{#each adapterModules as module (module.id)}
						{#if module.headerAction}
							{@const HeaderAction = module.headerAction}
							<HeaderAction />
						{/if}
					{/each}
				{/snippet}
			</NavigationPanel>

			<ControlPanel class="flex-1" />

			{#if flyoutVisible && expressionFlyout.target && expressionFlyout.anchor}
				<Popover.Root open={true}>
					<Popover.Portal>
						<Popover.Content
							class="pointer-events-auto z-50 w-[24rem] max-w-[calc(100vw-1rem)]"
							customAnchor={expressionFlyout.anchor}
							side="left"
							align="start"
							sideOffset={8}
							collisionPadding={8}
							interactOutsideBehavior="ignore"
							escapeKeydownBehavior="ignore"
							preventScroll={false}
							onOpenAutoFocus={(event) => event.preventDefault()}
							onCloseAutoFocus={(event) => event.preventDefault()}
						>
							<ExpressionFlyoutPanel
								class="max-h-[calc(100vh-2rem)] w-full shadow-xl shadow-gray-950/15"
								layer={selectedLayer}
								target={expressionFlyout.target}
								errors={validation.layerErrors[selectedLayer.id]}
								onChange={handleChangeLayerData}
								onClose={() => expressionFlyout.close()}
							/>
						</Popover.Content>
					</Popover.Portal>
				</Popover.Root>
			{/if}

			{#key selectedLayer.id}
				<PropertiesPanel
					class="w-[min(42rem,42vw)] min-w-[25rem]"
					sprite={effectiveStyle.sprite}
					layer={selectedLayer}
					sources={effectiveStyle.sources}
					errors={validation.layerErrors[selectedLayer.id]}
					onChange={handleChangeLayerData}
					onDuplicateLayer={handleDuplicateLayer}
					onDeleteLayer={handleDeleteLayer}
					canDeleteLayer={!previewState && effectiveStyle.layers.length > 1}
				/>
			{/key}
		</div>
		<ImportStyleDialog bind:open={importDialogOpen} onImport={handleImport} />
		{#if settingsDialogOpen}
			<StyleSettingsDialog
				bind:open={settingsDialogOpen}
				mapStyle={effectiveStyle}
				onApply={handleApplyStyle}
			/>
		{/if}
		{#if addLayerDialogOpen}
			<AddLayerDialog
				bind:open={addLayerDialogOpen}
				mapStyle={effectiveStyle}
				onAdd={handleAddLayer}
			/>
		{/if}
		{#if sourcesDialogOpen}
			<SourcesDialog
				bind:open={sourcesDialogOpen}
				mapStyle={effectiveStyle}
				onApply={handleApplyStyle}
			/>
		{/if}
		{#each adapterModules as module (module.id)}
			{#each module.overlays ?? [] as Overlay, index (`${module.id}-${index}`)}
				<Overlay />
			{/each}
		{/each}
	</div>
{/if}
