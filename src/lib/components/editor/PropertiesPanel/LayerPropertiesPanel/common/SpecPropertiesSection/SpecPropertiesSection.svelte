<script lang="ts">
	import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
	import { tick } from 'svelte';

	import { SpecPropertyField } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/SpecPropertyField';
	import type { SpriteImage } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSpriteIds/useSpriteIds.svelte.ts';
	import type { onChangeType } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { PropertyCatalogPopover } from '#lib/components/editor/PropertiesPanel/PropertyCatalogPopover';
	import { getLayerProperties, getLayerRawPropertyValue } from '#lib/utils/layerSpec.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		layer,
		groups,
		title,
		prefix,
		include,
		exclude = [],
		meta,
		spriteIds,
		spriteImages,
		onChange
	}: {
		layer: LayerSpecification;
		groups: ('paint' | 'layout')[];
		title: string;
		prefix?: string;
		include?: string[];
		exclude?: string[];
		meta?: string;
		spriteIds?: string[];
		spriteImages?: SpriteImage[];
		onChange?: onChangeType;
	} = $props();

	let sectionElement = $state<HTMLDivElement | null>(null);
	const captureSectionElement = (element: HTMLDivElement) => {
		sectionElement = element;
		return () => {
			if (sectionElement === element) sectionElement = null;
		};
	};
	const allEntries = $derived(
		groups.flatMap((group) =>
			getLayerProperties(layer.type, group)
				.filter((entry) => prefix === undefined || entry.key.startsWith(prefix))
				.filter((entry) => include === undefined || include.includes(entry.key))
				.filter((entry) => !exclude.includes(entry.key))
				.map((entry) => ({ ...entry, group }))
		)
	);
	const sectionExclude = $derived([
		...exclude,
		...groups.flatMap((group) =>
			getLayerProperties(layer.type, group)
				.filter((entry) => include !== undefined && !include.includes(entry.key))
				.map((entry) => entry.key)
		)
	]);
	const entries = $derived(
		allEntries.filter(
			(entry) => getLayerRawPropertyValue(layer, entry.group, entry.key) !== undefined
		)
	);
	const addProperty = async (
		item: { group: 'paint' | 'layout'; key: string },
		initialValue: unknown
	) => {
		onChange?.(layer, item.group, item.key as never, initialValue as never);
		await tick();
		const row = sectionElement?.querySelector<HTMLElement>(
			`[data-property-row="${CSS.escape(`${item.group}:${item.key}`)}"]`
		);
		row?.querySelector<HTMLElement>('input, button, [tabindex]')?.focus();
	};
</script>

<div
	class={cn(
		'flex flex-col border-b border-hairline-soft px-4 pt-1.5',
		entries.length > 0 ? 'pb-2.5' : 'pb-1'
	)}
	{@attach captureSectionElement}
>
	<div class="flex h-7 items-center justify-between">
		<div class="flex min-w-0 items-center">
			<h3
				class="flex items-center gap-1.5 truncate text-[11px] font-semibold"
				class:text-ink-1={entries.length > 0}
				class:text-ink-3={entries.length === 0}
			>
				{title}
				{#if meta}
					<span class="text-[9px] font-semibold tracking-[0.04em] text-ink-3">{meta}</span>
				{/if}
			</h3>
		</div>
		<PropertyCatalogPopover
			{layer}
			{groups}
			{prefix}
			exclude={[...sectionExclude, ...entries.map((entry) => entry.key)]}
			label={`${title} プロパティを追加`}
			onSelect={addProperty}
		/>
	</div>
	{#if entries.length > 0}
		<div class="flex flex-col">
			{#each entries as entry (`${entry.group}:${entry.key}`)}
				<div
					class="flex min-h-[30px] items-start"
					data-property-row={`${entry.group}:${entry.key}`}
				>
					<div class="w-full min-w-0">
						<SpecPropertyField
							{layer}
							group={entry.group}
							{entry}
							{spriteIds}
							{spriteImages}
							onReset={() => onChange?.(layer, entry.group, entry.key as never, undefined as never)}
							{onChange}
						/>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
