<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		class: className,
		children,
		ref = $bindable(null),
		...props
	}: HTMLButtonAttributes & {
		ref?: HTMLButtonElement | null;
	} = $props();

	const setRef: Attachment<HTMLButtonElement> = (element) => {
		ref = element;
		return () => {
			if (ref === element) ref = null;
		};
	};
</script>

<button
	{@attach setRef}
	type="button"
	{...props}
	class={cn(
		'cursor-pointer transition-colors outline-none hover:bg-field focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)] active:bg-ink-4',
		className
	)}
>
	{@render children?.()}
</button>
