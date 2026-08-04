<script lang="ts">
	import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
	import { MagnifyingGlass, Plus, WarningCircle, X } from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import { RowPopover } from '#lib/components/common/RowPopover';
	import { isPropertyCatalogInsertKey } from '#lib/components/editor/PropertiesPanel/PropertyCatalogPopover/propertyCatalogKeyboard.ts';
	import type { LayerPropertyGroup } from '#lib/utils/layerSpec.ts';
	import {
		getLayerPropertyCatalog,
		getPropertyInitialValue,
		type PropertyCatalogItem
	} from '#lib/utils/propertyCatalog.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		layer,
		groups = ['layout', 'paint'],
		prefix,
		exclude = [],
		configuredOnly = false,
		label = 'プロパティを追加',
		triggerText,
		triggerClass,
		onSelect
	}: {
		layer: LayerSpecification;
		groups?: LayerPropertyGroup[];
		prefix?: string;
		exclude?: string[];
		configuredOnly?: boolean;
		label?: string;
		triggerText?: string;
		triggerClass?: string;
		onSelect: (item: PropertyCatalogItem, initialValue: unknown) => void;
	} = $props();

	let search = $state('');
	let activeIndex = $state(0);
	const configuredKeys = $derived(
		new Set(
			groups.flatMap((group) =>
				Object.keys((layer[group] as Record<string, unknown> | undefined) ?? {}).map(
					(key) => `${group}:${key}`
				)
			)
		)
	);
	const catalog = $derived(
		getLayerPropertyCatalog(layer.type, groups)
			.filter((item) => prefix === undefined || item.key.startsWith(prefix))
			.filter((item) => !exclude.includes(item.key))
			.filter((item) => (configuredOnly ? configuredKeys.has(`${item.group}:${item.key}`) : true))
	);
	const normalizedSearch = $derived(search.trim().toLocaleLowerCase());
	const filteredCatalog = $derived(
		catalog.filter((item) => {
			if (normalizedSearch === '') return true;
			return `${item.key} ${item.label} ${item.description}`
				.toLocaleLowerCase()
				.includes(normalizedSearch);
		})
	);

	const groupLabels: Record<LayerPropertyGroup, string> = {
		layout: 'レイアウト',
		paint: 'ペイント'
	};
	const formatValue = (value: unknown): string => {
		if (value === undefined) return '既定 なし';
		if (typeof value === 'string') return value === '' ? '既定 空' : value;
		const serialized = JSON.stringify(value);
		return serialized === undefined ? String(value) : serialized;
	};
	const selectItem = (item: PropertyCatalogItem | undefined, close: () => void): void => {
		if (!item) return;
		onSelect(item, getPropertyInitialValue(item));
		close();
	};
</script>

<RowPopover
	aria-label={label}
	triggerClass={cn(
		'flex h-6 items-center justify-center gap-1.5 rounded-[6px] text-ink-3 hover:bg-field hover:text-ink-1 focus-visible:outline-2 focus-visible:outline-accent',
		triggerText ? 'w-full px-2' : 'w-6',
		triggerClass
	)}
	onOpenChange={(open) => {
		if (!open) {
			search = '';
			activeIndex = 0;
		}
	}}
>
	{#snippet trigger()}
		<Plus size={14} weight="regular" aria-hidden="true" />
		{#if triggerText}
			<span class="truncate">{triggerText}</span>
		{/if}
	{/snippet}

	{#snippet children({ close })}
		<div class="flex h-10 items-center gap-2 border-b border-hairline-soft pr-1.5 pl-3">
			<p class="font-semibold text-ink-1">プロパティを追加</p>
			<p class="font-mono text-[11px] text-ink-3">{layer.type}</p>
			<Button
				class="ml-auto grid size-[26px] place-items-center rounded-[5px] text-ink-3 hover:bg-field hover:text-ink-1 focus-visible:outline-none"
				aria-label="閉じる"
				onclick={close}
			>
				<X size={14} weight="regular" aria-hidden="true" />
			</Button>
		</div>
		<div class="px-3 pt-2.5 pb-2">
			<label class="flex h-[26px] items-center gap-1.5 rounded-[5px] bg-field px-2 text-ink-3">
				<MagnifyingGlass size={11} weight="regular" class="shrink-0" aria-hidden="true" />
				<input
					type="search"
					aria-label="プロパティを検索"
					placeholder="検索…"
					bind:value={search}
					class="h-full min-w-0 flex-1 border-0 bg-transparent text-[11px] font-normal text-ink-1 outline-none placeholder:text-ink-3"
					oninput={() => {
						activeIndex = 0;
					}}
					onkeydown={(event) => {
						if (event.key === 'ArrowDown') {
							event.preventDefault();
							activeIndex = Math.min(activeIndex + 1, Math.max(0, filteredCatalog.length - 1));
							return;
						}
						if (event.key === 'ArrowUp') {
							event.preventDefault();
							activeIndex = Math.max(0, activeIndex - 1);
							return;
						}
						if (!isPropertyCatalogInsertKey(event)) return;
						event.preventDefault();
						selectItem(filteredCatalog[activeIndex], close);
					}}
				/>
			</label>
		</div>
		<div class="max-h-80 overflow-y-auto px-2 pb-2">
			{#if filteredCatalog.length === 0}
				<p class="px-2 py-6 text-center text-ink-3">一致するプロパティはありません。</p>
			{:else}
				{#each groups as group (group)}
					{@const items = filteredCatalog.filter((item) => item.group === group)}
					{#if items.length > 0}
						<p class="px-1 pt-1.5 pb-1 text-[10px] font-normal text-ink-3">
							{groupLabels[group]}
						</p>
						{#each items as item (`${item.group}:${item.key}`)}
							{@const itemIndex = filteredCatalog.indexOf(item)}
							<Button
								class={cn(
									'flex min-h-[42px] w-full items-start gap-2 rounded-[6px] px-2 py-1.5 text-left focus-visible:outline-2 focus-visible:outline-accent',
									itemIndex === activeIndex ? 'bg-accent-soft' : 'hover:bg-field'
								)}
								onmouseenter={() => {
									activeIndex = itemIndex;
								}}
								onclick={() => selectItem(item, close)}
							>
								<span class="min-w-0 flex-1">
									<span class="flex items-center justify-between gap-2">
										<span class="block truncate font-mono text-[11px] text-ink-1">
											{item.key}
										</span>
										<span
											class="max-w-20 shrink-0 truncate font-mono text-[10px] text-ink-3"
											title={formatValue(item.defaultValue)}
										>
											{formatValue(item.defaultValue)}
										</span>
									</span>
									<span class="mt-0.5 block text-[10px] leading-[14px] text-ink-3">
										{item.description}
									</span>
									{#if item.requirements.length > 0}
										<span class="mt-1 flex items-start gap-1 text-[10px] leading-4 text-ink-2">
											<WarningCircle
												size={12}
												weight="regular"
												class="mt-0.5 shrink-0"
												aria-hidden="true"
											/>
											<span>{item.requirements.map(({ message }) => message).join(' ')}</span>
										</span>
									{/if}
								</span>
							</Button>
						{/each}
					{/if}
				{/each}
			{/if}
		</div>
		<div class="border-t border-hairline-soft px-3 py-[9px] text-[10px] text-ink-3">
			↵ で既定値のまま挿入し、その行にフォーカス
		</div>
	{/snippet}
</RowPopover>
