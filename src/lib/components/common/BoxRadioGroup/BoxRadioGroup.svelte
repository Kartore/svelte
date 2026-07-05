<script lang="ts">
	import { RadioGroup } from 'bits-ui';

	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label,
		items,
		value = $bindable(),
		onValueChange,
		disabled
	}: {
		class?: string;
		label?: string;
		items: { value: string; label: string }[];
		value?: string;
		onValueChange?: (value: string) => void;
		disabled?: boolean;
	} = $props();
</script>

<div class={cn('flex items-center justify-between text-sm', className)}>
	{#if label}
		<span class="font-semibold text-gray-600">{label}</span>
	{/if}
	<RadioGroup.Root
		bind:value
		{onValueChange}
		{disabled}
		orientation="horizontal"
		aria-label={label}
		class="flex w-1/2 flex-row items-center justify-end gap-1"
	>
		{#each items as item (item.value)}
			<RadioGroup.Item
				value={item.value}
				class="block cursor-pointer rounded border-none bg-gray-100 px-2 py-1 text-sm font-semibold transition-colors hover:bg-gray-200 focus-visible:bg-gray-200 focus-visible:outline-0 data-[state=checked]:bg-gray-300"
			>
				{item.label}
			</RadioGroup.Item>
		{/each}
	</RadioGroup.Root>
</div>
