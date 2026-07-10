<script lang="ts">
	import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
	import { onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SvelteSet } from 'svelte/reactivity';

	import { Button } from '$lib/components/common/Button';
	import { LayerGroupHeader } from '$lib/components/editor/NavigationPanel/LayerGroupHeader';
	import { SortableLayerTreeItem } from '$lib/components/editor/NavigationPanel/SortableLayerTreeItem';
	import { PlusIcon } from '$lib/components/icons';
	import { buildLayerTreeRows, getLayerGroup, resolveLayerDrop } from '$lib/utils/layerGroup.ts';
	import {
		formatLayerValidationError,
		type LayerValidationError
	} from '$lib/utils/styleValidation.ts';
	import { cn } from '$lib/utils/tailwindUtil';

	let {
		onChangeLayerOrder,
		onClickLayer,
		mapStyle,
		class: className,
		selectedLayerId,
		layerErrors,
		canUndo,
		canRedo,
		onClickUndo,
		onClickRedo,
		onClickExport,
		onClickImport,
		onClickSettings,
		onClickAddLayer,
		onClickSources,
		headerActions,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		mapStyle: StyleSpecification;
		selectedLayerId: LayerSpecification['id'] | null;
		layerErrors?: Record<string, LayerValidationError[]>;
		onClickLayer: (layer: LayerSpecification) => void;
		onChangeLayerOrder: (layers: LayerSpecification[]) => void;
		canUndo?: boolean;
		canRedo?: boolean;
		onClickUndo?: () => void;
		onClickRedo?: () => void;
		onClickExport?: () => void;
		onClickImport?: () => void;
		onClickSettings?: () => void;
		onClickAddLayer?: () => void;
		onClickSources?: () => void;
		headerActions?: Snippet;
	} = $props();

	const errorMessages = (layerId: string): string[] | undefined =>
		layerErrors?.[layerId]?.map(formatLayerValidationError);
	const groupErrorMessages = (layerIndexes: number[]): string[] | undefined => {
		const errors = layerIndexes.flatMap((layerIndex) => {
			const layerId = mapStyle.layers[layerIndex]?.id;
			return layerId ? (errorMessages(layerId) ?? []) : [];
		});
		return errors.length > 0 ? errors : undefined;
	};
	const rows = $derived(buildLayerTreeRows(mapStyle.layers));
	const collapsedGroups = new SvelteSet<string>();
	const selectedLayer = $derived(mapStyle.layers.find((layer) => layer.id === selectedLayerId));
	const selectedGroup = $derived(selectedLayer ? getLayerGroup(selectedLayer) : undefined);
	const visibleRows = $derived(
		rows.filter(
			(row) =>
				row.kind === 'group' ||
				row.group === undefined ||
				row.group === selectedGroup ||
				!collapsedGroups.has(row.group)
		)
	);

	// dnd-kit (MouseSensor + verticalListSortingStrategy + DragOverlay) 相当を
	// ネイティブ Pointer Events で実装している。
	const ACTIVATION_DISTANCE = 4;

	let activeLayer = $state<LayerSpecification | null>(null);
	let activeLayerIndex = $state(-1);
	let activeRowIndex = $state(-1);
	let overRowIndex = $state(-1);
	let overlayLeft = $state(0);
	let overlayTop = $state(0);
	let overlayWidth = $state(0);
	let listElement = $state<HTMLDivElement | null>(null);

	let itemRects: DOMRect[] = [];
	let pointerStart = { x: 0, y: 0 };
	let pendingLayer: LayerSpecification | null = null;
	let suppressClick = false;

	const setListElement: Attachment<HTMLDivElement> = (node) => {
		listElement = node;
		return () => {
			if (listElement === node) {
				listElement = null;
			}
		};
	};

	const handleItemPointerDown = (event: PointerEvent, layer: LayerSpecification) => {
		if (event.button !== 0) return;
		pendingLayer = layer;
		pointerStart = { x: event.clientX, y: event.clientY };
		suppressClick = false;
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
		window.addEventListener('keydown', handleKeyDown);
	};

	const startDrag = () => {
		if (!pendingLayer || !listElement) return;
		itemRects = Array.from(listElement.children).map((child) => child.getBoundingClientRect());
		const layerIndex = mapStyle.layers.findIndex((layer) => layer.id === pendingLayer?.id);
		const rowIndex = visibleRows.findIndex(
			(row) => row.kind === 'layer' && row.layerIndex === layerIndex
		);
		if (layerIndex === -1 || rowIndex === -1 || !itemRects[rowIndex]) return;
		activeLayerIndex = layerIndex;
		activeRowIndex = rowIndex;
		overRowIndex = rowIndex;
		overlayWidth = itemRects[rowIndex].width;
		activeLayer = pendingLayer;
		suppressClick = true;

		document.body.style.setProperty('cursor', 'grabbing');
		document.body.style.setProperty('user-select', 'none');
		document.body.style.setProperty('-webkit-user-select', 'none');
	};

	const handlePointerMove = (event: PointerEvent) => {
		const dx = event.clientX - pointerStart.x;
		const dy = event.clientY - pointerStart.y;
		if (!activeLayer) {
			if (Math.sqrt(dx * dx + dy * dy) < ACTIVATION_DISTANCE) return;
			startDrag();
			if (!activeLayer) return;
		}
		event.preventDefault();

		const activeRect = itemRects[activeRowIndex];
		// dnd-kit の DragOverlay + adjustTranslate（y - 10）相当
		overlayLeft = activeRect.left + dx;
		overlayTop = activeRect.top + dy - 10;

		// closestCenter 相当: ドラッグ中アイテムの中心に最も近いアイテムを over とする
		const draggedCenterY = activeRect.top + activeRect.height / 2 + dy;
		let closestIndex = activeRowIndex;
		let closestDistance = Infinity;
		itemRects.forEach((rect, index) => {
			const distance = Math.abs(rect.top + rect.height / 2 - draggedCenterY);
			if (distance < closestDistance) {
				closestDistance = distance;
				closestIndex = index;
			}
		});
		overRowIndex = closestIndex;
	};

	const handlePointerUp = () => {
		try {
			if (activeLayer && overRowIndex !== activeRowIndex) {
				// $state の deep proxy は structuredClone できないため snapshot を渡す
				const layers = $state.snapshot(mapStyle.layers as object) as LayerSpecification[];
				onChangeLayerOrder(resolveLayerDrop(layers, visibleRows, activeLayerIndex, overRowIndex));
			}
		} finally {
			resetState();
		}
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			resetState();
		}
	};

	const resetState = () => {
		activeLayer = null;
		pendingLayer = null;
		activeLayerIndex = -1;
		activeRowIndex = -1;
		overRowIndex = -1;
		itemRects = [];

		document.body.style.setProperty('cursor', '');
		document.body.style.removeProperty('user-select');
		document.body.style.removeProperty('-webkit-user-select');
		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerup', handlePointerUp);
		window.removeEventListener('keydown', handleKeyDown);
	};

	onDestroy(resetState);

	const handleItemClick = (layer: LayerSpecification) => {
		if (suppressClick) {
			suppressClick = false;
			return;
		}
		onClickLayer(layer);
	};

	const toggleGroup = (name: string) => {
		if (collapsedGroups.has(name)) {
			collapsedGroups.delete(name);
		} else {
			collapsedGroups.add(name);
		}
	};

	const isCollapsed = (name: string): boolean => {
		return selectedGroup !== name && collapsedGroups.has(name);
	};

	// verticalListSortingStrategy 相当の transform を計算する
	const itemStyle = (index: number): string | undefined => {
		if (!activeLayer || activeRowIndex === -1 || overRowIndex === -1) return undefined;
		const activeRect = itemRects[activeRowIndex];
		let y = 0;
		if (index === activeRowIndex) {
			y = itemRects[overRowIndex].top - activeRect.top;
		} else if (activeRowIndex < overRowIndex && index > activeRowIndex && index <= overRowIndex) {
			y = -activeRect.height;
		} else if (activeRowIndex > overRowIndex && index >= overRowIndex && index < activeRowIndex) {
			y = activeRect.height;
		}
		return `transform: translate3d(0, ${y}px, 0); transition: transform 200ms ease;`;
	};
