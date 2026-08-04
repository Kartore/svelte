<script lang="ts">
	import { RadioGroup } from 'bits-ui';

	import { cn } from '#lib/utils/tailwindUtil.ts';

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

<div
	class={cn('flex h-[30px] min-w-0 items-center', className)}
	style="column-gap: var(--field-column-gap, 0px)"
>
	{#if label}
		<span
			class="shrink-0 truncate font-mono text-[10px] font-normal text-ink-2"
			style="width: var(--field-label-width, 84px)"
			title={label}>{label}</span
		>
	{/if}
	<RadioGroup.Root
		bind:value
		{onValueChange}
		{disabled}
		orientation="horizontal"
		aria-label={label}
		class="flex h-6 min-w-0 flex-1 flex-row items-center rounded-[6px] bg-field p-0.5"
	>
		{#each items as item (item.value)}
			<RadioGroup.Item
				value={item.value}
				class="block h-5 min-w-0 flex-1 cursor-pointer rounded-[4px] border-none bg-transparent px-1.5 text-[10px] font-normal whitespace-nowrap text-ink-2 focus-visible:outline-2 focus-visible:outline-accent data-[state=checked]:bg-white data-[state=checked]:font-semibold data-[state=checked]:text-ink-1 data-[state=checked]:shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
			>
				{item.label}
			</RadioGroup.Item>
		{/each}
	</RadioGroup.Root>
</div>
