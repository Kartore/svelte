<script lang="ts">
	import { Button } from '#lib/components/common/Button';
	import { cn } from '#lib/utils/tailwindUtil.ts';

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

<div
	class={cn('flex min-h-7 min-w-0 items-start justify-between', className)}
	style="column-gap: var(--field-column-gap, 8px)"
>
	<span
		class="shrink-0 truncate pt-1 font-mono text-[10px] font-normal text-ink-2"
		style="width: var(--field-label-width, auto)"
		title={label}>{label}</span
	>
	<div class="flex min-w-0 flex-1 flex-row flex-wrap justify-end gap-1">
		{#each items as item (item.value)}
			<Button
				aria-pressed={selectedValues.includes(item.value)}
				class="h-6 rounded-[5px] border-none bg-field px-2 font-mono text-[11px] font-normal whitespace-nowrap text-ink-1 hover:shadow-[inset_0_0_0_1px_var(--color-accent)] focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)] focus-visible:outline-0 aria-pressed:bg-accent-soft aria-pressed:text-accent"
				onclick={() => toggle(item.value)}
			>
				{item.label}
			</Button>
		{/each}
	</div>
</div>
