<script lang="ts">
	import { Menubar } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	import { cn } from '#lib/utils/tailwindUtil.ts';
	import { useHeaderCommandGroup } from '#lib/contexts/editorCommands.svelte.ts';

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

	const componentId = $props.id();
	const commandGroup = useHeaderCommandGroup();
	const commandId = `${commandGroup?.value ?? 'menu'}:item:${componentId}`;
	const registerCommand: Attachment<HTMLSpanElement> = (element) => {
		if (!commandGroup || !element || !onSelect) return;
		return commandGroup.registry.register({
			id: commandId,
			group: commandGroup.value,
			groupLabel: commandGroup.label,
			getLabel: () => element.textContent?.trim() ?? '',
			getDisabled: () => disabled,
			shortcut,
			run: () => {
				if (!disabled) onSelect?.(new CustomEvent('select'));
			}
		});
	};
</script>

<Menubar.Item
	{disabled}
	{onSelect}
	class={cn(
		'flex h-7 cursor-default items-center gap-2 rounded-[6px] px-2.5 text-xs font-normal text-ink-1 outline-none select-none data-[disabled]:text-ink-4 data-[highlighted]:bg-field',
		className
	)}
>
	<span class="min-w-0 flex-1" data-command-label="" {@attach registerCommand}>
		{@render children()}
	</span>
	{#if shortcut}
		<span class="ml-auto font-mono text-[10px] tracking-tight text-ink-3" aria-hidden="true">
			{shortcut}
		</span>
	{/if}
</Menubar.Item>
