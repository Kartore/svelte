<script lang="ts">
	import { Menubar } from 'bits-ui';

	import { cn } from '$lib/utils/tailwindUtil.ts';

	let { class: className }: { class?: string } = $props();
</script>

<Menubar.Separator class={cn('my-1 h-px bg-gray-200', className)} />