</script>

<div
	{...props}
	class={cn(
		'pointer-events-auto flex h-auto w-auto flex-col overflow-hidden rounded-lg border border-gray-300/80 bg-white/95 shadow-lg shadow-gray-950/10 backdrop-blur',
		className
	)}
>
	<div class="flex flex-col gap-3 border-b border-b-gray-200 px-3 py-3">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<h1 class="font-[Montserrat] text-sm font-bold tracking-normal text-gray-950">Kartore</h1>
				<p
					class="mt-0.5 truncate text-xs font-semibold text-gray-500"
					title={mapStyle.name ?? 'Untitled style'}
				>
					{mapStyle.name ?? 'Untitled style'}
				</p>
			</div>
			<div class="flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
				<Button
					class="flex h-7 w-7 items-center justify-center rounded-sm font-mono text-sm font-semibold text-gray-600 hover:bg-white disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent"
					aria-label="Undo"
					title="Undo"
					disabled={!canUndo}
					onclick={onClickUndo}
				>
					↶
				</Button>
				<Button
					class="flex h-7 w-7 items-center justify-center rounded-sm font-mono text-sm font-semibold text-gray-600 hover:bg-white disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent"
					aria-label="Redo"
					title="Redo"
					disabled={!canRedo}
					onclick={onClickRedo}
				>
					↷
				</Button>
			</div>
		</div>
		<div class="grid grid-cols-3 gap-1.5">
			<Button
				class="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-white"
				onclick={onClickExport}
			>
				Export
			</Button>
			<Button
				class="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-white"
				onclick={onClickImport}
			>
				Import
			</Button>
			<Button
				class="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-white"
				onclick={onClickSettings}
			>
				Settings
			</Button>
			<div class="col-span-3 flex min-w-0 flex-wrap items-center gap-1.5 empty:hidden">
				{@render headerActions?.()}
			</div>
		</div>
	</div>
	<div class="flex items-center justify-between border-b border-b-gray-200 px-3 py-2.5">
		<div>
			<h2 class="font-[Montserrat] text-sm font-semibold text-gray-800">Layers</h2>
			<p class="text-[11px] font-semibold text-gray-400">{mapStyle.layers.length} items</p>
		</div>
		<div class="flex items-center gap-1.5">
			<Button
				class="h-7 rounded-md border border-gray-200 px-2 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50"
				onclick={onClickSources}
			>
				Sources
			</Button>
			<Button
				class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-900 text-white shadow-sm hover:bg-gray-700"
				aria-label="Add layer"
				title="Add layer"
				onclick={onClickAddLayer}
			>
				<PlusIcon class="h-4 w-4" />
			</Button>
		</div>
	</div>
	<div class="flex-1 overflow-auto" {@attach setListElement}>
		{#each visibleRows as row, rowIndex (row.kind === 'group' ? `group-${row.name}-${row.startIndex}` : (mapStyle.layers[row.layerIndex]?.id ?? row.layerIndex))}
			{#if row.kind === 'group'}
				<LayerGroupHeader
					name={row.name}
					count={row.layerIndexes.length}
					collapsed={isCollapsed(row.name)}
					errors={groupErrorMessages(row.layerIndexes)}
					style={itemStyle(rowIndex)}
					onToggle={() => toggleGroup(row.name)}
				/>
			{:else}
				{@const layer = mapStyle.layers[row.layerIndex]}
				<SortableLayerTreeItem
					isSelected={layer.id === selectedLayerId}
					{layer}
					indent={row.group !== undefined}
					errors={errorMessages(layer.id)}
					indicator={layer.id === activeLayer?.id}
					disableInteraction={activeLayer !== null}
					style={itemStyle(rowIndex)}
					onclick={() => {
						handleItemClick(layer);
					}}
					onpointerdown={(event) => {
						handleItemPointerDown(event, layer);
					}}
				/>
			{/if}
		{/each}
	</div>
</div>

{#if activeLayer}
	<div
		class="pointer-events-none fixed z-50 select-none"
		style={`left: ${overlayLeft}px; top: ${overlayTop}px; width: ${overlayWidth}px;`}
	>
		<SortableLayerTreeItem layer={activeLayer} clone />
	</div>
{/if}
