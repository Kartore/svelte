<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		children,
		ref = $bindable(null),
		...props
	}: HTMLButtonAttributes & {
		ref?: HTMLButtonElement | null;
	} = $props();
</script>

<button
	bind:this={ref}
	type="button"
	{...props}
	class={cn('cursor-pointer transition-colors hover:bg-gray-100 active:bg-gray-300', className)}
>
	{@render children?.()}
</button>
