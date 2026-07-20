<script lang="ts">
	import { Menubar } from 'bits-ui';
	import type { Snippet } from 'svelte';

	import { CheckIcon } from '$lib/components/icons';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		checked = false,
		disabled = false,
		onCheckedChange,
		shortcut,
		children
	}: {
		class?: string;
		checked?: boolean;
		disabled?: boolean;
		onCheckedChange?: (checked: boolean) => void;
		shortcut?: string;
		children: Snippet;
	} = $props();
</script>

<Menubar.CheckboxItem
	{checked}
	{disabled}
	{onCheckedChange}
	class={cn(
		'flex h-8 cursor-default items-center gap-2 rounded px-2 text-xs font-medium text-gray-700 outline-none select-none data-[disabled]:text-gray-300 data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-950',
		className
	)}
>
	<span class="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
		{#if checked}
			<CheckIcon class="h-3.5 w-3.5 fill-current" />
		{/if}
	</span>
	<span class="min-w-0 flex-1">{@render children()}</span>
	{#if shortcut}
		<span class="ml-auto font-mono text-[10px] tracking-tight text-gray-400" aria-hidden="true">
			{shortcut}
		</span>
	{/if}
</Menubar.CheckboxItem>
