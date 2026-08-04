<script lang="ts">
	import { Switch } from 'bits-ui';

	import { cn } from '#lib/utils/tailwindUtil.ts';

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

<div
	class={cn('flex h-[30px] min-w-0 flex-row items-center', className)}
	style="column-gap: var(--field-column-gap, 0px)"
>
	<label
		for={id}
		class="shrink-0 truncate font-mono text-[10px] font-normal text-ink-2"
		style="width: var(--field-label-width, 84px)"
		title={label}>{label}</label
	>
	<Switch.Root
		{id}
		bind:checked
		{onCheckedChange}
		{disabled}
		class="h-6 cursor-pointer rounded-[6px] focus-visible:outline-2 focus-visible:outline-accent"
		aria-label={label}
	>
		<svg width={36} height={24} aria-hidden="true">
			<rect
				x={2}
				y={4}
				width={32}
				height={16}
				rx={8}
				fill={checked ? 'var(--color-accent)' : 'var(--color-ink-4)'}
			/>
			<circle cx={checked ? 26 : 10} cy={12} r={5} fill="var(--color-surface)" />
		</svg>
	</Switch.Root>
</div>
