<script lang="ts" module>
	export type SelectItem = { value: string; label: string; disabled?: boolean };
	export type SelectSection = { title: string; items: SelectItem[] };
</script>

<script lang="ts">
	import { Select } from 'bits-ui';

	import { ArrowDropDownIcon, CheckIcon } from '$lib/components/icons';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		triggerClass,
		label,
		items = [],
		sections,
		value = $bindable(),
		onValueChange,
		disabled,
		'aria-label': ariaLabel
	}: {
		class?: string;
		triggerClass?: string;
		label?: string;
		items?: SelectItem[];
		sections?: SelectSection[];
		value?: string;
		onValueChange?: (value: string) => void;
		disabled?: boolean;
		'aria-label'?: string;
	} = $props();

	const allItems = $derived(sections ? sections.flatMap((section) => section.items) : items);
	const selectedLabel = $derived(allItems.find((item) => item.value === value)?.label ?? '');
</script>

{#snippet option(item: SelectItem)}
	<Select.Item value={item.value} label={item.label} disabled={item.disabled}>
		{#snippet children({ selected })}
			<div
				class="flex cursor-pointer items-center gap-2 bg-transparent py-1 pr-3 pl-1 outline-0 hover:bg-gray-100 aria-selected:bg-gray-200"
				aria-selected={selected}
			>
				{#if selected}
					<CheckIcon class="w-4" />
				{:else}
					<div class="w-4"></div>
				{/if}
				{item.label}
			</div>
		{/snippet}
	</Select.Item>
{/snippet}

<div class={cn('flex items-center justify-between text-sm', className)}>
	{#if label}
		<div class="font-semibold text-gray-600">{label}</div>
	{/if}
	<Select.Root type="single" bind:value {onValueChange} {disabled} items={allItems}>
		<Select.Trigger
			aria-label={label ?? ariaLabel}
			class={cn(
				'flex w-1/2 cursor-pointer flex-row items-center justify-between rounded border-none bg-gray-100 px-2 py-1 text-sm font-semibold transition-colors hover:bg-gray-200 focus-visible:bg-gray-200 focus-visible:outline-0 aria-expanded:bg-gray-200',
				triggerClass
			)}
		>
			<p class="flex-1 overflow-hidden text-start text-ellipsis whitespace-nowrap">
				{selectedLabel}
			</p>
			<ArrowDropDownIcon aria-hidden="true" class="w-4" />
		</Select.Trigger>
		<Select.Portal>
			<Select.Content
				class="z-50 m-0 max-h-40 min-w-32 list-none overflow-auto rounded border border-gray-500 bg-white p-0"
				sideOffset={4}
				align="start"
			>
				<Select.Viewport>
					{#if sections}
						{#each sections as section (section.title)}
							<Select.Group>
								<Select.GroupHeading
									class="block px-2 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase"
								>
									{section.title}
								</Select.GroupHeading>
								{#each section.items as item (item.value)}
									{@render option(item)}
								{/each}
							</Select.Group>
						{/each}
					{:else}
						{#each items as item (item.value)}
							{@render option(item)}
						{/each}
					{/if}
				</Select.Viewport>
			</Select.Content>
		</Select.Portal>
	</Select.Root>
</div>
