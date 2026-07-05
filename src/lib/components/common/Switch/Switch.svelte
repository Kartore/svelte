<script lang="ts">
	import { Switch } from 'bits-ui';

	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label,
		checked = $bindable(false),
		onCheckedChange,
		disabled
	}: {
		class?: string;
		label: string;
		checked?: boolean;
		onCheckedChange?: (checked: boolean) => void;
		disabled?: boolean;
	} = $props();

	const id = $props.id();
</script>

<div class={cn('flex flex-row items-center justify-between', className)}>
	<label for={id} class="text-sm font-semibold text-gray-600">{label}</label>
	<Switch.Root
		{id}
		bind:checked
		{onCheckedChange}
		{disabled}
		class="cursor-pointer"
		aria-label={label}
	>
		<svg width={40} height={24} aria-hidden="true" style="margin-right: 4px;">
			<rect x={4} y={4} width={32} height={16} rx={8} fill={checked ? 'orange' : 'gray'} />
			<circle cx={checked ? 28 : 12} cy={12} r={5} fill="white" />
		</svg>
	</Switch.Root>
</div>
