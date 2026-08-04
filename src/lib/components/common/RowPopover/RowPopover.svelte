<script lang="ts">
	import { Popover } from 'bits-ui';
	import type { Snippet } from 'svelte';

	import { useRowPopover } from '#lib/contexts/rowPopover.svelte.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	const fallbackId = $props.id();
	let {
		id = fallbackId,
		open = $bindable(false),
		onOpenChange,
		trigger,
		customAnchor,
		side = 'left',
		align = 'start',
		sideOffset = 8,
		triggerClass,
		'aria-label': ariaLabel,
		contentClass,
		children
	}: {
		id?: string;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		trigger?: Snippet<[boolean]>;
		customAnchor?:
			HTMLElement | { contextElement?: HTMLElement; getBoundingClientRect: () => DOMRect };
		side?: 'top' | 'right' | 'bottom' | 'left';
		align?: 'start' | 'center' | 'end';
		sideOffset?: number;
		triggerClass?: string;
		'aria-label'?: string;
		contentClass?: string;
		children: Snippet<[{ close: () => void }]>;
	} = $props();

	const group = useRowPopover();
	const isOpen = $derived(group ? group.activeId === id : open);
	const setOpen = (next: boolean) => {
		if (group) {
			if (next) group.open(id);
			else group.close(id);
		} else {
			open = next;
		}
		onOpenChange?.(next);
	};
</script>

<Popover.Root open={isOpen} onOpenChange={setOpen}>
	{#if trigger}
		<Popover.Trigger aria-label={ariaLabel} class={cn('cursor-pointer', triggerClass)}>
			{@render trigger(isOpen)}
		</Popover.Trigger>
	{/if}
	<Popover.Portal>
		<Popover.Content
			class={cn(
				'z-50 w-[252px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-[10px] border border-hairline bg-white text-[11px] shadow-[0_8px_28px_rgba(0,0,0,0.2)]',
				contentClass
			)}
			{customAnchor}
			{side}
			{align}
			{sideOffset}
			collisionPadding={8}
			onEscapeKeydown={() => setOpen(false)}
			onInteractOutside={() => setOpen(false)}
		>
			{@render children({ close: () => setOpen(false) })}
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
