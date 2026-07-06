<script lang="ts">
	import { Button } from '$lib/components/common/Button';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label,
		items,
		values,
		onChange
	}: {
		class?: string;
		label: string;
		items: { value: string; label: string }[];
		values?: string[];
		onChange?: (values: string[] | undefined) => void;
	} = $props();

	const selectedValues = $derived(values ?? []);

	const toggle = (value: string) => {
		const next = selectedValues.includes(value)
			? selectedValues.filter((selectedValue) => selectedValue !== value)
			: [...selectedValues, value];
		onChange?.(next.length === 0 ? undefined : next);
	};
</script>

<div class={cn('flex items-start justify-between gap-2 text-sm', className)}>
	<span class="pt-1 font-semibold whitespace-nowrap text-gray-600">{label}</span>
	<div class="flex flex-1 flex-row flex-wrap justify-end gap-1">
		{#each items as item (item.value)}
			<Button
				aria-pressed={selectedValues.includes(item.value)}
				class="rounded border-none bg-gray-100 px-2 py-1 text-sm font-semibold whitespace-nowrap hover:bg-gray-200 focus-visible:bg-gray-200 focus-visible:outline-0 aria-pressed:bg-gray-300"
				onclick={() => toggle(item.value)}
			>
				{item.label}
			</Button>
		{/each}
	</div>
</div>
