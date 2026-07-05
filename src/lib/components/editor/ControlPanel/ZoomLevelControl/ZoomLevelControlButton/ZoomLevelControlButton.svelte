<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	import { Button } from '$lib/components/common/Button';
	import { cn } from '$lib/utils/tailwindUtil';

	let {
		class: className,
		children,
		ref = $bindable(null),
		...props
	}: HTMLButtonAttributes & {
		ref?: HTMLButtonElement | null;
	} = $props();
</script>

<Button
	bind:ref
	{...props}
	class={cn(
		'size-7 cursor-pointer rounded-lg border border-gray-300 bg-white p-1 transition-colors hover:bg-gray-100 active:bg-gray-300 disabled:cursor-default disabled:bg-white disabled:text-gray-300',
		className
	)}
>
	{@render children?.()}
</Button>
