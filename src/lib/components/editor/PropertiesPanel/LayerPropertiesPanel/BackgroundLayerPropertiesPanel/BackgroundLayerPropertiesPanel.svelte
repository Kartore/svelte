<script lang="ts">
	import type {
		BackgroundLayerSpecification,
		SpriteSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { RangeSlider } from '$lib/components/common/RangeSlider';
	import { RawDataProperties } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/RawDataProperties';
	import { getStyleJSONSchemaDefinition } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/RawDataProperties/schema/StyleJSONSchemaBase.ts';
	import { SpecPropertiesSection } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/SpecPropertiesSection';
	import { createSpriteIds } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSpriteIds/useSpriteIds.svelte.ts';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		children,
		layer,
		sprite,
		onChange,
		class: className,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: BackgroundLayerSpecification;
		sprite?: SpriteSpecification;
		onChange?: onChangeType;
		children?: Snippet;
	} = $props();

	const spriteIdsState = createSpriteIds(() => sprite);
	const spriteIds = $derived(spriteIdsState.spriteIds);
</script>

<div {...props} class={cn('flex flex-col gap-6', className)}>
	<div class="flex flex-col gap-2 px-4">
		<h3 class="font-montserrat text-sm font-semibold">General</h3>
		<RangeSlider
			label="Zoom Range"
			minValue={0}
			maxValue={24}
			step={1}
			value={[layer.minzoom ?? 0, layer.maxzoom ?? 24]}
			onValueChange={([minzoom, maxzoom]) => {
				if (minzoom !== layer.minzoom) {
					onChange?.(layer, undefined, 'minzoom', minzoom === 0 ? undefined : minzoom);
				}
				if (maxzoom !== layer.maxzoom) {
					onChange?.(layer, undefined, 'maxzoom', maxzoom === 24 ? undefined : maxzoom);
				}
			}}
		/>
	</div>
	<SpecPropertiesSection {layer} groups={['layout']} title="Layout" {spriteIds} {onChange} />
	<SpecPropertiesSection {layer} groups={['paint']} title="Paint" {spriteIds} {onChange} />
	<RawDataProperties
		{layer}
		{onChange}
		schema={getStyleJSONSchemaDefinition('BackgroundLayerSpecification')}
	/>
	{@render children?.()}
</div>
