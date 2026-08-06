<script lang="ts">
	import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
	import { CaretDown, Eye, EyeSlash, X } from 'phosphor-svelte';
	import { onDestroy } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { SvelteSet } from 'svelte/reactivity';

	import { Button } from '#lib/components/common/Button';
	import { TextField } from '#lib/components/common/TextField';
	import { LayerIcon } from '#lib/components/icons';
	import AddLayerPopover from '#lib/components/shell/AddLayerPopover.svelte';
	import {
		buildLayerTreeRows,
		filterLayerTreeRowsById,
		getLayerGroup,
		resolveLayerDrop
	} from '#lib/utils/layerGroup.ts';
	import {
		formatLayerValidationError,
		type LayerValidationError
	} from '#lib/utils/styleValidation.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		mapStyle,
		selectedLayerId,
		layerErrors = {},
		onClickLayer,
		onChangeLayerOrder,
		addLayerOpen = $bindable(false),
		readOnly = false,
		onAddLayer,
		onToggleLayerVisibility,
		layerSearchInput = $bindable(null),
		onLayerDragActiveChange
	}: {
		mapStyle: StyleSpecification;
		selectedLayerId: string | null;
		layerErrors?: Record<string, LayerValidationError[]>;
		onClickLayer: (layer: LayerSpecification) => void;
		onChangeLayerOrder: (layers: LayerSpecification[]) => void;
		addLayerOpen?: boolean;
		readOnly?: boolean;
		onAddLayer: (layer: LayerSpecification, aboveLayerId?: string) => void;
		onToggleLayerVisibility?: (layer: LayerSpecification, visible: boolean) => void;
		layerSearchInput?: HTMLInputElement | null;
		onLayerDragActiveChange?: (active: boolean) => void;
	} = $props();

	const rows = $derived(buildLayerTreeRows(mapStyle.layers));
	const collapsedGroups = new SvelteSet<string>();
	const selectedLayer = $derived(mapStyle.layers.find((layer) => layer.id === selectedLayerId));
	const selectedGroup = $derived(selectedLayer ? getLayerGroup(selectedLayer) : undefined);
	let layerSearch = $state('');
	const normalizedLayerSearch = $derived(layerSearch.trim());
	const isSearching = $derived(normalizedLayerSearch !== '');
	const searchedRows = $derived(filterLayerTreeRowsById(mapStyle.layers, rows, layerSearch));
	const matchingLayerCount = $derived(
		isSearching ? searchedRows.filter((row) => row.kind === 'layer').length : mapStyle.layers.length
	);
	const visibleRows = $derived.by(() => {
		if (isSearching) return searchedRows;
		return rows.filter(
			(row) =>
				row.kind === 'group' ||
				row.group === undefined ||
				row.group === selectedGroup ||
				!collapsedGroups.has(row.group)
		);
	});
	const sourceCount = $derived(Object.keys(mapStyle.sources).length);
	const errorCount = $derived(
		Object.values(layerErrors).reduce((total, errors) => total + errors.length, 0)
	);

	const errorsForLayer = (layerId: string): string[] =>
		(layerErrors[layerId] ?? []).map(formatLayerValidationError);
	const errorsForGroup = (layerIndexes: number[]): string[] =>
		layerIndexes.flatMap((layerIndex) => {
			const layerId = mapStyle.layers[layerIndex]?.id;
			return layerId ? errorsForLayer(layerId) : [];
		});
	const isLayerVisible = (layer: LayerSpecification): boolean =>
		(layer.layout as Record<string, unknown> | undefined)?.visibility !== 'none';

	const toggleGroup = (name: string) => {
		if (collapsedGroups.has(name)) collapsedGroups.delete(name);
		else collapsedGroups.add(name);
	};
	const isCollapsed = (name: string): boolean =>
		selectedGroup !== name && collapsedGroups.has(name);

	const ACTIVATION_DISTANCE = 4;
	let activeLayer = $state<LayerSpecification | null>(null);
	let activeLayerIndex = $state(-1);
	let activeRowIndex = $state(-1);
	let overRowIndex = $state(-1);
	let listElement = $state<HTMLDivElement | null>(null);
	let itemRects: DOMRect[] = [];
	let pointerStart = { x: 0, y: 0 };
	let pendingLayer: LayerSpecification | null = null;
	let suppressClick = false;

	const setListElement: Attachment<HTMLDivElement> = (node) => {
		listElement = node;
		return () => {
			if (listElement === node) listElement = null;
		};
	};

	const handleItemPointerDown = (event: PointerEvent, layer: LayerSpecification) => {
		if (isSearching || event.button !== 0) return;
		pendingLayer = layer;
		pointerStart = { x: event.clientX, y: event.clientY };
		suppressClick = false;
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
		window.addEventListener('keydown', handleDragKeyDown);
	};

	const startDrag = () => {
		if (isSearching || !pendingLayer || !listElement) return;
		itemRects = Array.from(listElement.children).map((child) => child.getBoundingClientRect());
		const layerIndex = mapStyle.layers.findIndex((layer) => layer.id === pendingLayer?.id);
		const rowIndex = visibleRows.findIndex(
			(row) => row.kind === 'layer' && row.layerIndex === layerIndex
		);
		if (layerIndex === -1 || rowIndex === -1 || !itemRects[rowIndex]) return;
		activeLayerIndex = layerIndex;
		activeRowIndex = rowIndex;
		overRowIndex = rowIndex;
		activeLayer = pendingLayer;
		onLayerDragActiveChange?.(true);
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
				const layers = $state.snapshot(mapStyle.layers as object) as LayerSpecification[];
				onChangeLayerOrder(resolveLayerDrop(layers, visibleRows, activeLayerIndex, overRowIndex));
			}
		} finally {
			resetDrag();
		}
	};

	const handleDragKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') resetDrag();
	};

	const resetDrag = () => {
		activeLayer = null;
		onLayerDragActiveChange?.(false);
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
		window.removeEventListener('keydown', handleDragKeyDown);
	};

	onDestroy(resetDrag);

	const handleItemClick = (layer: LayerSpecification) => {
		if (suppressClick) {
			suppressClick = false;
			return;
		}
		onClickLayer(layer);
	};

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

