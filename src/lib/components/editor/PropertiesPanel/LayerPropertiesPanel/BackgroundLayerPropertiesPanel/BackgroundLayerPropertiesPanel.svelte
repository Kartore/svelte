<script lang="ts">
	import type {
		BackgroundLayerSpecification,
		SpriteSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { GeneralProperties } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/GeneralProperties';
	import { SpecPropertiesSection } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/SpecPropertiesSection';
	import { createSpriteIds } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSpriteIds/useSpriteIds.svelte.ts';
	import type { onChangeType } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

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
	const spriteImages = $derived(spriteIdsState.spriteImages);
</script>

<div {...props} class={cn('flex flex-col', className)}>
	<SpecPropertiesSection
		{layer}
		groups={['layout']}
		title="レイアウト"
		{spriteIds}
		{spriteImages}
		{onChange}
	/>
	<SpecPropertiesSection
		{layer}
		groups={['paint']}
		title="ペイント"
		{spriteIds}
		{spriteImages}
		{onChange}
	/>
	<GeneralProperties {layer} {onChange} />
	{@render children?.()}
</div>
