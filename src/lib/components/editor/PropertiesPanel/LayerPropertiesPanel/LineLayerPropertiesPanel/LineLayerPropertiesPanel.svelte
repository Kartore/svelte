<script lang="ts">
	import type {
		LineLayerSpecification,
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
		layer: LineLayerSpecification;
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
		groups={['paint']}
		title="色"
		include={[
			'line-color',
			'line-opacity',
			'line-pattern',
			'line-gradient',
			'line-trim-color',
			'line-emissive-strength'
		]}
		{spriteIds}
		{spriteImages}
		{onChange}
	/>
	<SpecPropertiesSection
		{layer}
		groups={['paint']}
		title="幅"
		meta="ズーム"
		include={[
			'line-width',
			'line-gap-width',
			'line-z-offset',
			'line-elevation-reference',
			'line-cross-slope',
			'line-width-unit',
			'line-trim-offset',
			'line-trim-fade-range'
		]}
		{spriteIds}
		{spriteImages}
		{onChange}
	/>
	<SpecPropertiesSection
		{layer}
		groups={['layout']}
		title="線端・結合"
		{spriteIds}
		{spriteImages}
		{onChange}
	/>
	<GeneralProperties {layer} {onChange} />
	<SpecPropertiesSection
		{layer}
		groups={['paint']}
		title="破線"
		include={['line-dasharray']}
		{spriteIds}
		{spriteImages}
		{onChange}
	/>
	<SpecPropertiesSection
		{layer}
		groups={['paint']}
		title="オフセット・ブラー"
		include={['line-offset', 'line-blur', 'line-translate', 'line-translate-anchor']}
		{spriteIds}
		{spriteImages}
		{onChange}
	/>
	{@render children?.()}
</div>
