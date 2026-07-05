<script lang="ts">
	import type {
		LayerSpecification,
		SourceSpecification,
		SpriteSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { LayerPropertiesPanel } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		sources,
		sprite,
		layer,
		onChange,
		children,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: LayerSpecification;
		sprite?: SpriteSpecification;
		sources: { [key: string]: SourceSpecification };
		onChange?: onChangeType;
		children?: Snippet;
	} = $props();
</script>

<div
	{...props}
	class={cn(
		'pointer-events-auto overflow-y-auto rounded-lg border border-gray-300 bg-white py-4',
		className
	)}
>
	<LayerPropertiesPanel {layer} {sprite} {sources} {onChange} />
	{@render children?.()}
</div>
