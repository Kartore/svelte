<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { ZoomLevelControl } from '$lib/components/editor/ControlPanel/ZoomLevelControl';
	import { ZoomLevelViewer } from '$lib/components/editor/ControlPanel/ZoomLevelViewer';
	import { cn } from '$lib/utils/tailwindUtil';

	let { class: className, children, ...props }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div {...props} class={cn('pointer-events-none relative', className)}>
	<ZoomLevelViewer class="absolute top-0 right-0" />
	<ZoomLevelControl class="absolute top-10 right-0" />
	{@render children?.()}
</div>
