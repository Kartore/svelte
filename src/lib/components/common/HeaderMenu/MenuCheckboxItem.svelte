<script lang="ts">
	import { Menubar } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	import { CheckIcon } from '#lib/components/icons';
	import { useHeaderCommandGroup } from '#lib/contexts/editorCommands.svelte.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

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

	const componentId = $props.id();
	const commandGroup = useHeaderCommandGroup();
	const commandId = `${commandGroup?.value ?? 'menu'}:checkbox:${componentId}`;
	const registerCommand: Attachment<HTMLSpanElement> = (element) => {
		if (!commandGroup || !element || !onCheckedChange) return;
		return commandGroup.registry.register({
			id: commandId,
			group: commandGroup.value,
			groupLabel: commandGroup.label,
			getLabel: () => element.textContent?.trim() ?? '',
			getDisabled: () => disabled,
			shortcut,
			run: () => {
				if (!disabled) onCheckedChange?.(!checked);
			}
		});
	};
</script>

<Menubar.CheckboxItem
	{checked}
	{disabled}
	{onCheckedChange}
	class={cn(
		'flex h-7 cursor-default items-center gap-2 rounded-[6px] px-2.5 text-xs font-normal text-ink-1 outline-none select-none data-[disabled]:text-ink-4 data-[highlighted]:bg-field',
		className
	)}
>
	<span class="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">
		{#if checked}
			<CheckIcon class="h-3.5 w-3.5 fill-current" />
		{/if}
	</span>
	<span class="min-w-0 flex-1" data-command-label="" {@attach registerCommand}>
		{@render children()}
	</span>
	{#if shortcut}
		<span class="ml-auto font-mono text-[10px] tracking-tight text-ink-3" aria-hidden="true">
			{shortcut}
		</span>
	{/if}
</Menubar.CheckboxItem>
