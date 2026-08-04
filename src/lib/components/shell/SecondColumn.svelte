<script lang="ts">
	import type { FontInfo } from '@kartore/glyphore';
	import type { LayerSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';

	import type { EditorPreview, StyleHistoryProvider } from '#lib/editor/EditorModule.ts';
	import type { RegisteredEditorRailItem } from '#lib/editor/editorRail.ts';
	import type { FontMeta, LoadedFont, StoredFont } from '#lib/stores/fonts';
	import type { RootPropertyKind } from '#lib/utils/layerSpec.ts';
	import type { LayerValidationError } from '#lib/utils/styleValidation.ts';
	import type { StyleSettingChange } from '#lib/utils/styleRoot.ts';

	import FontsColumn from './FontsColumn.svelte';
	import HistoryColumn from './HistoryColumn.svelte';
	import LayersColumn from './LayersColumn.svelte';
	import PaletteColumn from './PaletteColumn.svelte';
	import SettingsColumn from './SettingsColumn.svelte';
	import type { ShellMode } from './shellMode.ts';
	import SourcesColumn from './SourcesColumn.svelte';
	import SpritesColumn from './SpritesColumn.svelte';

	let {
		activeMode,
		moduleRailItem,
		mapStyle,
		selectedLayerId,
		layerErrors = {},
		styleErrors = [],
		readOnly = false,
		spriteIcons,
		fonts,
		historyProvider,
		addLayerOpen = $bindable(false),
		layerSearchInput = $bindable(null),
		onClickLayer,
		onChangeLayerOrder,
		onAddLayer,
		onToggleLayerVisibility,
		onLayerDragActiveChange,
		onApplyStyle,
		onSetSpriteIcon,
		onRemoveSpriteIcon,
		onAddFont,
		onRemoveFont,
		getLoadedFont,
		getStoredFonts,
		onSetPreview,
		onRevertStyle,
		onChangeStyleSetting,
		onChangeRoot,
		onSetRootObject,
		onOpenStyleJson,
		onUseCurrentView,
		onPaletteSelectionChange,
		onOpenPalette
	}: {
		activeMode: ShellMode;
		moduleRailItem?: RegisteredEditorRailItem | null;
		mapStyle: StyleSpecification;
		selectedLayerId: string | null;
		layerErrors?: Record<string, LayerValidationError[]>;
		styleErrors?: string[];
		readOnly?: boolean;
		spriteIcons: Record<string, string>;
		fonts: Record<string, FontMeta>;
		historyProvider?: StyleHistoryProvider | null;
		addLayerOpen?: boolean;
		layerSearchInput?: HTMLInputElement | null;
		onClickLayer: (layer: LayerSpecification) => void;
		onChangeLayerOrder: (layers: LayerSpecification[]) => void;
		onAddLayer: (layer: LayerSpecification, aboveLayerId?: string) => void;
		onToggleLayerVisibility?: (layer: LayerSpecification, visible: boolean) => void;
		onLayerDragActiveChange?: (active: boolean) => void;
		onApplyStyle: (style: StyleSpecification) => void;
		onSetSpriteIcon: (id: string, svg: string) => void;
		onRemoveSpriteIcon: (id: string) => void;
		onAddFont: (bytes: ArrayBuffer | Uint8Array) => Promise<FontInfo>;
		onRemoveFont: (name: string) => Promise<void>;
		getLoadedFont: (name: string) => Promise<LoadedFont | null>;
		getStoredFonts: () => Promise<Record<string, StoredFont>>;
		onSetPreview: (preview: EditorPreview | null) => void;
		onRevertStyle: (style: StyleSpecification) => void;
		onChangeStyleSetting?: StyleSettingChange;
		onChangeRoot?: (kind: RootPropertyKind, key: string, value: unknown) => void;
		onSetRootObject?: (kind: RootPropertyKind, value: object | undefined) => void;
		onOpenStyleJson?: () => void;
		onUseCurrentView?: () => void;
		onPaletteSelectionChange?: (label: string | null) => void;
		onOpenPalette?: () => void;
	} = $props();

	const ModuleSecondColumn = $derived(moduleRailItem?.secondColumn);

	const selectLayerById = (layerId: string) => {
		const layer = mapStyle.layers.find((candidate) => candidate.id === layerId);
		if (layer) onClickLayer(layer);
	};
</script>

{#if activeMode === 'layers'}
	<LayersColumn
		{mapStyle}
		{selectedLayerId}
		{layerErrors}
		{readOnly}
		bind:addLayerOpen
		bind:layerSearchInput
		{onClickLayer}
		{onChangeLayerOrder}
		{onAddLayer}
		{onToggleLayerVisibility}
		{onLayerDragActiveChange}
	/>
{:else if activeMode === 'sources'}
	<SourcesColumn {mapStyle} {readOnly} onApply={onApplyStyle} />
{:else if activeMode === 'palette'}
	<PaletteColumn
		{mapStyle}
		{readOnly}
		{onApplyStyle}
		onSelectLayer={selectLayerById}
		onSelectionChange={onPaletteSelectionChange}
	/>
{:else if activeMode === 'sprites'}
	<SpritesColumn
		{mapStyle}
		icons={spriteIcons}
		{readOnly}
		onSetIcon={onSetSpriteIcon}
		onRemoveIcon={onRemoveSpriteIcon}
		onSelectLayer={selectLayerById}
	/>
{:else if activeMode === 'fonts'}
	<FontsColumn
		{mapStyle}
		{fonts}
		{readOnly}
		{onAddFont}
		{onRemoveFont}
		{getLoadedFont}
		{getStoredFonts}
		onSelectLayer={selectLayerById}
	/>
{:else if activeMode === 'history' && historyProvider}
	{#key historyProvider.label}
		<HistoryColumn provider={historyProvider} {onSetPreview} onRevert={onRevertStyle} />
	{/key}
{:else if activeMode === 'settings'}
	<SettingsColumn
		{mapStyle}
		{styleErrors}
		{onChangeStyleSetting}
		{onChangeRoot}
		{onSetRootObject}
		{onOpenStyleJson}
		{onUseCurrentView}
		{onOpenPalette}
	/>
{:else if ModuleSecondColumn}
	<ModuleSecondColumn />
{/if}
