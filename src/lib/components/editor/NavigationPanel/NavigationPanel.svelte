<script lang="ts">
	import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
	import type { HTMLAttributes } from 'svelte/elements';

	import { SortableLayerTreeItem } from '$lib/components/editor/NavigationPanel/SortableLayerTreeItem';
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
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		mapStyle: StyleSpecification;
		selectedLayerId: LayerSpecification['id'] | null;
		layerErrors?: Record<string, LayerValidationError[]>;
		onClickLayer: (layer: LayerSpecification) => void;
		onChangeLayerOrder: (layers: LayerSpecification[]) => void;
	} = $props();

	const errorMessages = (layerId: string): string[] | undefined =>
		layerErrors?.[layerId]?.map(formatLayerValidationError);

	// dnd-kit (MouseSensor + verticalListSortingStrategy + DragOverlay) 相当を
	// ネイティブ Pointer Events で実装している。
	const ACTIVATION_DISTANCE = 4;

	let activeLayer = $state<LayerSpecification | null>(null);
	let activeIndex = $state(-1);
	let overIndex = $state(-1);
	let overlayLeft = $state(0);
	let overlayTop = $state(0);
	let overlayWidth = $state(0);
	let listElement = $state<HTMLDivElement | null>(null);

	let itemRects: DOMRect[] = [];
	let pointerStart = { x: 0, y: 0 };
	let pendingLayer: LayerSpecification | null = null;
	let suppressClick = false;

	const arrayMove = <T,>(array: T[], from: number, to: number): T[] => {
		const newArray = array.slice();
		newArray.splice(to < 0 ? newArray.length + to : to, 0, newArray.splice(from, 1)[0]);
		return newArray;
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
		const index = mapStyle.layers.findIndex((layer) => layer.id === pendingLayer?.id);
		if (index === -1 || !itemRects[index]) return;
		activeIndex = index;
		overIndex = index;
		overlayWidth = itemRects[index].width;
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

		const activeRect = itemRects[activeIndex];
		// dnd-kit の DragOverlay + adjustTranslate（y - 10）相当
		overlayLeft = activeRect.left + dx;
		overlayTop = activeRect.top + dy - 10;

		// closestCenter 相当: ドラッグ中アイテムの中心に最も近いアイテムを over とする
		const draggedCenterY = activeRect.top + activeRect.height / 2 + dy;
		let closestIndex = activeIndex;
		let closestDistance = Infinity;
		itemRects.forEach((rect, index) => {
			const distance = Math.abs(rect.top + rect.height / 2 - draggedCenterY);
			if (distance < closestDistance) {
				closestDistance = distance;
				closestIndex = index;
			}
		});
		overIndex = closestIndex;
	};

	const handlePointerUp = () => {
		if (activeLayer && overIndex !== activeIndex) {
			const clonedLayers: LayerSpecification[] = JSON.parse(
				JSON.stringify($state.snapshot(mapStyle.layers))
			);
			onChangeLayerOrder(arrayMove(clonedLayers, activeIndex, overIndex));
		}
		resetState();
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			resetState();
		}
	};

	const resetState = () => {
		activeLayer = null;
		pendingLayer = null;
		activeIndex = -1;
		overIndex = -1;
		itemRects = [];

		document.body.style.setProperty('cursor', '');
		document.body.style.removeProperty('user-select');
		document.body.style.removeProperty('-webkit-user-select');
		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerup', handlePointerUp);
		window.removeEventListener('keydown', handleKeyDown);
	};

	$effect(() => {
		return () => {
			resetState();
		};
	});

	const handleItemClick = (layer: LayerSpecification) => {
		if (suppressClick) {
			suppressClick = false;
			return;
		}
		onClickLayer(layer);
	};

	// verticalListSortingStrategy 相当の transform を計算する
	const itemStyle = (index: number): string | undefined => {
		if (!activeLayer || activeIndex === -1 || overIndex === -1) return undefined;
		const activeRect = itemRects[activeIndex];
		let y = 0;
		if (index === activeIndex) {
			y = itemRects[overIndex].top - activeRect.top;
		} else if (activeIndex < overIndex && index > activeIndex && index <= overIndex) {
			y = -activeRect.height;
		} else if (activeIndex > overIndex && index >= overIndex && index < activeIndex) {
			y = activeRect.height;
		}
		return `transform: translate3d(0, ${y}px, 0); transition: transform 200ms ease;`;
	};
</script>

<div
	{...props}
	class={cn(
		'pointer-events-auto flex h-auto w-auto flex-col rounded-lg border border-gray-300 bg-white',
		className
	)}
>
	<div class="flex flex-col gap-2 border-b border-b-gray-300 px-4 py-4">
		<h1 class="font-[Montserrat] font-bold">Kartore</h1>
		<h2 class="font-[Montserrat] font-semibold">{mapStyle.name}</h2>
	</div>
	<div
		class="border-b border-b-gray-300 px-4 py-2 font-[Montserrat] text-sm font-medium text-gray-500"
	>
		<h2>Layers</h2>
	</div>
	<div class="flex-1 overflow-auto" bind:this={listElement}>
		{#each mapStyle.layers as layer, index (layer.id)}
			<SortableLayerTreeItem
				isSelected={layer.id === selectedLayerId}
				{layer}
				errors={errorMessages(layer.id)}
				indicator={layer.id === activeLayer?.id}
				disableInteraction={activeLayer !== null}
				style={itemStyle(index)}
				onclick={() => {
					handleItemClick(layer);
				}}
				onpointerdown={(event) => {
					handleItemPointerDown(event, layer);
				}}
			/>
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
