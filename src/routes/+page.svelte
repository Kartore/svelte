<script lang="ts">
	import type {
		LayerSpecification,
		Map as MaplibreMap,
		MapStyleImageMissingEvent,
		StyleSpecification
	} from 'maplibre-gl';
	import { Popover } from 'bits-ui';
	import { onDestroy, setContext } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

	import { isExpression } from '$lib/components/common/FilterInputField/expressions/utils/isExpression.ts';
	import { AddLayerDialog } from '$lib/components/editor/AddLayerDialog';
	import { ControlPanel } from '$lib/components/editor/ControlPanel';
	import { FontsDialog } from '$lib/components/editor/FontsDialog';
	import { ImportStyleDialog } from '$lib/components/editor/ImportStyleDialog';
	import { MapPanel } from '$lib/components/editor/MapPanel';
	import { NavigationPanel } from '$lib/components/editor/NavigationPanel';
	import { PropertiesPanel } from '$lib/components/editor/PropertiesPanel';
	import { ExpressionFlyoutPanel } from '$lib/components/editor/PropertiesPanel/ExpressionFlyoutPanel';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { replaceLayerData } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { provideLocalSpriteImages } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSpriteIds/localSpriteImages.ts';
	import { SourcesDialog } from '$lib/components/editor/SourcesDialog';
	import { SpritesDialog } from '$lib/components/editor/SpritesDialog';
	import { StyleJsonPanel } from '$lib/components/editor/StyleJsonPanel';
	import { StyleSettingsDialog } from '$lib/components/editor/StyleSettingsDialog';
	import { provideBackgroundMap } from '$lib/contexts/backgroundMap.svelte.ts';
	import { provideExpressionFlyout } from '$lib/contexts/expressionFlyout.svelte.ts';
	import { provideStyleHistory } from '$lib/contexts/styleHistory.svelte.ts';
	import type { EditorApi, EditorPreview } from '$lib/editor/EditorModule.ts';
	import { registerGlyphProtocol } from '$lib/fonts/glyphProtocol.ts';
	import { loadGlyphore } from '$lib/fonts/glyphore.ts';
	import { adapterModules } from 'virtual:kartore-adapter';
	import { osmLibertyMigrated } from '$lib/samples/osm-liberty.ts';
	import { loadSpritore } from '$lib/sprites/spritore.ts';
	import { spriteDimensionsFromSvg, svgDataUrl } from '$lib/sprites/spriteSvg.ts';
	import { localStorageMapStyleStoreAdapter, MapStyleStore } from '$lib/stores/mapStyle';
	import { FontsStore, indexedDbFontsStoreAdapter } from '$lib/stores/fonts';
	import { localStorageSpriteIconsStoreAdapter, SpriteIconsStore } from '$lib/stores/spriteIcons';
	import { groupLayersByIdPrefix } from '$lib/utils/layerGroup.ts';
	import { createStyleExport } from '$lib/utils/styleExport.ts';
	import { validateMapStyle, type StyleValidationResult } from '$lib/utils/styleValidation.ts';

	const store = new MapStyleStore({
		adapter: localStorageMapStyleStoreAdapter,
		initialStyle: osmLibertyMigrated
	});
	const spriteIconsStore = new SpriteIconsStore({
		adapter: localStorageSpriteIconsStoreAdapter
	});
	const fontsStore = new FontsStore({
		adapter: indexedDbFontsStoreAdapter
	});

	const backgroundMap = provideBackgroundMap();
	const expressionFlyout = provideExpressionFlyout();
	const styleHistory = provideStyleHistory();
	type LocalSpriteDimensions = {
		svg: string;
		width: number;
		height: number;
	};
	type RenderedLocalSprite = LocalSpriteDimensions & {
		id: string;
		pixels: Uint8Array;
	};
	const localSpriteDimensions = new SvelteMap<string, LocalSpriteDimensions>();
	provideLocalSpriteImages(() =>
		Object.entries(spriteIconsStore.icons).map(([id, svg]) => {
			const fallback = spriteDimensionsFromSvg(svg);
			const rendered = localSpriteDimensions.get(id);
			const dimensions = rendered?.svg === svg ? rendered : fallback;
			return {
				id,
				src: svgDataUrl(svg),
				x: 0,
				y: 0,
				width: dimensions.width,
				height: dimensions.height,
				pixelRatio: 1
			};
		})
	);
	type FlyoutPositionAnchor = {
		contextElement: HTMLElement;
		getBoundingClientRect: () => DOMRect;
	};

	let selectedLayerId = $state<string>(osmLibertyMigrated.layers[4].id);
	let layerSelectionRequest = $state(0);
	let importDialogOpen = $state(false);
	let settingsDialogOpen = $state(false);
	let addLayerDialogOpen = $state(false);
	let sourcesDialogOpen = $state(false);
	let spritesDialogOpen = $state(false);
	let fontsDialogOpen = $state(false);
	let styleJsonMode = $state(false);
	let previewState = $state<EditorPreview | null>(null);
	const effectiveStyle = $derived(previewState?.style ?? store.mapStyle);
	registerGlyphProtocol({
		hasLocalFont: (fontstack) => fontstack in fontsStore.fonts,
		getOriginalGlyphsUrl: () => effectiveStyle.glyphs,
		generateRange: async (fontstack, start) => {
			const font = await fontsStore.getLoadedFont(fontstack);
			if (!font) throw new Error(`Local font “${fontstack}” is no longer available.`);
			const { generateRange } = await loadGlyphore();
			return generateRange(font, start);
		}
	});
	const selectedLayer = $derived(
		effectiveStyle.layers.find((layer) => layer.id === selectedLayerId) ?? effectiveStyle.layers[0]
	);
	const effectiveSelectedLayerId = $derived(selectedLayer?.id ?? null);
	const flyoutPositionAnchor = $derived.by((): FlyoutPositionAnchor | null => {
		const propertyAnchor = expressionFlyout.anchor;
		if (!propertyAnchor) return null;
		const propertiesPanel = propertyAnchor.closest('[data-properties-panel]');
		if (!(propertiesPanel instanceof HTMLElement)) return null;

		return {
			// floating-ui がパネルのスクロール祖先を監視できるよう押下要素を紐付ける。
			contextElement: propertyAnchor,
			getBoundingClientRect: () => {
				const propertyRect = propertyAnchor.getBoundingClientRect();
				const panelRect = propertiesPanel.getBoundingClientRect();
				return new DOMRect(panelRect.left, propertyRect.top, 0, propertyRect.height);
			}
		};
	});

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

	let spriteSyncGeneration = 0;
	let synchronizedMap: MaplibreMap | null = null;
	let synchronizedIconSvgs = new SvelteMap<string, string>();
	let renderedLocalSprites = new SvelteMap<string, RenderedLocalSprite>();

	const removeLocalSprite = (map: MaplibreMap, id: string) => {
		if (map.hasImage(id)) map.removeImage(id);
	};

	const addLocalSprite = (map: MaplibreMap, sprite: RenderedLocalSprite) => {
		removeLocalSprite(map, sprite.id);
		map.addImage(
			sprite.id,
			{ width: sprite.width, height: sprite.height, data: sprite.pixels },
			{ pixelRatio: 2 }
		);
	};

	$effect(() => {
		const map = backgroundMap.map;
		const iconEntries = Object.entries(spriteIconsStore.icons);
		const iconSvgs = new SvelteMap(iconEntries);
		const generation = ++spriteSyncGeneration;

		if (map !== synchronizedMap) {
			synchronizedMap = map;
			synchronizedIconSvgs = new SvelteMap();
		}

		if (map) {
			for (const [id, svg] of synchronizedIconSvgs) {
				if (iconSvgs.get(id) === svg) continue;
				removeLocalSprite(map, id);
				synchronizedIconSvgs.delete(id);
			}
		}

		if (iconEntries.length === 0) {
			renderedLocalSprites = new SvelteMap();
			localSpriteDimensions.clear();
			return;
		}

		void (async () => {
			try {
				const { renderIcon } = await loadSpritore();
				const nextRenderedSprites = new SvelteMap<string, RenderedLocalSprite>();
				const nextDimensions: Record<string, LocalSpriteDimensions> = {};

				for (const [id, svg] of iconEntries) {
					const svgDimensions = spriteDimensionsFromSvg(svg);
					nextDimensions[id] = { svg, width: svgDimensions.width, height: svgDimensions.height };
					try {
						const cached = renderedLocalSprites.get(id);
						const rendered =
							cached?.svg === svg ? cached : { ...(await renderIcon(id, svg, 2)), svg };
						nextRenderedSprites.set(id, rendered);

						if (!svgDimensions.hasIntegerSizeAttributes) {
							const oneX = await renderIcon(id, svg, 1);
							nextDimensions[id] = { svg, width: oneX.width, height: oneX.height };
						}
					} catch {
						// SpritesDialog reports invalid SVG details. Invalid icons are not added to the map.
					}
				}

				if (generation !== spriteSyncGeneration) return;
				renderedLocalSprites = nextRenderedSprites;
				localSpriteDimensions.clear();
				for (const [id, dimensions] of Object.entries(nextDimensions)) {
					localSpriteDimensions.set(id, dimensions);
				}

				if (!map || backgroundMap.map !== map) return;
				for (const [id, sprite] of nextRenderedSprites) {
					if (synchronizedIconSvgs.get(id) === sprite.svg && map.hasImage(id)) continue;
					try {
						addLocalSprite(map, sprite);
						synchronizedIconSvgs.set(id, sprite.svg);
					} catch {
						synchronizedIconSvgs.delete(id);
					}
				}
			} catch {
				// The dialog surfaces initialization errors; the editor remains usable without local sprites.
			}
		})();

		return () => {
			if (generation === spriteSyncGeneration) spriteSyncGeneration += 1;
		};
	});

	$effect(() => {
		const map = backgroundMap.map;
		if (!map) return;

		const handleStyleImageMissing = (event: MapStyleImageMissingEvent) => {
			const svg = spriteIconsStore.icons[event.id];
			if (svg === undefined) return;
			const cached = renderedLocalSprites.get(event.id);
			if (cached?.svg === svg) {
				try {
					addLocalSprite(map, cached);
					synchronizedIconSvgs.set(event.id, svg);
				} catch {
					// A later styleimagemissing event retries the registration.
				}
				return;
			}

			void loadSpritore()
				.then(async ({ renderIcon }) => {
					if (backgroundMap.map !== map || spriteIconsStore.icons[event.id] !== svg) return;
					const rendered = { ...(await renderIcon(event.id, svg, 2)), svg };
					if (backgroundMap.map !== map || spriteIconsStore.icons[event.id] !== svg) return;
					renderedLocalSprites.set(event.id, rendered);
					addLocalSprite(map, rendered);
					synchronizedIconSvgs.set(event.id, svg);
				})
				.catch(() => undefined);
		};

		map.on('styleimagemissing', handleStyleImageMissing);
		return () => map.off('styleimagemissing', handleStyleImageMissing);
	});

	const editorApi: EditorApi = {
		getStyle: () => store.mapStyle,
		setStyle: (style) => store.setMapStyle(style),
		setPreview: (preview) => (previewState = preview),
		getPreview: () => previewState,
		registerStyleHistoryProvider: (provider) => styleHistory.register(provider)
	};
	for (const module of adapterModules) {
		setContext(`module:${module.id}`, module.setup?.(editorApi));
	}

	const handleChangeLayerOrder = (layers: LayerSpecification[]) => {
		if (previewState) return;
		store.setMapStyle((currentStyle) => ({ ...currentStyle, layers }));
	};

	const handleGroupLayersByPrefix = (): number => {
		if (previewState) return 0;
		const grouping = groupLayersByIdPrefix(store.mapStyle.layers);
		if (grouping.groupCount === 0) return 0;
		store.setMapStyle((currentStyle) => ({ ...currentStyle, layers: grouping.layers }));
		return grouping.groupCount;
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

	const toggleStyleJsonMode = () => {
		styleJsonMode = !styleJsonMode;
		if (styleJsonMode) expressionFlyout.close();
	};

	const handleApplyStyleJson = (style: StyleSpecification) => {
		if (previewState) return;
		store.setMapStyle(style);
	};

	const handleExport = () => {
		const style = $state.snapshot(store.mapStyle as object) as StyleSpecification;
		const styleExport = createStyleExport(style);
		const blob = new Blob([styleExport.contents], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = styleExport.fileName;
		anchor.click();
		URL.revokeObjectURL(url);
	};

	const handleOpenSprites = () => {
		spritesDialogOpen = true;
		void loadSpritore().catch(() => undefined);
	};

	const handleOpenFonts = () => {
		fontsDialogOpen = true;
		void loadGlyphore().catch(() => undefined);
	};

	const handleRenameStyle = (name: string) => {
		if (previewState || name.trim() === '' || name === (store.mapStyle.name ?? '')) return;
		store.setMapStyle((currentStyle) => ({ ...currentStyle, name }));
	};

	const handleSelectLayer = (layer: LayerSpecification) => {
		selectedLayerId = layer.id;
		layerSelectionRequest += 1;
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
			target.closest('input, textarea, select, [contenteditable="true"], .cm-editor')
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
	onDestroy(fontsStore.destroy);
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

{#if store.isLoading || spriteIconsStore.isLoading || fontsStore.isLoading}
	<div class="flex min-h-screen items-center justify-center text-sm text-gray-600">
		Loading map style...
	</div>
{:else}
	<div class="relative flex max-h-screen min-h-screen w-full flex-row overflow-hidden">
		<MapPanel
			mapStyle={effectiveStyle}
			hasLocalFonts={Object.keys(fontsStore.fonts).length > 0}
			onClickLayer={handleSelectLayer}
		/>
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
				class="w-[20rem] max-w-[22rem] min-w-[18rem]"
				mapStyle={effectiveStyle}
				layerErrors={validation.layerErrors}
				onChangeLayerOrder={handleChangeLayerOrder}
				selectedLayerId={effectiveSelectedLayerId}
				canUndo={!previewState && store.canUndo}
				canRedo={!previewState && store.canRedo}
				onClickUndo={() => store.undo()}
				onClickRedo={() => store.redo()}
				{styleJsonMode}
				onToggleStyleJsonMode={toggleStyleJsonMode}
				onClickExport={handleExport}
				onClickImport={() => (importDialogOpen = true)}
				onClickSettings={() => (settingsDialogOpen = true)}
				onRenameStyle={previewState ? undefined : handleRenameStyle}
				onClickAddLayer={() => (addLayerDialogOpen = true)}
				onClickSources={() => (sourcesDialogOpen = true)}
				onClickSprites={handleOpenSprites}
				onClickFonts={handleOpenFonts}
				canGroupLayersByPrefix={!previewState}
				onGroupLayersByPrefix={handleGroupLayersByPrefix}
				onClickLayer={handleSelectLayer}
				{adapterModules}
			/>

			<ControlPanel class="flex-1" />

			{#if !styleJsonMode && flyoutVisible && expressionFlyout.target && flyoutPositionAnchor}
				<Popover.Root open={true}>
					<Popover.Portal>
						<Popover.Content
							class="pointer-events-auto z-50 w-[24rem] max-w-[calc(100vw-1rem)]"
							customAnchor={flyoutPositionAnchor}
							side="left"
							align="start"
							sideOffset={12}
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

			{#if styleJsonMode}
				<StyleJsonPanel
					class="w-[min(42rem,42vw)] min-w-[25rem]"
					mapStyle={effectiveStyle}
					selectedLayerId={effectiveSelectedLayerId}
					{layerSelectionRequest}
					readOnly={previewState !== null}
					onApply={handleApplyStyleJson}
				/>
			{:else}
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
			{/if}
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
		{#if spritesDialogOpen}
			<SpritesDialog
				bind:open={spritesDialogOpen}
				icons={spriteIconsStore.icons}
				onSetIcon={spriteIconsStore.setIcon}
				onRemoveIcon={spriteIconsStore.removeIcon}
			/>
		{/if}
		{#if fontsDialogOpen}
			<FontsDialog
				bind:open={fontsDialogOpen}
				fonts={fontsStore.fonts}
				onAddFont={fontsStore.addFont}
				onRemoveFont={fontsStore.removeFont}
				getLoadedFont={fontsStore.getLoadedFont}
			/>
		{/if}
		{#each adapterModules as module (module.id)}
			{#each module.overlays ?? [] as Overlay, index (`${module.id}-${index}`)}
				<Overlay />
			{/each}
		{/each}
	</div>
{/if}
