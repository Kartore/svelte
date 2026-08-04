<script lang="ts">
	import { Menubar } from 'bits-ui';

	import { cn } from '#lib/utils/tailwindUtil.ts';

	let { class: className }: { class?: string } = $props();
</script>

<Menubar.Separator class={cn('mx-1 my-1.5 h-px bg-hairline-soft', className)} />
