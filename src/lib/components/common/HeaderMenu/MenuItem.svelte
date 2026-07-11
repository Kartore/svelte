<script lang="ts">
	import { Menubar } from 'bits-ui';
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		disabled = false,
		onSelect,
		shortcut,
		children
	}: {
		class?: string;
		disabled?: boolean;
		onSelect?: (event: Event) => void;
		shortcut?: string;
		children: Snippet;
	} = $props();
</script>

<Menubar.Item
	{disabled}
	{onSelect}
	class={cn(
		'flex h-8 cursor-default select-none items-center gap-4 rounded px-2 text-xs font-medium text-gray-700 outline-none data-[disabled]:text-gray-300 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-950',
		className
	)}
>
	<span class="min-w-0 flex-1">{@render children()}</span>
	{#if shortcut}
		<span class="ml-auto font-mono text-[10px] tracking-tight text-gray-400" aria-hidden="true">
			{shortcut}
		</span>
	{/if}
</Menubar.Item>
