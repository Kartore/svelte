<script lang="ts">
	import { Popover } from 'bits-ui';
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		open = $bindable(false),
		onOpenChange,
		trigger,
		triggerClass,
		contentClass,
		'aria-label': ariaLabel,
		children
	}: {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		trigger: Snippet;
		triggerClass?: string;
		contentClass?: string;
		'aria-label'?: string;
		children: Snippet;
	} = $props();
</script>

<Popover.Root bind:open {onOpenChange}>
	<Popover.Trigger aria-label={ariaLabel} class={cn('cursor-pointer', triggerClass)}>
		{@render trigger()}
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			class={cn('z-50', contentClass)}
			sideOffset={4}
			align="start"
			collisionPadding={8}
		>
			{@render children()}
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
