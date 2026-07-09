<script lang="ts">
	import type { LayerSpecification, SourceSpecification } from '@maplibre/maplibre-gl-style-spec';

	import { SpecPropertyField } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/SpecPropertyField';
	import type { SpriteImage } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSpriteIds/useSpriteIds.svelte.ts';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import {
		getLayerProperties,
		getLayerRawPropertyValue,
		isPropertyActive
	} from '$lib/utils/layerSpec.ts';

	let {
		layer,
		groups,
		title,
		prefix,
		exclude = [],
		spriteIds,
		spriteImages,
		sources,
		onChange
	}: {
		layer: LayerSpecification;
		groups: ('paint' | 'layout')[];
		title: string;
		prefix?: string;
		exclude?: string[];
		spriteIds?: string[];
		spriteImages?: SpriteImage[];
		sources?: { [key: string]: SourceSpecification };
		onChange?: onChangeType;
	} = $props();

	const entries = $derived(
		groups.flatMap((group) =>
			getLayerProperties(layer.type, group)
				.filter((entry) => prefix === undefined || entry.key.startsWith(prefix))
				.filter((entry) => !exclude.includes(entry.key))
				.map((entry) => ({ ...entry, group }))
				.filter((entry) => {
					return (
						getLayerRawPropertyValue(layer, entry.group, entry.key) !== undefined ||
						isPropertyActive(layer, entry.spec.requires, sources)
					);
				})
		)
	);
</script>

{#if entries.length > 0}
	<div class="flex flex-col gap-2 px-4">
		<h3 class="font-montserrat text-sm font-semibold">{title}</h3>
		{#each entries as entry (entry.key)}
			<SpecPropertyField
				{layer}
				group={entry.group}
				{entry}
				labelPrefix={prefix}
				{spriteIds}
				{spriteImages}
				{onChange}
			/>
		{/each}
	</div>
{/if}
