<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { ArrowDropDownIcon, ErrorIcon } from '$lib/components/icons';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		name,
		count,
		collapsed,
		errors,
		onToggle,
		class: className,
		...props
	}: Omit<HTMLAttributes<HTMLButtonElement>, 'children'> & {
		name: string;
		count: number;
		collapsed?: boolean;
		errors?: string[];
		onToggle?: () => void;
	} = $props();
</script>

<button
	{...props}
	type="button"
	class={cn(
		'flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-100',
		className
	)}
	onclick={onToggle}
>
	<ArrowDropDownIcon
		aria-hidden="true"
		class={cn('h-4 w-4 min-w-4 transition-transform', collapsed && '-rotate-90')}
	/>
	<p class="min-w-0 flex-1 overflow-hidden text-start font-semibold text-ellipsis">{name}</p>
	<span class="text-xs text-gray-400">({count})</span>
	{#if errors && errors.length > 0}
		<span class="flex items-center" title={errors.join('\n')}>
			<ErrorIcon
				class="h-3.5 w-3.5 min-w-3.5 fill-red-500"
				role="img"
				aria-label={`${name} has ${errors.length} error${errors.length === 1 ? '' : 's'}`}
			/>
		</span>
	{/if}
</button>
