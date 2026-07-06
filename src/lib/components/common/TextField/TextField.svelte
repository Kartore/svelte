<script lang="ts">
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label,
		value = $bindable(''),
		onValueChange,
		onCommit,
		description,
		disabled,
		'aria-label': ariaLabel
	}: {
		class?: string;
		label?: string;
		value?: string;
		onValueChange?: (value: string) => void;
		onCommit?: (value: string) => void;
		description?: string;
		disabled?: boolean;
		'aria-label'?: string;
	} = $props();

	const id = $props.id();
</script>

<div class={cn('flex flex-row items-center justify-between', className)}>
	{#if label}
		<label for={id} class="text-sm font-semibold text-gray-600">{label}</label>
	{/if}
	<input
		{id}
		type="text"
		aria-label={label ? undefined : ariaLabel}
		{disabled}
		bind:value
		oninput={() => onValueChange?.(value)}
		onblur={() => onCommit?.(value)}
		onkeydown={(event) => {
			if (event.key === 'Enter') {
				event.currentTarget.blur();
			}
		}}
		class="w-1/2 rounded border-none bg-gray-100 px-2 py-1 text-sm font-semibold transition-colors hover:bg-gray-200 focus-visible:bg-gray-200 focus-visible:outline-0"
	/>
	{#if description}
		<div class="text-xs">{description}</div>
	{/if}
</div>
