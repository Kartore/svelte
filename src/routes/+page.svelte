<script lang="ts">
	import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
	import { onDestroy, onMount, setContext, tick } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';

	import appPackage from '../../package.json';

	import { RowPopover } from '#lib/components/common/RowPopover';
	import {
		isFilterBuilderSupported,
		parseFilter,
		serializeFilter
	} from '#lib/components/common/FilterQueryBuilder';
	import { isExpression } from '#lib/components/common/FilterInputField/expressions/utils/isExpression.ts';
	import { ImportStyleDialog } from '#lib/components/editor/ImportStyleDialog';
	import {
		collectInspectSourceLayers,
		createInspectDataStyle,
		type InspectedFeature,
		type InspectHoverResult,
		type InspectLegendEntry,
		type InspectPointResult,
		type InspectSourceMetadata,
		type InspectView
	} from '#lib/components/editor/InspectMode';
	import { LayerInspector, type LayerInspectorTab } from '#lib/components/editor/LayerInspector';
	import { ExpressionPopoverPanel } from '#lib/components/editor/PropertiesPanel/ExpressionPopoverPanel';
	import type { onChangeType } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { replaceLayerData } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { provideLocalSpriteImages } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSpriteIds/localSpriteImages.ts';
	import { StyleJsonPanel } from '#lib/components/editor/StyleJsonPanel';
	import {
		CommandPalette,
		EmptyPropertiesDock,
		MapViewport,
		PropertiesDock,
		Rail,
		ResizableSidebar,
		SecondColumn,
		TopBar
	} from '#lib/components/shell';
	import {
		DEFAULT_PROPERTIES_PANEL_WIDTH,
		DEFAULT_SIDEBAR_WIDTH,
		MAX_PROPERTIES_PANEL_WIDTH,
		MAX_SIDEBAR_WIDTH,
		MIN_PROPERTIES_PANEL_WIDTH,
		MIN_SIDEBAR_WIDTH,
		normalizePropertiesPanelWidth,
		normalizeSidebarWidth
	} from '#lib/components/shell/sidebarSize.ts';
	import { provideBackgroundMap } from '#lib/contexts/backgroundMap.svelte.ts';
	import { provideEditorCommands } from '#lib/contexts/editorCommands.svelte.ts';
	import { provideExpressionFlyout } from '#lib/contexts/expressionFlyout.svelte.ts';
	import { provideStyleHistory } from '#lib/contexts/styleHistory.svelte.ts';
	import { provideStyleVariables } from '#lib/contexts/styleVariables.svelte.ts';
	import type {
		EditorApi,
		EditorPreview,
		EditorProject,
		SaveProvider
	} from '#lib/editor/EditorModule.ts';
	import { collectEditorRailItems } from '#lib/editor/editorRail.ts';
	import { applyProjectLoad } from '#lib/editor/projectLoad.ts';
	import { dispatchSave } from '#lib/editor/saveProvider.ts';
	import { registerGlyphProtocol } from '#lib/fonts/glyphProtocol.ts';
	import { loadGlyphore } from '#lib/fonts/glyphore.ts';
	import { adapterModules } from 'virtual:kartore-adapter';
	import {
		MapSpriteSynchronizer,
		type LocalSpriteDimensions
	} from '#lib/sprites/mapSpriteSynchronizer.ts';
	import { spriteDimensionsFromSvg, svgDataUrl } from '#lib/sprites/spriteSvg.ts';
	import { localStorageMapStyleStoreAdapter, MapStyleStore } from '#lib/stores/mapStyle';
	import { FontsStore, indexedDbFontsStoreAdapter } from '#lib/stores/fonts';
	import { localStorageSpriteIconsStoreAdapter, SpriteIconsStore } from '#lib/stores/spriteIcons';
	import { groupLayersByIdPrefix } from '#lib/utils/layerGroup.ts';
	import { COLOR_VISION_MODE_LABELS, type ColorVisionMode } from '#lib/utils/colorVision.ts';
	import { createStyleExport } from '#lib/utils/styleExport.ts';
	import { createEmptyStyle } from '#lib/utils/styleCreate.ts';
	import { getLayerRawPropertyValue, type RootPropertyKind } from '#lib/utils/layerSpec.ts';
	import { getPropertyInitialValue, type PropertyCatalogItem } from '#lib/utils/propertyCatalog.ts';
	import { normalizeStyleVariables } from '#lib/utils/styleVariables.ts';
	import {
		replaceStyleRootData,
		replaceStyleSettingData,
		setStyleRootObject,
		type StyleSettingChange
	} from '#lib/utils/styleRoot.ts';
	import { validateMapStyle, type StyleValidationResult } from '#lib/utils/styleValidation.ts';
	import type { ShellMode } from '#lib/components/shell/shellMode.ts';

	const store = new MapStyleStore({
		adapter: localStorageMapStyleStoreAdapter,
		initialStyle: createEmptyStyle()
	});
	const spriteIconsStore = new SpriteIconsStore({
		adapter: localStorageSpriteIconsStoreAdapter
	});
	const fontsStore = new FontsStore({
		adapter: indexedDbFontsStoreAdapter
	});
	const SHELL_STORAGE_KEY = 'kartore:shell';
	const adapterRailItems = collectEditorRailItems(adapterModules);

	const backgroundMap = provideBackgroundMap();
	provideEditorCommands();
	const expressionFlyout = provideExpressionFlyout();
	const styleHistory = provideStyleHistory();
	const saveProviders: SaveProvider[] = [];
	const newStyleHandlers: (() => void)[] = [];
	const localSpriteDimensions = new SvelteMap<string, LocalSpriteDimensions>();
	provideLocalSpriteImages(() =>
		Object.entries(spriteIconsStore.icons).map(([id, svg]) => {
			const fallback = spriteDimensionsFromSvg(svg);
			const rendered = localSpriteDimensions.get(id);
			const dimensions = rendered?.svg === svg ? rendered : fallback;
			return {
				id,
				src: svgDataUrl(svg, dimensions),
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

	let selectedLayerId = $state<string | null>(null);
	let activeShellMode = $state<ShellMode>('layers');
	let layerSelectionRequest = $state(0);
	let layerSearchInput = $state<HTMLInputElement | null>(null);
	let layerDragActive = $state(false);
	let importDialogOpen = $state(false);
	let addLayerPopoverOpen = $state(false);
	let styleJsonMode = $state(false);
	let activeLayerTab = $state<LayerInspectorTab>('design');
	let commandPaletteOpen = $state(false);
	let previewState = $state<EditorPreview | null>(null);
	let initialProjectLoading = $state(true);
	let initialProjectError = $state<Error | null>(null);
	let leftShellCollapsed = $state(false);
	let sidebarWidth = $state(normalizeSidebarWidth(undefined));
	let propertiesPanelWidth = $state(normalizePropertiesPanelWidth(undefined));
	let paletteSelectionLabel = $state<string | null>(null);
	let colorVisionMode = $state<ColorVisionMode>('none');
	let inspectActive = $state(false);
	let inspectSession = $state(0);
	let inspectView = $state<InspectView>('style');
	let inspectLegend = $state.raw<InspectLegendEntry[]>([]);
	let inspectHiddenDataKeys = $state.raw<ReadonlySet<string>>(new SvelteSet());
	let inspectHover = $state.raw<InspectHoverResult | null>(null);
	let inspectPopup = $state.raw<InspectPointResult | null>(null);
	let inspectSelectedIndex = $state(0);
	let inspectPopoverHighlight = $state.raw<InspectedFeature | null>(null);
	let inspectTileBoundaries = $state(false);
	let inspectSourceMetadata = $state.raw<Record<string, InspectSourceMetadata | undefined>>({});
	let inspectStylePreview = $state.raw<StyleSpecification | null>(null);
	let inspectPreviousPreview = $state.raw<EditorPreview | null>(null);
	let inspectPreviousFilterHighlight = $state.raw(backgroundMap.filterHighlight);
	let inspectPreviousTileBoundaries = false;
	let inspectMetadataGeneration = 0;
	const inspectHighlight = $derived(
		inspectPopoverHighlight ??
			(inspectPopup
				? (inspectPopup.features[inspectSelectedIndex] ?? inspectPopup.features[0] ?? null)
				: (inspectHover?.feature ?? null))
	);
	const activeAdapterRailItem = $derived(
		adapterRailItems.find((item) => item.mode === activeShellMode) ?? null
	);

	onMount(() => {
		try {
			const stored = JSON.parse(localStorage.getItem(SHELL_STORAGE_KEY) ?? '{}') as {
				leftCollapsed?: unknown;
				sidebarWidth?: unknown;
				propertiesPanelWidth?: unknown;
			};
			leftShellCollapsed = stored.leftCollapsed === true;
			sidebarWidth = normalizeSidebarWidth(stored.sidebarWidth);
			propertiesPanelWidth = normalizePropertiesPanelWidth(stored.propertiesPanelWidth);
		} catch {
			leftShellCollapsed = false;
			sidebarWidth = normalizeSidebarWidth(undefined);
			propertiesPanelWidth = normalizePropertiesPanelWidth(undefined);
		}
	});

	const persistShellState = () => {
		localStorage.setItem(
			SHELL_STORAGE_KEY,
			JSON.stringify({ leftCollapsed: leftShellCollapsed, sidebarWidth, propertiesPanelWidth })
		);
	};

	const setLeftShellCollapsed = (collapsed: boolean) => {
		leftShellCollapsed = collapsed;
		persistShellState();
	};

	const handleLeftSidebarResizeEnd = (width: number) => {
		sidebarWidth = normalizeSidebarWidth(width);
		persistShellState();
	};

	const handlePropertiesPanelResizeEnd = (width: number) => {
		propertiesPanelWidth = normalizePropertiesPanelWidth(width);
		persistShellState();
	};

	const openAdapterRailItem = (moduleId: string, railItemId: string) => {
		const item = adapterRailItems.find(
			(candidate) => candidate.moduleId === moduleId && candidate.id === railItemId
		);
		if (!item) return;
		expressionFlyout.close();
		activeShellMode = item.mode;
		styleJsonMode = false;
		if (leftShellCollapsed) setLeftShellCollapsed(false);
	};

	provideStyleVariables(store, () => previewState === null);
	const effectiveStyle = $derived(previewState?.style ?? store.mapStyle);
	const editorStyle = $derived(
		inspectActive && inspectStylePreview ? inspectStylePreview : effectiveStyle
	);

	const absoluteTileTemplate = (template: string, tileJsonUrl: string): string => {
		try {
			return new URL(template, tileJsonUrl).href.replaceAll('%7B', '{').replaceAll('%7D', '}');
		} catch {
			return template;
		}
	};
	const refreshInspectDataView = () => {
		if (!inspectActive || !inspectStylePreview) return;
		const sourceLayers = collectInspectSourceLayers(inspectStylePreview, inspectSourceMetadata);
		const generated = createInspectDataStyle(
			inspectStylePreview,
			sourceLayers,
			inspectHiddenDataKeys
		);
		inspectLegend = generated.legend;
		previewState = { label: 'データビュー', style: generated.style };
	};
	const setInspectView = (view: InspectView) => {
		if (!inspectActive || !inspectStylePreview || inspectView === view) return;
		inspectView = view;
		inspectHover = null;
		inspectPopup = null;
		inspectPopoverHighlight = null;
		if (view === 'data') refreshInspectDataView();
		else previewState = { label: 'ポイント検査', style: inspectStylePreview };
	};
	const toggleInspectLegendEntry = (key: string) => {
		const next = new SvelteSet(inspectHiddenDataKeys);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		inspectHiddenDataKeys = next;
		if (inspectView === 'data') refreshInspectDataView();
	};
	const loadInspectSourceMetadata = async (
		style: StyleSpecification,
		generation: number
	): Promise<void> => {
		const entries = await Promise.all(
			Object.entries(style.sources).map(async ([sourceId, source]) => {
				const sourceRecord = source as unknown as Record<string, unknown>;
				const direct: InspectSourceMetadata = {
					tiles: Array.isArray(sourceRecord.tiles)
						? sourceRecord.tiles.filter((tile): tile is string => typeof tile === 'string')
						: undefined,
					minzoom: typeof sourceRecord.minzoom === 'number' ? sourceRecord.minzoom : undefined,
					maxzoom: typeof sourceRecord.maxzoom === 'number' ? sourceRecord.maxzoom : undefined
				};
				if (typeof sourceRecord.url !== 'string' || !/^https?:/i.test(sourceRecord.url)) {
					return [sourceId, direct] as const;
				}

				try {
					const tileJsonUrl = new URL(sourceRecord.url, document.baseURI).href;
					const response = await fetch(tileJsonUrl);
					if (!response.ok) return [sourceId, direct] as const;
					const tileJson = (await response.json()) as InspectSourceMetadata;
					return [
						sourceId,
						{
							...direct,
							...tileJson,
							tiles: (tileJson.tiles ?? direct.tiles)?.map((template) =>
								absoluteTileTemplate(template, tileJsonUrl)
							),
							vector_layers: tileJson.vector_layers?.filter((layer) => typeof layer.id === 'string')
						}
					] as const;
				} catch {
					return [sourceId, direct] as const;
				}
			})
		);
		if (!inspectActive || generation !== inspectMetadataGeneration) return;
		inspectSourceMetadata = Object.fromEntries(entries);
		if (inspectView === 'data') refreshInspectDataView();
	};

	const beginInspectMode = () => {
		if (inspectActive) return;
		store.cancelStyleTransient();
		inspectPreviousPreview = previewState;
		inspectPreviousFilterHighlight = backgroundMap.filterHighlight;
		backgroundMap.filterHighlight = null;
		inspectPreviousTileBoundaries = backgroundMap.map?.showTileBoundaries ?? false;
		inspectTileBoundaries = inspectPreviousTileBoundaries;
		inspectStylePreview = structuredClone(
			$state.snapshot(effectiveStyle as object) as StyleSpecification
		);
		previewState = { label: 'ポイント検査', style: inspectStylePreview };
		inspectActive = true;
		inspectSession += 1;
		inspectView = 'style';
		inspectLegend = [];
		inspectHiddenDataKeys = new SvelteSet();
		inspectHover = null;
		inspectPopup = null;
		inspectSelectedIndex = 0;
		inspectPopoverHighlight = null;
		inspectSourceMetadata = {};
		inspectMetadataGeneration += 1;
		void loadInspectSourceMetadata(inspectStylePreview, inspectMetadataGeneration);
	};

	const endInspectMode = () => {
		if (!inspectActive) return;
		inspectMetadataGeneration += 1;
		inspectActive = false;
		inspectSession += 1;
		inspectView = 'style';
		inspectLegend = [];
		inspectHiddenDataKeys = new SvelteSet();
		inspectHover = null;
		inspectPopup = null;
		inspectSelectedIndex = 0;
		inspectPopoverHighlight = null;
		inspectSourceMetadata = {};
		backgroundMap.filterHighlight = inspectPreviousFilterHighlight;
		if (backgroundMap.map) {
			backgroundMap.map.showTileBoundaries = inspectPreviousTileBoundaries;
		}
		inspectTileBoundaries = inspectPreviousTileBoundaries;
		previewState = inspectPreviousPreview;
		inspectStylePreview = null;
		inspectPreviousPreview = null;
	};

	const toggleInspectMode = () => {
		if (inspectActive) endInspectMode();
		else beginInspectMode();
	};
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
	const selectedLayer = $derived<LayerSpecification | undefined>(
		editorStyle.layers.find((layer) => layer.id === selectedLayerId) ?? editorStyle.layers[0]
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

	const validation = $derived(
		validateMapStyle(
			$state.snapshot(editorStyle as object) as StyleSpecification
		) as StyleValidationResult
	);
	const spriteMapSynchronizer = new MapSpriteSynchronizer((dimensions) => {
		localSpriteDimensions.clear();
		for (const [id, value] of Object.entries(dimensions)) {
			localSpriteDimensions.set(id, value);
		}
	});
	const spriteSyncInput = $derived({
		map: backgroundMap.map,
		icons: spriteIconsStore.icons
	});
	$effect(() => {
		spriteMapSynchronizer.input = spriteSyncInput;
	});
	const loadProject = async (project: EditorProject): Promise<void> => {
		previewState = null;
		await applyProjectLoad(
			{
				replaceStyle: store.replaceMapStyle,
				replaceSpriteIcons: spriteIconsStore.replaceIcons,
				replaceStoredFonts: fontsStore.replaceStoredFonts
			},
			project
		);
	};

	const editorApi: EditorApi = {
		appVersion: appPackage.version,
		getStyle: () => store.mapStyle,
		setStyle: (style) => store.setMapStyle(style),
		loadProject,
		getSpriteIcons: () => $state.snapshot(spriteIconsStore.icons),
		replaceSpriteIcons: spriteIconsStore.replaceIcons,
		getStoredFonts: fontsStore.getStoredFonts,
		replaceStoredFonts: fontsStore.replaceStoredFonts,
		setPreview: (preview) => (previewState = preview),
		getPreview: () => previewState,
		registerStyleHistoryProvider: (provider) => styleHistory.register(provider),
		registerSaveProvider: (provider) => saveProviders.push(provider),
		registerNewStyleHandler: (handler) => newStyleHandlers.push(handler),
		openRailItem: openAdapterRailItem
	};
	for (const module of adapterModules) {
		setContext(`module:${module.id}`, module.setup?.(editorApi));
	}

	const initializeProject = async (): Promise<void> => {
		try {
			await Promise.all([store.ready, spriteIconsStore.ready, fontsStore.ready]);
			if (!store.needsInitialProject) return;
			const { loadInitialProject } = await import('#lib/samples/initialProject.ts');
			await loadProject(await loadInitialProject());
		} catch (error) {
			initialProjectError = error instanceof Error ? error : new Error(String(error));
		} finally {
			initialProjectLoading = false;
		}
	};
	onMount(() => {
		void initializeProject();
	});

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
	const handleChangeLayerDataTransient: onChangeType = (layer, group, key, value) => {
		if (previewState) return;
		store.setStyleTransient((currentStyle) =>
			replaceLayerData(currentStyle, layer, group, key, value)
		);
	};
	const handleCommitLayerData: onChangeType = (layer, group, key, value) => {
		if (previewState) return;
		store.commitStyle((currentStyle) => replaceLayerData(currentStyle, layer, group, key, value));
	};

	const handleChangeStyleRoot = (kind: RootPropertyKind, key: string, value: unknown) => {
		if (previewState) return;
		store.setMapStyle((currentStyle) => replaceStyleRootData(currentStyle, kind, key, value));
	};

	const handleChangeStyleSetting: StyleSettingChange = (key, value) => {
		if (previewState) return;
		if (JSON.stringify(store.mapStyle[key]) === JSON.stringify(value)) return;
		store.setMapStyle((currentStyle) => replaceStyleSettingData(currentStyle, key, value));
	};

	const handleSetStyleRootObject = (kind: RootPropertyKind, value: object | undefined) => {
		if (previewState) return;
		store.setMapStyle((currentStyle) => setStyleRootObject(currentStyle, kind, value));
	};

	const handleImport = (style: StyleSpecification) => {
		if (previewState) return;
		store.setMapStyle(normalizeStyleVariables(style));
	};

	const handleNewStyle = () => {
		if (inspectActive) endInspectMode();
		previewState = null;
		store.cancelStyleTransient();
		expressionFlyout.close();
		for (const handler of newStyleHandlers) handler();
		backgroundMap.filterHighlight = null;
		paletteSelectionLabel = null;
		activeShellMode = 'layers';
		styleJsonMode = false;
		addLayerPopoverOpen = false;
		selectedLayerId = null;
		store.setMapStyle(createEmptyStyle());
	};

	const handleApplyStyle = (style: StyleSpecification) => {
		if (previewState) return;
		store.setMapStyle(style);
	};

	const handleShowWholeStyleJson = () => {
		expressionFlyout.close();
		activeShellMode = 'settings';
		styleJsonMode = true;
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

	const handleSave = () => {
		void dispatchSave(saveProviders, handleExport);
	};

	const handleRenameStyle = (name: string) => {
		if (previewState || name.trim() === '' || name === (store.mapStyle.name ?? '')) return;
		store.setMapStyle((currentStyle) => ({ ...currentStyle, name }));
	};

	const handleSelectLayer = (layer: LayerSpecification) => {
		expressionFlyout.close();
		styleJsonMode = false;
		selectedLayerId = layer.id;
		layerSelectionRequest += 1;
	};

	const inspectLayerForFeature = (feature: InspectedFeature): LayerSpecification | undefined => {
		const style = inspectStylePreview;
		if (!style) return undefined;
		const exact = style.layers.find(({ id }) => id === feature.layerId);
		if (exact) return exact;
		return [...style.layers]
			.reverse()
			.find(
				(layer) =>
					'source' in layer &&
					layer.source === feature.sourceId &&
					(feature.sourceLayer === undefined ||
						('source-layer' in layer && layer['source-layer'] === feature.sourceLayer))
			);
	};
	const handleInspectClick = (result: InspectPointResult) => {
		inspectPopup = result;
		inspectSelectedIndex = 0;
		inspectHover = null;
		inspectPopoverHighlight = null;
	};
	const handleInspectSelectLayer = (feature: InspectedFeature) => {
		const layer = inspectLayerForFeature(feature);
		if (!layer) return;
		activeShellMode = 'layers';
		styleJsonMode = false;
		handleSelectLayer(layer);
	};
	const handleInspectFilterProperty = (
		feature: InspectedFeature,
		key: string,
		value: string | number | boolean
	) => {
		const layer = inspectLayerForFeature(feature);
		if (!layer || layer.type === 'background' || !inspectStylePreview) return;
		if (inspectView === 'data') setInspectView('style');
		handleInspectSelectLayer(feature);
		activeLayerTab = 'filter';
		const tree = parseFilter(layer.filter);
		if (!isFilterBuilderSupported(tree)) return;
		const filter = serializeFilter({
			...tree,
			children: [
				...tree.children,
				{
					kind: 'comparison' as const,
					op: '==' as const,
					subject: { kind: 'property' as const, key },
					value
				}
			]
		});
		inspectStylePreview = {
			...inspectStylePreview,
			layers: inspectStylePreview.layers.map((currentLayer) =>
				currentLayer.id === layer.id
					? ({ ...currentLayer, filter } as LayerSpecification)
					: currentLayer
			)
		};
		previewState = { label: 'ポイント検査', style: inspectStylePreview };
		inspectPopup = null;
		inspectPopoverHighlight = null;
	};
	const handleInspectTileBoundariesChange = (visible: boolean) => {
		inspectTileBoundaries = visible;
		if (backgroundMap.map) backgroundMap.map.showTileBoundaries = visible;
	};
	const closeInspectPopup = () => {
		inspectPopup = null;
		inspectPopoverHighlight = null;
	};

	const handleToggleLayerVisibility = (layer: LayerSpecification, visible: boolean) => {
		handleChangeLayerData(layer, 'layout', 'visibility', visible ? 'visible' : 'none');
	};

	const handleShowLayers = () => {
		expressionFlyout.close();
		activeShellMode = 'layers';
		styleJsonMode = false;
	};

	const handleShowStyleSettings = () => {
		expressionFlyout.close();
		activeShellMode = 'settings';
		styleJsonMode = false;
	};

	const handleShowPalette = () => {
		expressionFlyout.close();
		activeShellMode = 'palette';
		styleJsonMode = false;
	};

	const handleOpenAddLayer = () => {
		expressionFlyout.close();
		activeShellMode = 'layers';
		styleJsonMode = false;
		if (leftShellCollapsed) setLeftShellCollapsed(false);
		addLayerPopoverOpen = true;
	};

	const handleApplyLayer = (nextLayer: LayerSpecification, previousId: string) => {
		if (previewState) return;
		if (
			nextLayer.id !== previousId &&
			store.mapStyle.layers.some((layer) => layer.id === nextLayer.id)
		) {
			return;
		}
		store.setMapStyle((currentStyle) => ({
			...currentStyle,
			layers: currentStyle.layers.map((layer) => (layer.id === previousId ? nextLayer : layer))
		}));
		selectedLayerId = nextLayer.id;
	};

	const handleCommandSelectProperty = async (item: PropertyCatalogItem) => {
		if (!selectedLayer) return;
		expressionFlyout.close();
		activeShellMode = 'layers';
		styleJsonMode = false;
		activeLayerTab = 'design';
		if (getLayerRawPropertyValue(selectedLayer, item.group, item.key) === undefined) {
			handleChangeLayerData(
				selectedLayer,
				item.group,
				item.key as never,
				getPropertyInitialValue(item) as never
			);
		}
		await tick();
		await tick();
		const row = document.querySelector<HTMLElement>(
			`[data-property-row="${CSS.escape(`${item.group}:${item.key}`)}"]`
		);
		row?.scrollIntoView({ block: 'nearest' });
		row?.querySelector<HTMLElement>('input, button, [tabindex]')?.focus();
	};

	const duplicateId = (baseId: string, layers: LayerSpecification[]): string => {
		let candidate = `${baseId} copy`;
		for (let n = 2; layers.some((layer) => layer.id === candidate); n++) {
			candidate = `${baseId} copy ${n}`;
		}
		return candidate;
	};

	const handleAddLayer = (layer: LayerSpecification, aboveLayerId?: string) => {
		expressionFlyout.close();
		activeShellMode = 'layers';
		if (previewState) return;
		store.setMapStyle((currentStyle) => {
			const layers = [...currentStyle.layers];
			const index = aboveLayerId
				? layers.findIndex(({ id }) => id === aboveLayerId) + 1
				: layers.length;
			layers.splice(index > 0 ? index : layers.length, 0, layer);
			return { ...currentStyle, layers };
		});
		selectedLayerId = layer.id;
	};

	const handleDuplicateLayer = () => {
		if (previewState || !selectedLayer) return;
		expressionFlyout.close();
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
		if (previewState || selectedLayerId === null) return;
		expressionFlyout.close();
		store.setMapStyle((currentStyle) => {
			const index = currentStyle.layers.findIndex((layer) => layer.id === selectedLayerId);
			if (index === -1) return currentStyle;
			const layers = currentStyle.layers.filter((_, i) => i !== index);
			selectedLayerId = (layers[index] ?? layers[index - 1])?.id ?? null;
			return { ...currentStyle, layers };
		});
	};

	const handleUseCurrentView = () => {
		if (previewState) return;
		const map = backgroundMap.map;
		const center = map?.getCenter();
		store.setMapStyle((currentStyle) => ({
			...currentStyle,
			center: center ? [center.lng, center.lat] : [backgroundMap.longitude, backgroundMap.latitude],
			zoom: map?.getZoom() ?? backgroundMap.zoom ?? currentStyle.zoom,
			bearing: map?.getBearing() ?? backgroundMap.bearing,
			pitch: map?.getPitch() ?? backgroundMap.pitch
		}));
	};

	const handleRevertStyle = (style: StyleSpecification) => {
		previewState = null;
		store.setMapStyle(style);
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		const hasCommandModifier = event.metaKey || event.ctrlKey;
		if (hasCommandModifier && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'n') {
			event.preventDefault();
			if (!event.repeat) handleNewStyle();
			return;
		}
		if (hasCommandModifier && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 's') {
			event.preventDefault();
			if (!event.repeat) handleSave();
			return;
		}
		if (hasCommandModifier && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			if (!event.repeat) commandPaletteOpen = true;
			return;
		}
		if (
			!hasCommandModifier &&
			!event.altKey &&
			event.key === 'Escape' &&
			colorVisionMode !== 'none'
		) {
			event.preventDefault();
			if (!event.repeat) colorVisionMode = 'none';
			return;
		}
		if (!hasCommandModifier && !event.altKey && event.key === 'Escape' && inspectActive) {
			event.preventDefault();
			if (!event.repeat) endInspectMode();
			return;
		}

		const target = event.target;
		if (
			target instanceof HTMLElement &&
			target.closest(
				'input, textarea, select, [contenteditable="true"], .cm-editor, [role="dialog"], [role="alertdialog"]'
			)
		) {
			return;
		}
		if (importDialogOpen || addLayerPopoverOpen || layerDragActive) {
			return;
		}
		if (
			!hasCommandModifier &&
			!event.altKey &&
			!event.shiftKey &&
			event.key.toLowerCase() === 'i'
		) {
			event.preventDefault();
			if (!event.repeat) toggleInspectMode();
			return;
		}

		if (hasCommandModifier && !event.altKey && !event.shiftKey && /^[1-6]$/.test(event.key)) {
			const modes: Record<string, ShellMode> = {
				'1': 'layers',
				'2': 'palette',
				'3': 'sources',
				'4': 'sprites',
				'5': 'fonts',
				'6': 'history'
			};
			const mode = modes[event.key];
			if (mode === 'history' && !styleHistory.provider?.available) return;
			event.preventDefault();
			if (!event.repeat) {
				expressionFlyout.close();
				activeShellMode = mode;
				styleJsonMode = false;
			}
			return;
		}

		if (hasCommandModifier && !event.altKey && !event.shiftKey && event.key === '.') {
			event.preventDefault();
			if (!event.repeat) setLeftShellCollapsed(!leftShellCollapsed);
			return;
		}

		if (!hasCommandModifier && !event.altKey && event.key === '/') {
			event.preventDefault();
			commandPaletteOpen = true;
			return;
		}

		if (
			!hasCommandModifier &&
			!event.altKey &&
			!event.shiftKey &&
			activeShellMode === 'layers' &&
			(event.key === 'Backspace' || event.key === 'Delete')
		) {
			if (event.repeat) return;
			event.preventDefault();
			handleDeleteLayer();
			return;
		}

		if (!hasCommandModifier || event.key.toLowerCase() !== 'z') return;
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

	// 保存は 500ms デバウンスされるため、SPA 遷移によるアンマウント時に
	// 未保存の編集が落ちないよう flush する
	onDestroy(() => {
		if (inspectActive) endInspectMode();
	});
	onDestroy(() => store.flushSave());
	onDestroy(spriteMapSynchronizer.destroy);
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

{#if store.isLoading || spriteIconsStore.isLoading || fontsStore.isLoading || initialProjectLoading}
	<div class="flex min-h-screen items-center justify-center text-[11px] text-ink-2">
		地図スタイルを読み込み中…
	</div>
{:else if initialProjectError}
	<div
		class="flex min-h-screen items-center justify-center bg-canvas px-6 text-center"
		role="alert"
	>
		<div class="max-w-md">
			<p class="text-sm font-semibold text-ink-1">初期プロジェクトを読み込めませんでした</p>
			<p class="mt-2 text-[11px] text-ink-2">{initialProjectError.message}</p>
		</div>
	</div>
{:else}
	<div class="flex h-screen w-full flex-col overflow-hidden bg-canvas">
		<TopBar
			mapStyle={editorStyle}
			{adapterModules}
			saveState={store.saveError ? 'error' : store.isSaving ? 'saving' : 'saved'}
			canUndo={!previewState && store.canUndo}
			canRedo={!previewState && store.canRedo}
			onUndo={() => store.undo()}
			onRedo={() => store.redo()}
			onNewStyle={handleNewStyle}
			onImport={() => (importDialogOpen = true)}
			onExport={handleExport}
			onRenameStyle={previewState ? undefined : handleRenameStyle}
			onAddLayer={handleOpenAddLayer}
			onGroupLayersByPrefix={previewState ? undefined : handleGroupLayersByPrefix}
			onOpenStyleSettings={handleShowStyleSettings}
			onOpenVariables={handleShowPalette}
			onOpenSources={() => {
				activeShellMode = 'sources';
				styleJsonMode = false;
			}}
			onOpenSprites={() => {
				activeShellMode = 'sprites';
				styleJsonMode = false;
			}}
			onOpenFonts={() => {
				activeShellMode = 'fonts';
				styleJsonMode = false;
			}}
			{colorVisionMode}
			onColorVisionModeChange={(mode) => (colorVisionMode = mode)}
			{leftShellCollapsed}
			onTogglePanels={() => setLeftShellCollapsed(!leftShellCollapsed)}
			onSearch={() => (commandPaletteOpen = true)}
		/>

		<div class="flex min-h-0 flex-1">
			{#if !leftShellCollapsed}
				<Rail
					activeMode={activeShellMode}
					historyAvailable={styleHistory.provider?.available ?? false}
					railItems={adapterRailItems}
					onLayers={handleShowLayers}
					onPalette={handleShowPalette}
					onSources={() => {
						activeShellMode = 'sources';
						styleJsonMode = false;
					}}
					onSprites={() => {
						activeShellMode = 'sprites';
						styleJsonMode = false;
					}}
					onFonts={() => {
						activeShellMode = 'fonts';
						styleJsonMode = false;
					}}
					onHistory={styleHistory.provider
						? () => {
								activeShellMode = 'history';
								styleJsonMode = false;
							}
						: undefined}
					onRailItem={(item) => openAdapterRailItem(item.moduleId, item.id)}
					onSettings={handleShowStyleSettings}
				/>
				<ResizableSidebar
					bind:width={sidebarWidth}
					minWidth={MIN_SIDEBAR_WIDTH}
					maxWidth={MAX_SIDEBAR_WIDTH}
					defaultWidth={DEFAULT_SIDEBAR_WIDTH}
					label="左サイドバーの幅を変更"
					onResizeEnd={handleLeftSidebarResizeEnd}
				>
					<SecondColumn
						activeMode={activeShellMode}
						moduleRailItem={activeAdapterRailItem}
						mapStyle={editorStyle}
						selectedLayerId={effectiveSelectedLayerId}
						layerErrors={validation.layerErrors}
						styleErrors={validation.styleErrors}
						readOnly={previewState !== null}
						spriteIcons={spriteIconsStore.icons}
						fonts={fontsStore.fonts}
						historyProvider={styleHistory.provider}
						bind:addLayerOpen={addLayerPopoverOpen}
						onClickLayer={handleSelectLayer}
						onChangeLayerOrder={handleChangeLayerOrder}
						onAddLayer={handleAddLayer}
						onToggleLayerVisibility={handleToggleLayerVisibility}
						bind:layerSearchInput
						onLayerDragActiveChange={(active) => (layerDragActive = active)}
						onApplyStyle={handleApplyStyle}
						onSetSpriteIcon={spriteIconsStore.setIcon}
						onRemoveSpriteIcon={spriteIconsStore.removeIcon}
						onAddFont={fontsStore.addFont}
						onRemoveFont={fontsStore.removeFont}
						getLoadedFont={fontsStore.getLoadedFont}
						getStoredFonts={fontsStore.getStoredFonts}
						onSetPreview={(preview) => (previewState = preview)}
						onRevertStyle={handleRevertStyle}
						onChangeStyleSetting={handleChangeStyleSetting}
						onChangeRoot={handleChangeStyleRoot}
						onSetRootObject={handleSetStyleRootObject}
						onOpenStyleJson={handleShowWholeStyleJson}
						onUseCurrentView={handleUseCurrentView}
						onPaletteSelectionChange={(label) => (paletteSelectionLabel = label)}
						onOpenPalette={handleShowPalette}
					/>
				</ResizableSidebar>
			{/if}

			<MapViewport
				mapStyle={effectiveStyle}
				hasLocalFonts={Object.keys(fontsStore.fonts).length > 0}
				onClickLayer={handleSelectLayer}
				{inspectActive}
				{inspectSession}
				{inspectView}
				{inspectLegend}
				{inspectHiddenDataKeys}
				{inspectHover}
				{inspectPopup}
				{inspectSelectedIndex}
				{inspectHighlight}
				{inspectTileBoundaries}
				{inspectSourceMetadata}
				{colorVisionMode}
				onToggleInspect={toggleInspectMode}
				onInspectViewChange={setInspectView}
				onInspectLegendToggle={toggleInspectLegendEntry}
				onInspectHover={(result) => (inspectHover = result)}
				onInspectClick={handleInspectClick}
				onInspectSelectFeature={(index) => {
					inspectSelectedIndex = index;
					inspectPopoverHighlight = null;
				}}
				onInspectHighlightFeature={(feature) => (inspectPopoverHighlight = feature)}
				onInspectFilterProperty={handleInspectFilterProperty}
				onInspectSelectLayer={handleInspectSelectLayer}
				onInspectTileBoundariesChange={handleInspectTileBoundariesChange}
				onInspectClosePopup={closeInspectPopup}
			>
				{#if leftShellCollapsed}
					<button
						type="button"
						class="absolute top-3 left-3 z-20 h-7 cursor-pointer rounded-[6px] bg-white px-2.5 text-[10.5px] font-semibold text-ink-2 shadow-[0_1px_4px_rgba(0,0,0,0.16)] hover:bg-field"
						onclick={() => setLeftShellCollapsed(false)}
					>
						パネル <span class="font-mono text-ink-3">⌘.</span>
					</button>
				{/if}
				{#if colorVisionMode !== 'none'}
					<div
						class="absolute top-3 left-1/2 z-20 flex h-7 -translate-x-1/2 items-center gap-2.5 rounded-[6px] bg-ink-1 px-3 text-[10.5px] text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
					>
						<span>
							{colorVisionMode === 'grayscale'
								? 'グレースケールで表示中'
								: `${COLOR_VISION_MODE_LABELS[colorVisionMode]}色覚で表示中`}
						</span>
						<span class="text-[9.5px] text-ink-3">esc で解除</span>
					</div>
				{:else if previewState && !inspectActive}
					<div
						class="absolute top-3 left-1/2 z-20 flex h-7 -translate-x-1/2 items-center gap-3 rounded-[6px] border border-accent bg-accent-soft px-3 text-[11px] font-semibold text-accent"
					>
						<span>{previewState.label} をプレビュー中。編集は無効です。</span>
						<button
							type="button"
							class="h-5 cursor-pointer rounded-[5px] px-1.5 hover:bg-white"
							onclick={() => (previewState = null)}
						>
							終了
						</button>
					</div>
				{:else if paletteSelectionLabel}
					<div
						class="absolute top-3 left-1/2 z-20 flex h-7 -translate-x-1/2 items-center rounded-[6px] border border-accent bg-accent-soft px-3 text-[11px] font-semibold text-accent"
					>
						{paletteSelectionLabel} の使用箇所をハイライト中
					</div>
				{/if}
			</MapViewport>

			<ResizableSidebar
				bind:width={propertiesPanelWidth}
				minWidth={MIN_PROPERTIES_PANEL_WIDTH}
				maxWidth={MAX_PROPERTIES_PANEL_WIDTH}
				defaultWidth={DEFAULT_PROPERTIES_PANEL_WIDTH}
				resizeEdge="left"
				label="プロパティパネルの幅を変更"
				onResizeEnd={handlePropertiesPanelResizeEnd}
			>
				<PropertiesDock>
					{#if styleJsonMode}
						<StyleJsonPanel
							class="h-full w-full min-w-0 rounded-none border-0 shadow-none"
							mapStyle={editorStyle}
							selectedLayerId={effectiveSelectedLayerId}
							{layerSelectionRequest}
							readOnly={previewState !== null}
							onApply={handleApplyStyleJson}
						/>
					{:else if selectedLayer}
						{#key selectedLayer.id}
							<LayerInspector
								class="h-full w-full min-w-0 rounded-none border-0 shadow-none"
								bind:activeTab={activeLayerTab}
								mapStyle={editorStyle}
								sprite={editorStyle.sprite}
								layer={selectedLayer}
								fontNames={Object.keys(fontsStore.fonts)}
								sources={editorStyle.sources}
								errors={validation.layerErrors[selectedLayer.id]}
								readOnly={previewState !== null}
								onChange={handleChangeLayerData}
								onTransientChange={handleChangeLayerDataTransient}
								onCommitChange={handleCommitLayerData}
								onCancelTransient={store.cancelStyleTransient}
								onApplyLayer={handleApplyLayer}
								onDuplicateLayer={handleDuplicateLayer}
								onDeleteLayer={handleDeleteLayer}
								canDeleteLayer={!previewState}
							/>
						{/key}
					{:else}
						<EmptyPropertiesDock onAddLayer={handleOpenAddLayer} />
					{/if}
				</PropertiesDock>
			</ResizableSidebar>
		</div>

		{#if !styleJsonMode && selectedLayer && flyoutVisible && expressionFlyout.target && flyoutPositionAnchor}
			<RowPopover
				open={true}
				customAnchor={flyoutPositionAnchor}
				contentClass="w-[320px]"
				onOpenChange={(open) => {
					if (!open) expressionFlyout.close();
				}}
			>
				<ExpressionPopoverPanel
					layer={selectedLayer}
					sprite={editorStyle.sprite}
					target={expressionFlyout.target!}
					errors={validation.layerErrors[selectedLayer.id]}
					onChange={handleChangeLayerData}
					onRequestJson={() => {
						expressionFlyout.close();
						activeLayerTab = 'json';
					}}
					onClose={() => expressionFlyout.close()}
				/>
			</RowPopover>
		{/if}

		<CommandPalette
			bind:open={commandPaletteOpen}
			layers={editorStyle.layers}
			{selectedLayer}
			onSelectLayer={(layerId) => {
				const layer = editorStyle.layers.find((candidate) => candidate.id === layerId);
				if (layer) handleSelectLayer(layer);
			}}
			onSelectProperty={handleCommandSelectProperty}
			onMoveZoom={(zoom) => backgroundMap.map?.easeTo({ zoom })}
			onMoveCoordinate={(longitude, latitude) =>
				backgroundMap.map?.easeTo({ center: [longitude, latitude] })}
		/>

		<ImportStyleDialog bind:open={importDialogOpen} onImport={handleImport} />
		{#each adapterModules as module (module.id)}
			{#each module.overlays ?? [] as Overlay, index (`${module.id}-${index}`)}
				<Overlay />
			{/each}
		{/each}
	</div>
{/if}