<aside class="flex w-60 shrink-0 flex-col border-r border-hairline bg-white">
	<div class="flex h-10 shrink-0 items-center gap-1.5 px-3">
		<h2 class="text-[12px] font-semibold text-ink-1">レイヤー</h2>
		<span class="font-mono text-[10.5px] text-ink-3">{mapStyle.layers.length}</span>
		<div class="ml-auto">
			<AddLayerPopover bind:open={addLayerOpen} {mapStyle} {readOnly} onAdd={onAddLayer} />
		</div>
	</div>

	<div class="shrink-0 px-2 pb-1.5">
		<div class="relative">
			<TextField
				bind:ref={layerSearchInput}
				class="w-full [&>input]:h-[26px] [&>input]:w-full [&>input]:rounded-[6px] [&>input]:px-2 [&>input]:pr-7 [&>input]:text-[11px] [&>input]:font-normal focus-within:[&>input]:shadow-[inset_0_0_0_1px_var(--color-accent)]"
				aria-label="レイヤーを検索"
				placeholder="検索"
				value={layerSearch}
				onValueChange={(value) => (layerSearch = value)}
				onCancel={() => {
					layerSearch = '';
					layerSearchInput?.blur();
				}}
			/>
			{#if layerSearch === ''}
				<span
					class="pointer-events-none absolute top-0 right-2 grid h-[26px] place-items-center font-mono text-[10px] text-ink-3"
					>/</span
				>
			{:else}
				<Button
					class="absolute top-px right-px flex size-6 items-center justify-center rounded-[5px] text-ink-3 hover:bg-white hover:text-ink-2"
					aria-label="検索をクリア"
					title="検索をクリア"
					onclick={() => (layerSearch = '')}
				>
					<X size={14} weight="regular" aria-hidden="true" />
				</Button>
			{/if}
		</div>
	</div>

	<div class="min-h-0 flex-1 overflow-auto px-1" {@attach setListElement}>
		{#if isSearching && matchingLayerCount === 0}
			<p class="px-2 py-6 text-center text-[11px] text-ink-3">
				“{normalizedLayerSearch}” に一致するレイヤーはありません。
			</p>
		{:else if mapStyle.layers.length === 0}
			<p class="px-2 py-6 text-center text-[11px] text-ink-3">
				レイヤーがありません。上の＋から追加できます。
			</p>
		{:else}
			{#each visibleRows as row, rowIndex (row.kind === 'group' ? `group-${row.name}-${row.startIndex}` : (mapStyle.layers[row.layerIndex]?.id ?? row.layerIndex))}
				{#if row.kind === 'group'}
					{@const groupErrors = errorsForGroup(row.layerIndexes)}
					<button
						type="button"
						class="flex h-[26px] w-full items-center gap-[5px] rounded-[5px] px-2 text-left text-[11px] font-normal text-ink-2 outline-none hover:bg-field focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]"
						style={itemStyle(rowIndex)}
						onclick={() => toggleGroup(row.name)}
					>
						<CaretDown
							size={10}
							weight="regular"
							class={cn(
								'shrink-0 transition-transform',
								isSearching || !isCollapsed(row.name) ? '' : '-rotate-90'
							)}
							aria-hidden="true"
						/>
						<span class="min-w-0 flex-1 truncate">{row.name}</span>
						<span class="font-mono text-[10px] text-ink-4">{row.layerIndexes.length}</span>
						{#if groupErrors.length > 0}
							<span
								class="size-1.5 shrink-0 rounded-full bg-danger"
								title={groupErrors.join('\n')}
								role="img"
								aria-label={`${row.name} に ${groupErrors.length} 件のエラー`}
							></span>
						{/if}
					</button>
				{:else}
					{@const layer = mapStyle.layers[row.layerIndex]}
					{@const selected = layer.id === selectedLayerId}
					{@const layerErrorsForRow = errorsForLayer(layer.id)}
					<div
						role="group"
						class={cn(
							'flex h-7 w-full items-center rounded-[5px] text-[11.5px] text-ink-2',
							row.group !== undefined && 'pl-4',
							selected ? 'bg-accent-soft font-semibold text-ink-1' : 'font-normal hover:bg-field',
							layer.id === activeLayer?.id && 'opacity-40',
							activeLayer !== null && 'pointer-events-none'
						)}
						style={itemStyle(rowIndex)}
						onpointerdown={isSearching ? undefined : (event) => handleItemPointerDown(event, layer)}
					>
						<button
							type="button"
							class="flex h-full min-w-0 flex-1 items-center gap-2 rounded-[5px] px-2 text-left outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]"
							onclick={() => handleItemClick(layer)}
						>
							<LayerIcon type={layer.type} class="size-4 shrink-0" aria-hidden="true" />
							<span class="min-w-0 flex-1 truncate">{layer.id}</span>
							{#if layerErrorsForRow.length > 0}
								<span
									class="size-1.5 shrink-0 rounded-full bg-danger"
									title={layerErrorsForRow.join('\n')}
									role="img"
									aria-label={`${layer.id} に ${layerErrorsForRow.length} 件のエラー`}
								></span>
							{/if}
						</button>
						{#if selected}
							<Button
								class="mr-0.5 flex size-6 shrink-0 items-center justify-center rounded-[5px] text-ink-2 outline-none hover:bg-white focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]"
								aria-label={isLayerVisible(layer) ? `${layer.id} を非表示` : `${layer.id} を表示`}
								title={isLayerVisible(layer) ? 'レイヤーを非表示' : 'レイヤーを表示'}
								onpointerdown={(event) => event.stopPropagation()}
								onclick={(event) => {
									event.stopPropagation();
									onToggleLayerVisibility?.(layer, !isLayerVisible(layer));
								}}
							>
								{#if isLayerVisible(layer)}
									<Eye size={16} weight="regular" aria-hidden="true" />
								{:else}
									<EyeSlash size={16} weight="regular" aria-hidden="true" />
								{/if}
							</Button>
						{/if}
					</div>
				{/if}
			{/each}
		{/if}
	</div>

	<footer
		class="flex h-8 shrink-0 items-center justify-between border-t border-hairline-soft px-3 font-mono text-[10px] text-ink-3"
	>
		<span>{sourceCount} ソース ・ {errorCount} エラー</span>
		<span>⌘.</span>
	</footer>
</aside>
