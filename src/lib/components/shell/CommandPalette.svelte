<script lang="ts">
	import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
	import { Dialog } from 'bits-ui';
	import { Crosshair, Function as FunctionIcon, Plus, StackSimple } from 'phosphor-svelte';
	import type { Attachment } from 'svelte/attachments';

	import { useEditorCommands } from '#lib/contexts/editorCommands.svelte.ts';
	import { getLayerPropertyCatalog, type PropertyCatalogItem } from '#lib/utils/propertyCatalog.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	type PaletteEntry = {
		id: string;
		group: 'レイヤー' | 'プロパティ' | 'アクション' | '移動';
		label: string;
		detail?: string;
		disabled?: boolean;
		run: () => void;
	};

	let {
		open = $bindable(false),
		layers,
		selectedLayer,
		onSelectLayer,
		onSelectProperty,
		onMoveZoom,
		onMoveCoordinate
	}: {
		open?: boolean;
		layers: LayerSpecification[];
		selectedLayer: LayerSpecification;
		onSelectLayer: (layerId: string) => void;
		onSelectProperty: (item: PropertyCatalogItem) => void;
		onMoveZoom: (zoom: number) => void;
		onMoveCoordinate: (longitude: number, latitude: number) => void;
	} = $props();

	const commandRegistry = useEditorCommands();
	const groupOrder: PaletteEntry['group'][] = ['レイヤー', 'プロパティ', 'アクション', '移動'];
	let query = $state('');
	let activeIndex = $state(0);
	const focusSearch: Attachment<HTMLInputElement> = (element) => {
		queueMicrotask(() => element.focus());
	};

	const coordinateTarget = $derived.by(() => {
		const match =
			/^\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*[,，\s]\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*$/.exec(query);
		if (!match) return undefined;
		const longitude = Number(match[1]);
		const latitude = Number(match[2]);
		if (
			!Number.isFinite(longitude) ||
			!Number.isFinite(latitude) ||
			longitude < -180 ||
			longitude > 180 ||
			latitude < -90 ||
			latitude > 90
		) {
			return undefined;
		}
		return { longitude, latitude };
	});
	const zoomTarget = $derived.by(() => {
		const match = /^(?:z|zoom|ズーム)\s*[:：]?\s*(-?(?:\d+(?:\.\d*)?|\.\d+))$/i.exec(query.trim());
		if (!match) return undefined;
		const zoom = Number(match[1]);
		return Number.isFinite(zoom) && zoom >= 0 && zoom <= 24 ? zoom : undefined;
	});
	const allEntries = $derived.by((): PaletteEntry[] => {
		const layerEntries: PaletteEntry[] = layers.map((layer) => ({
			id: `layer:${layer.id}`,
			group: 'レイヤー',
			label: layer.id,
			detail: layer.id === selectedLayer.id ? `${layer.type} ・ 選択中` : layer.type,
			run: () => onSelectLayer(layer.id)
		}));
		const propertyEntries: PaletteEntry[] = getLayerPropertyCatalog(selectedLayer.type).map(
			(item) => ({
				id: `property:${item.group}:${item.key}`,
				group: 'プロパティ',
				label: `${selectedLayer.id} の ${item.key} を編集`,
				detail: item.spec.expression?.interpolated ? 'zoom 補間' : item.group,
				run: () => onSelectProperty(item)
			})
		);
		const actionEntries: PaletteEntry[] = (commandRegistry?.commands ?? [])
			.filter(({ label }) => label !== '')
			.map((command) => ({
				id: `action:${command.id}`,
				group: 'アクション',
				label: command.label,
				detail: command.shortcut
					? `${command.groupLabel} · ${command.shortcut}`
					: command.groupLabel,
				disabled: command.disabled,
				run: command.run
			}));
		const movementEntries: PaletteEntry[] = [3, 8, 12, 16, 20].map((zoom) => ({
			id: `move:zoom:${zoom}`,
			group: '移動',
			label: `ズーム ${zoom}`,
			detail: `z${zoom} へ移動`,
			run: () => onMoveZoom(zoom)
		}));
		if (zoomTarget !== undefined && ![3, 8, 12, 16, 20].includes(zoomTarget)) {
			movementEntries.unshift({
				id: `move:zoom:${zoomTarget}`,
				group: '移動',
				label: `ズーム ${zoomTarget}`,
				detail: `z${zoomTarget} へ移動`,
				run: () => onMoveZoom(zoomTarget)
			});
		}
		if (coordinateTarget) {
			movementEntries.unshift({
				id: `move:coordinate:${coordinateTarget.longitude}:${coordinateTarget.latitude}`,
				group: '移動',
				label: `${coordinateTarget.longitude}, ${coordinateTarget.latitude} へ移動`,
				detail: '経度, 緯度',
				run: () => onMoveCoordinate(coordinateTarget.longitude, coordinateTarget.latitude)
			});
		}
		return [...layerEntries, ...propertyEntries, ...actionEntries, ...movementEntries];
	});
	const normalizedQuery = $derived(query.trim().toLocaleLowerCase());
	const entries = $derived(
		normalizedQuery === ''
			? allEntries
			: allEntries.filter((entry) =>
					`${entry.group} ${entry.label} ${entry.detail ?? ''}`
						.toLocaleLowerCase()
						.includes(normalizedQuery)
				)
	);
	const selectableEntries = $derived(entries.filter((entry) => !entry.disabled));

	const handleOpenChange = (next: boolean) => {
		open = next;
		if (!next) {
			query = '';
			activeIndex = 0;
		}
	};
	const closePalette = () => {
		query = '';
		activeIndex = 0;
		open = false;
	};

	const runEntry = (entry: PaletteEntry | undefined) => {
		if (!entry || entry.disabled) return;
		entry.run();
		closePalette();
	};
	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = Math.min(activeIndex + 1, Math.max(0, selectableEntries.length - 1));
			return;
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = Math.max(0, activeIndex - 1);
			return;
		}
		if (event.key === 'Enter') {
			event.preventDefault();
			runEntry(selectableEntries[activeIndex]);
			return;
		}
		if (event.key === 'Tab') {
			event.preventDefault();
			const activeEntry = selectableEntries[activeIndex];
			const currentGroupIndex = Math.max(
				0,
				groupOrder.indexOf(activeEntry?.group ?? groupOrder[0])
			);
			for (let offset = 1; offset <= groupOrder.length; offset += 1) {
				const nextGroup = groupOrder[(currentGroupIndex + offset) % groupOrder.length];
				const nextIndex = selectableEntries.findIndex((entry) => entry.group === nextGroup);
				if (nextIndex >= 0) {
					activeIndex = nextIndex;
					break;
				}
			}
			return;
		}
		if (event.key === 'Escape') {
			event.preventDefault();
			closePalette();
		}
	};
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed top-11 right-0 bottom-0 left-0 z-40 bg-[rgba(20,22,25,0.22)]" />
		<Dialog.Content
			class="fixed top-[116px] left-1/2 z-50 flex max-h-[min(620px,calc(100vh-132px))] w-[min(520px,calc(100vw-32px))] -translate-x-1/2 flex-col overflow-hidden rounded-[10px] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.3)] outline-none"
			onkeydown={handleKeyDown}
		>
			<Dialog.Title class="sr-only">コマンドパレット</Dialog.Title>
			<div class="flex h-11 shrink-0 items-center gap-0.5 border-b border-hairline-soft px-4">
				<input
					{@attach focusSearch}
					value={query}
					type="search"
					aria-label="コマンドを検索"
					placeholder="レイヤー、プロパティ、アクション、座標を検索"
					class="h-full min-w-0 flex-1 border-0 bg-transparent text-[13.5px] text-ink-1 outline-none placeholder:text-ink-3"
					oninput={(event) => {
						query = event.currentTarget.value;
						activeIndex = 0;
					}}
				/>
			</div>

			<div class="min-h-0 flex-1 overflow-y-auto pb-2">
				{#if entries.length === 0}
					<p class="px-3 py-8 text-center text-[11px] text-ink-3">一致する項目がありません。</p>
				{:else}
					{#each groupOrder as group (group)}
						{@const groupEntries = entries.filter((entry) => entry.group === group)}
						{#if groupEntries.length > 0}
							<p class="px-4 pt-2 pb-0.5 text-[10px] font-normal text-ink-3">{group}</p>
							{#each groupEntries as entry (entry.id)}
								{@const selectableIndex = selectableEntries.indexOf(entry)}
								<button
									type="button"
									disabled={entry.disabled}
									aria-current={selectableIndex === activeIndex ? 'true' : undefined}
									class={cn(
										'mx-1.5 flex h-8 w-[calc(100%-0.75rem)] items-center gap-2.5 rounded-[6px] px-2.5 text-left text-[12px] outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)] disabled:text-ink-4',
										selectableIndex === activeIndex && !entry.disabled
											? 'bg-accent-soft text-ink-1'
											: 'text-ink-2 hover:bg-field hover:text-ink-1'
									)}
									onmouseenter={() => {
										if (selectableIndex >= 0) activeIndex = selectableIndex;
									}}
									onclick={() => runEntry(entry)}
								>
									<span class="grid w-[18px] shrink-0 place-items-center text-ink-3">
										{#if entry.group === 'レイヤー'}
											<StackSimple size={14} weight="regular" aria-hidden="true" />
										{:else if entry.group === 'プロパティ'}
											<FunctionIcon size={14} weight="regular" aria-hidden="true" />
										{:else if entry.group === 'アクション'}
											<Plus size={14} weight="regular" aria-hidden="true" />
										{:else}
											<Crosshair size={14} weight="regular" aria-hidden="true" />
										{/if}
									</span>
									<span class="min-w-0 truncate">{entry.label}</span>
									{#if entry.detail}
										<span class="max-w-64 shrink-0 truncate text-[10.5px] text-ink-3">
											{entry.detail}
										</span>
									{/if}
									{#if selectableIndex === activeIndex}
										<span class="ml-auto shrink-0 font-mono text-[10px] text-ink-3">↵</span>
									{/if}
								</button>
							{/each}
						{/if}
					{/each}
				{/if}
			</div>

			<div
				class="flex shrink-0 items-center gap-4 border-t border-hairline-soft px-4 pt-2 pb-[9px] font-mono text-[10px] text-ink-3"
			>
				<span>↑↓ 移動</span>
				<span>↵ 実行</span>
				<span>⇥ カテゴリ</span>
				<span>esc 閉じる</span>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
