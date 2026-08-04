<script lang="ts">
	import { NumberArrayInnerField } from '#lib/components/common/NumberArrayField/NumberArrayInnerField';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label,
		arrayLabels,
		values,
		stacked = false,
		onChange
	}: {
		class?: string;
		label?: string;
		arrayLabels: string[];
		values: number[];
		stacked?: boolean;
		onChange?: (values: number[]) => void;
	} = $props();
</script>

<div
	class={cn('flex min-h-[30px] min-w-0 flex-row items-center', className)}
	style="column-gap: var(--field-column-gap, 0px)"
>
	{#if label}
		<span
			class="shrink-0 truncate font-mono text-[10px] font-normal text-ink-2"
			style="width: var(--field-label-width, 84px)"
			title={label}>{label}</span
		>
	{/if}
	<div class={cn('flex min-w-0 flex-1 gap-1', stacked ? 'flex-col' : 'flex-row')}>
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
