<script lang="ts">
	import { Menubar } from 'bits-ui';
	import type { Snippet } from 'svelte';

	import { ArrowDropDownIcon } from '$lib/components/icons';

	let {
		value,
		label,
		children
	}: {
		value: string;
		label: string;
		children: Snippet;
	} = $props();
</script>

<Menubar.Menu {value}>
	<Menubar.Trigger
		class="flex h-7 cursor-default items-center gap-0.5 rounded-md px-2 text-xs font-semibold text-gray-600 transition-colors outline-none hover:bg-gray-100 focus-visible:bg-gray-100 data-[state=open]:bg-gray-100 data-[state=open]:text-gray-900"
	>
		<span>{label}</span>
		<ArrowDropDownIcon class="h-3.5 w-3.5 fill-current" />
	</Menubar.Trigger>
	<Menubar.Portal>
		<Menubar.Content
			class="z-50 min-w-48 rounded-md border border-gray-200 bg-white p-1 shadow-xl shadow-gray-950/15 outline-none"
			align="start"
			sideOffset={4}
			collisionPadding={8}
			loop
		>
			{@render children()}
		</Menubar.Content>
	</Menubar.Portal>
</Menubar.Menu>
