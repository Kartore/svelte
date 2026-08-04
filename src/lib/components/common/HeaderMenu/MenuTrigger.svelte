<script lang="ts">
	import { Menubar } from 'bits-ui';
	import { untrack, type Snippet } from 'svelte';

	import { ArrowDropDownIcon } from '#lib/components/icons';
	import { provideHeaderCommandGroup } from '#lib/contexts/editorCommands.svelte.ts';

	let {
		value,
		label,
		children
	}: {
		value: string;
		label: string;
		children: Snippet;
	} = $props();

	provideHeaderCommandGroup(
		untrack(() => value),
		untrack(() => label)
	);
</script>

<Menubar.Menu {value}>
	<Menubar.Trigger
		class="flex h-[26px] cursor-default items-center gap-0.5 rounded-[5px] px-2 text-[11.5px] font-normal text-ink-2 outline-none hover:bg-field focus-visible:bg-field data-[state=open]:bg-field data-[state=open]:text-ink-1"
	>
		<span>{label}</span>
		<ArrowDropDownIcon class="h-3.5 w-3.5 fill-current" />
	</Menubar.Trigger>
	<Menubar.Portal>
		<Menubar.Content
			forceMount
			class="z-50 w-[236px] rounded-[10px] border border-hairline bg-white p-1.5 text-xs shadow-[0_8px_28px_rgba(0,0,0,0.2)] outline-none data-[state=closed]:hidden"
			align="start"
			sideOffset={4}
			collisionPadding={8}
			loop
		>
			{@render children()}
		</Menubar.Content>
	</Menubar.Portal>
</Menubar.Menu>

<style>
	:global([data-bits-floating-content-wrapper]:has(> [data-menubar-content])) {
		z-index: 50;
	}
	:global([data-bits-floating-content-wrapper]:has(> [data-menubar-sub-content])) {
		z-index: 50;
	}
</style>
