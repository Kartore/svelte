<script lang="ts">
	import { Combobox } from 'bits-ui';

	import type { SelectItem } from '$lib/components/common/Select';
	import { ArrowDropDownIcon, CheckIcon } from '$lib/components/icons';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label,
		items = [],
		value = $bindable(),
		onValueChange,
		disabled,
		'aria-label': ariaLabel
	}: {
		class?: string;
		label?: string;
		items?: SelectItem[];
		value?: string;
		onValueChange?: (value: string) => void;
		disabled?: boolean;
		'aria-label'?: string;
	} = $props();

	let searchValue = $state('');

	const filteredItems = $derived(
		searchValue === ''
			? items
			: items.filter((item) => item.label.toLowerCase().includes(searchValue.toLowerCase()))
	);
	const selectedLabel = $derived(items.find((item) => item.value === value)?.label ?? '');
</script>

<div class={cn('flex items-center justify-between text-sm', className)}>
	{#if label}
		<div class="font-semibold text-gray-600">{label}</div>
	{/if}
	<Combobox.Root
		type="single"
		bind:value
		{onValueChange}
		{disabled}
		items={filteredItems}
		onOpenChange={(open) => {
			if (!open) searchValue = '';
		}}
	>
		<div
			class="flex w-1/2 cursor-pointer flex-row rounded border-none bg-gray-100 px-2 py-1 text-sm font-semibold transition-colors hover:bg-gray-200 focus-within:bg-gray-200 aria-expanded:bg-gray-200"
		>
			<Combobox.Input
				aria-label={label ?? ariaLabel}
				defaultValue={selectedLabel}
				oninput={(event) => {
					searchValue = event.currentTarget.value;
				}}
				class="w-full flex-1 border-none focus-visible:outline-0"
			/>
			<Combobox.Trigger class="cursor-pointer">
				<ArrowDropDownIcon aria-hidden="true" class="w-4" />
			</Combobox.Trigger>
		</div>
		<Combobox.Portal>
			<Combobox.Content
				class="z-50 m-0 max-h-40 min-w-32 list-none overflow-auto rounded border border-gray-500 bg-white p-0"
				sideOffset={4}
				align="start"
			>
				<Combobox.Viewport>
					{#each filteredItems as item (item.value)}
						<Combobox.Item value={item.value} label={item.label} disabled={item.disabled}>
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
						</Combobox.Item>
					{:else}
						<div class="px-2 py-1 text-xs text-gray-400">No results</div>
					{/each}
				</Combobox.Viewport>
			</Combobox.Content>
		</Combobox.Portal>
	</Combobox.Root>
</div>
