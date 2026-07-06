<script lang="ts">
	import type {
		SymbolLayerSpecification,
		SourceSpecification,
		SpriteSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { FilterProperties } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/FilterProperties';
	import { GeneralProperties } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/GeneralProperties';
	import { RawDataProperties } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/RawDataProperties';
	import { getStyleJSONSchemaDefinition } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/RawDataProperties/schema/StyleJSONSchemaBase.ts';
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
		layer: SymbolLayerSpecification;
		sprite?: SpriteSpecification;
		sources: { [key: string]: SourceSpecification };
		onChange?: onChangeType;
		children?: Snippet;
	} = $props();

	const spriteIdsState = createSpriteIds(() => sprite);
	const spriteIds = $derived(spriteIdsState.spriteIds);
</script>

<div {...props} class={cn('flex flex-col gap-6', className)}>
	<GeneralProperties {layer} {sources} {onChange} />
	<FilterProperties {layer} {onChange} />
	<!-- visibility は symbol-/icon-/text- のどの prefix にも含まれないため専用セクションで出す -->
	<SpecPropertiesSection
		{layer}
		{sources}
		groups={['layout']}
		prefix="visibility"
		title="Layout"
		{onChange}
	/>
	<SpecPropertiesSection
		{layer}
		{sources}
		groups={['layout']}
		prefix="symbol-"
		title="Symbol"
		{spriteIds}
		{onChange}
	/>
	<SpecPropertiesSection
		{layer}
		{sources}
		groups={['layout', 'paint']}
		prefix="icon-"
		title="Icon"
		{spriteIds}
		{onChange}
	/>
	<SpecPropertiesSection
		{layer}
		{sources}
		groups={['layout', 'paint']}
		prefix="text-"
		title="Text"
		{spriteIds}
		{onChange}
	/>
	<RawDataProperties
		{layer}
		{onChange}
		schema={getStyleJSONSchemaDefinition('SymbolLayerSpecification')}
	/>
	{@render children?.()}
</div>
