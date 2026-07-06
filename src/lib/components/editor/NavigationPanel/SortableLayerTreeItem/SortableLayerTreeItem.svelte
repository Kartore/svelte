<script lang="ts">
	import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { HTMLAttributes } from 'svelte/elements';

	import { LayerTreeItem } from '$lib/components/editor/NavigationPanel/SortableLayerTreeItem/LayerTreeItem';

	let {
		layer,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'id'> & {
		indicator?: boolean;
		clone?: boolean;
		disableInteraction?: boolean;
		indent?: boolean;
		layer: LayerSpecification;
		isSelected?: boolean;
		errors?: string[];
	} = $props();
</script>

<LayerTreeItem {layer} {...props} />
