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
		label: string;
		arrayLabels: [string, string];
		values: [number, number];
		onChange: (values: [number, number]) => void;
	} = $props();
</script>

<div class={cn('flex flex-row items-center justify-between', className)}>
	<span class="text-sm font-semibold text-gray-600">{label}</span>
	<div class="flex w-1/2 flex-row gap-1">
		<NumberArrayInnerField
			label={arrayLabels[0]}
			value={values[0]}
			onValueChange={(value) => onChange([value, values[1]])}
		/>
		<NumberArrayInnerField
			label={arrayLabels[1]}
			value={values[1]}
			onValueChange={(value) => onChange([values[0], value])}
		/>
	</div>
</div>
