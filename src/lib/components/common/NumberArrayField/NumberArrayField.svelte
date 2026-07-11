<script lang="ts">
	import { NumberArrayInnerField } from '$lib/components/common/NumberArrayField/NumberArrayInnerField';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label,
		arrayLabels,
		values,
		onChange
	}: {
		class?: string;
		label?: string;
		arrayLabels: string[];
		values: number[];
		onChange?: (values: number[]) => void;
	} = $props();
</script>

<div class={cn('flex flex-row items-center justify-between', className)}>
	{#if label}
		<span class="text-sm font-semibold text-gray-600">{label}</span>
	{/if}
	<div class="flex w-1/2 flex-row gap-1">
		{#each arrayLabels as arrayLabel, index (arrayLabel)}
			<NumberArrayInnerField
				label={arrayLabel}
				value={values[index]}
				onValueChange={(value) => {
					const next = [...values];
					next[index] = value;
					onChange?.(next);
				}}
			/>
		{/each}
	</div>
</div>
