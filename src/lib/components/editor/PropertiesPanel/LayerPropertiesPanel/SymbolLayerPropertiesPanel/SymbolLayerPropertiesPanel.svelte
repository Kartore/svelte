<script lang="ts">
	import type {
		SymbolLayerSpecification,
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
		fontSuggestions,
		onChange,
		class: className,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: SymbolLayerSpecification;
		sprite?: SpriteSpecification;
		fontSuggestions?: string[];
		onChange?: onChangeType;
		children?: Snippet;
	} = $props();

	const spriteIdsState = createSpriteIds(() => sprite);
	const spriteIds = $derived(spriteIdsState.spriteIds);
	const spriteImages = $derived(spriteIdsState.spriteImages);
</script>

<div {...props} class={cn('flex flex-col', className)}>
	<!-- visibility は symbol-/icon-/text- のどの prefix にも含まれないため専用セクションで出す -->
	<SpecPropertiesSection
		{layer}
		groups={['layout']}
		prefix="visibility"
		title="レイアウト"
		{onChange}
	/>
	<SpecPropertiesSection
		{layer}
		groups={['layout']}
		prefix="symbol-"
		title="シンボル"
		{spriteIds}
		{spriteImages}
		{onChange}
	/>
	<SpecPropertiesSection
		{layer}
		groups={['layout', 'paint']}
		prefix="icon-"
		title="アイコン"
		{spriteIds}
		{spriteImages}
		{onChange}
	/>
	<SpecPropertiesSection
		{layer}
		groups={['layout', 'paint']}
		prefix="text-"
		title="テキスト"
		{spriteIds}
		{spriteImages}
		{fontSuggestions}
		{onChange}
	/>
	<GeneralProperties {layer} {onChange} />
	{@render children?.()}
</div>
