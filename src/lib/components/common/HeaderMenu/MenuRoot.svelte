<script lang="ts">
	import { Menubar } from 'bits-ui';
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		children
	}: {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<Menubar.Root class={cn('flex items-center gap-0.5', className)} loop>
	{@render children()}
</Menubar.Root>
