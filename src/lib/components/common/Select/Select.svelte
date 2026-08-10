<script lang="ts" module>
	export type SelectItemPreview = {
		src: string;
		x: number;
		y: number;
		width: number;
		height: number;
		pixelRatio?: number;
	};
	export type SelectItem = {
		value: string;
		label: string;
		disabled?: boolean;
		preview?: SelectItemPreview;
	};
	export type SelectSection = { title: string; items: SelectItem[] };
</script>

<script lang="ts">
	import { Select } from 'bits-ui';

	import { ArrowDropDownIcon, CheckIcon } from '#lib/components/icons';
	import { cn } from '#lib/utils/tailwindUtil.ts';

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
				class="flex cursor-pointer items-center gap-2 bg-transparent py-1 pr-3 pl-1 outline-0 hover:bg-field aria-selected:bg-field"
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

<div
	class={cn('flex h-[30px] min-w-0 items-center', className)}
	style="column-gap: var(--field-column-gap, 0px)"
>
	{#if label}
		<div
			class="shrink-0 truncate font-mono text-[10px] font-normal text-ink-2"
			style="width: var(--field-label-width, 84px)"
			title={label}
		>
			{label}
		</div>
	{/if}
	<Select.Root type="single" bind:value {onValueChange} {disabled} items={allItems}>
		<Select.Trigger
			aria-label={label ?? ariaLabel}
			class={cn(
				'flex h-6 min-w-0 flex-1 cursor-pointer flex-row items-center justify-between rounded-[5px] border-none bg-[var(--expression-control-background,var(--color-field))] px-2 font-mono text-[11px] font-normal text-ink-1 hover:shadow-[inset_0_0_0_1px_var(--color-accent)] focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)] focus-visible:outline-0 aria-expanded:shadow-[inset_0_0_0_1px_var(--color-accent)]',
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
				class="z-50 m-0 max-h-40 min-w-32 list-none overflow-auto rounded-[10px] border border-hairline bg-white p-0 font-mono text-[11px] shadow-xl shadow-ink-1/15"
				sideOffset={4}
				align="start"
			>
				<Select.Viewport>
					{#if sections}
						{#each sections as section (section.title)}
							<Select.Group>
								<Select.GroupHeading
									class="block px-2 pt-2 pb-1 text-[10px] font-semibold text-ink-3"
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
