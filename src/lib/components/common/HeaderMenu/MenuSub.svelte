<script lang="ts">
	import { Menubar } from 'bits-ui';
	import { CaretRight } from 'phosphor-svelte';
	import type { Snippet } from 'svelte';

	let {
		label,
		children
	}: {
		label: string;
		children: Snippet;
	} = $props();
</script>

<Menubar.Sub>
	<Menubar.SubTrigger
		class="flex h-7 cursor-default items-center gap-2 rounded-[6px] px-2.5 text-xs font-normal text-ink-1 outline-none select-none data-[highlighted]:bg-field data-[state=open]:bg-field"
	>
		<span class="min-w-0 flex-1">{label}</span>
		<CaretRight size={13} weight="regular" class="shrink-0 text-ink-3" aria-hidden="true" />
	</Menubar.SubTrigger>
	<Menubar.Portal>
		<Menubar.SubContent
			forceMount
			class="z-50 w-[236px] rounded-[10px] border border-hairline bg-white p-1.5 text-xs shadow-[0_8px_28px_rgba(0,0,0,0.2)] outline-none data-[state=closed]:hidden"
			sideOffset={2}
			collisionPadding={8}
			loop
		>
			{@render children()}
		</Menubar.SubContent>
	</Menubar.Portal>
</Menubar.Sub>
