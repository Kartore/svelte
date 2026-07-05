<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { useBackgroundMap } from '$lib/contexts/backgroundMap.svelte';
	import { cn } from '$lib/utils/tailwindUtil';

	let { class: className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'children'> = $props();

	const backgroundMap = useBackgroundMap();
	const zoomLevel = $derived(backgroundMap.zoom?.toFixed(2));
</script>

<div
	{...props}
	class={cn(
		'rounded-lg border border-gray-300 bg-white px-2 py-1 font-semibold tabular-nums',
		className
	)}
>
	{zoomLevel}
</div>
