<script lang="ts">
	import type {
		RasterLayerSpecification,
		SourceSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { GeneralProperties } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/GeneralProperties';
	import { RawDataProperties } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/RawDataProperties';
	import { getStyleJSONSchemaDefinition } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/RawDataProperties/schema/StyleJSONSchemaBase.ts';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		children,
		layer,
		sources,
		onChange,
		class: className,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: RasterLayerSpecification;
		sources: { [key: string]: SourceSpecification };
		onChange?: onChangeType;
		children?: Snippet;
	} = $props();
</script>

<div {...props} class={cn('flex flex-col gap-6', className)}>
	<GeneralProperties {layer} {sources} {onChange} />
	<RawDataProperties
		{layer}
		{onChange}
		schema={getStyleJSONSchemaDefinition('RasterLayerSpecification')}
	/>
	{@render children?.()}
</div>
