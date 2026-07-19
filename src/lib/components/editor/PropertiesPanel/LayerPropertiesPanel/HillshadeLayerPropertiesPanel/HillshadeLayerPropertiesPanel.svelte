<script lang="ts">
	import type {
		HillshadeLayerSpecification,
		SourceSpecification,
		SpriteSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { GeneralProperties } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/GeneralProperties';
	import { RawDataProperties } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/RawDataProperties';
	import { SpecPropertiesSection } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/SpecPropertiesSection';
	import { createSpriteIds } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSpriteIds/useSpriteIds.svelte.ts';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		children,
		layer,
		sources,
		sprite,
		onChange,
		class: className,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: HillshadeLayerSpecification;
		sprite?: SpriteSpecification;
		sources: { [key: string]: SourceSpecification };
		onChange?: onChangeType;
		children?: Snippet;
	} = $props();

	const spriteIdsState = createSpriteIds(() => sprite);
	const spriteIds = $derived(spriteIdsState.spriteIds);
	const spriteImages = $derived(spriteIdsState.spriteImages);
</script>

<div {...props} class={cn('flex flex-col gap-6', className)}>
	<GeneralProperties {layer} {sources} {onChange} />
	<SpecPropertiesSection
		{layer}
		{sources}
		groups={['layout']}
		title="Layout"
		{spriteIds}
		{spriteImages}
		{onChange}
	/>
	<SpecPropertiesSection
		{layer}
		{sources}
		groups={['paint']}
		title="Paint"
		{spriteIds}
		{spriteImages}
		{onChange}
	/>
	<RawDataProperties {layer} {onChange} />
	{@render children?.()}
</div>
