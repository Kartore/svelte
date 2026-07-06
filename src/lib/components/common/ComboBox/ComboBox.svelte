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
		allowsCustomValue = false,
		inputValue,
		onInputChange,
		disabled,
		'aria-label': ariaLabel
	}: {
		class?: string;
		label?: string;
		items?: SelectItem[];
		value?: string;
		onValueChange?: (value: string) => void;
		/** 選択肢にないテキストの自由入力を許可する（react-aria の allowsCustomValue 相当） */
		allowsCustomValue?: boolean;
		/** 入力テキストの外部制御値（allowsCustomValue と併用） */
		inputValue?: string;
		/** 入力テキストが変わるたびに発火（allowsCustomValue と併用） */
		onInputChange?: (value: string) => void;
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

	// 入力テキストの外部制御値。inputValue prop を優先し、なければ選択項目のラベル。
	// bits-ui の inputValue は read-only prop（プログラム的な入力欄更新用）で、
	// ユーザー入力・選択時のラベル反映は bits-ui が内部で処理する。
	const comboInputValue = $derived(inputValue ?? selectedLabel);
</script>

<div class={cn('flex items-center justify-between text-sm', className)}>
	{#if label}
		<div class="font-semibold text-gray-600">{label}</div>
	{/if}
	<Combobox.Root
		type="single"
		bind:value
		inputValue={comboInputValue}
		{onValueChange}
		{disabled}
		items={filteredItems}
		allowDeselect={false}
		onOpenChange={(open) => {
			if (!open) searchValue = '';
		}}
	>
		<div
			class="flex w-1/2 cursor-pointer flex-row rounded border-none bg-gray-100 px-2 py-1 text-sm font-semibold transition-colors focus-within:bg-gray-200 hover:bg-gray-200 aria-expanded:bg-gray-200"
		>
			<Combobox.Input
				aria-label={label ?? ariaLabel}
				oninput={(event) => {
					searchValue = event.currentTarget.value;
					if (allowsCustomValue) {
						onInputChange?.(event.currentTarget.value);
					}
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
						<div class="px-2 py-1 text-xs text-gray-400">
							{allowsCustomValue ? 'No matching sprites' : 'No results'}
						</div>
					{/each}
				</Combobox.Viewport>
			</Combobox.Content>
		</Combobox.Portal>
	</Combobox.Root>
</div>
