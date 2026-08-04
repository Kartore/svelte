<script lang="ts">
	import type { Snippet } from 'svelte';

	import { cn } from '#lib/utils/tailwindUtil.ts';

	import { DEFAULT_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH } from './sidebarSize.ts';

	let {
		width = $bindable(DEFAULT_SIDEBAR_WIDTH),
		minWidth = MIN_SIDEBAR_WIDTH,
		maxWidth = MAX_SIDEBAR_WIDTH,
		defaultWidth = DEFAULT_SIDEBAR_WIDTH,
		resizeEdge = 'right',
		label = 'サイドバーの幅を変更',
		onResizeEnd,
		children
	}: {
		width?: number;
		minWidth?: number;
		maxWidth?: number;
		defaultWidth?: number;
		resizeEdge?: 'left' | 'right';
		label?: string;
		onResizeEnd?: (width: number) => void;
		children: Snippet;
	} = $props();

	type SeparatorPointerEvent = PointerEvent & { currentTarget: HTMLDivElement };

	let resizing = $state(false);
	let dragStartX = 0;
	let dragStartWidth = 0;

	const clampWidth = (value: number): number =>
		Math.min(maxWidth, Math.max(minWidth, Math.round(value)));

	const finishResize = (event?: SeparatorPointerEvent) => {
		if (!resizing) return;
		resizing = false;
		if (event?.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		onResizeEnd?.(width);
	};

	const handlePointerDown = (event: SeparatorPointerEvent) => {
		if (event.button !== 0) return;
		event.preventDefault();
		event.stopPropagation();
		dragStartX = event.clientX;
		dragStartWidth = width;
		resizing = true;
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const handlePointerMove = (event: SeparatorPointerEvent) => {
		if (!resizing) return;
		const direction = resizeEdge === 'right' ? 1 : -1;
		width = clampWidth(dragStartWidth + (event.clientX - dragStartX) * direction);
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		const step = event.shiftKey ? 32 : 8;
		let nextWidth: number | undefined;
		if (event.key === 'ArrowLeft') nextWidth = width - step;
		else if (event.key === 'ArrowRight') nextWidth = width + step;
		else if (event.key === 'Home') nextWidth = minWidth;
		else if (event.key === 'End') nextWidth = maxWidth;
		if (nextWidth === undefined) return;
		event.preventDefault();
		width = clampWidth(nextWidth);
		onResizeEnd?.(width);
	};

	const resetToDefaultWidth = () => {
		width = clampWidth(defaultWidth);
		onResizeEnd?.(width);
	};
</script>

<div class="relative flex min-h-0 shrink-0" style:width={`${width}px`} data-resizing={resizing}>
	<div class="sidebar-content flex min-w-0 flex-1 overflow-hidden">
		{@render children()}
	</div>
	<div
		role="slider"
		aria-label={label}
		aria-orientation="horizontal"
		aria-valuemin={minWidth}
		aria-valuemax={maxWidth}
		aria-valuenow={width}
		aria-valuetext={`${width}px`}
		tabindex="0"
		class={cn(
			'group absolute inset-y-0 z-30 w-2 cursor-col-resize touch-none outline-none',
			resizeEdge === 'right' ? '-right-1' : '-left-1'
		)}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={finishResize}
		onpointercancel={finishResize}
		onlostpointercapture={finishResize}
		onkeydown={handleKeyDown}
		ondblclick={resetToDefaultWidth}
		title={`${label}・ダブルクリックで既定幅`}
	>
		<span
			class={cn(
				'pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors',
				resizing
					? 'bg-accent'
					: 'bg-transparent group-hover:bg-accent group-focus-visible:bg-accent'
			)}
		></span>
	</div>
</div>

<style>
	.sidebar-content :global(aside) {
		width: 100%;
		min-width: 0;
	}
</style>
