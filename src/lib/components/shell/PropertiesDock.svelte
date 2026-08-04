<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children
	}: {
		children: Snippet;
	} = $props();
</script>

<aside
	class="min-h-0 w-[300px] shrink-0 overflow-hidden border-l border-hairline bg-white"
	aria-label="プロパティ"
>
	{@render children()}
</aside>
