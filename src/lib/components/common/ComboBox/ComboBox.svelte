<script lang="ts">
	import { Combobox } from 'bits-ui';

	import type { SelectItem } from '$lib/components/common/Select';
	import { ArrowDropDownIcon, CheckIcon } from '$lib/components/icons';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		triggerClass,
		label,
		items = [],
		value = $bindable(),
		onValueChange,
		allowsCustomValue = false,
		inputValue,
		onInputChange,
		onCommit,
		disabled,
		'aria-label': ariaLabel
	}: {
		class?: string;
		triggerClass?: string;
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
		/** 自由入力テキストを blur / Enter で確定する */
		onCommit?: (value: string) => void;
		disabled?: boolean;
		'aria-label'?: string;
	} = $props();

	let searchValue = $state('');
	let isOpen = $state(false);
	let pendingCommit = $state<string>();

	const filteredItems = $derived(
		searchValue === ''
			? items
			: items.filter((item) => item.label.toLowerCase().includes(searchValue.toLowerCase()))
	);
	const selectedLabel = $derived(items.find((item) => item.value === value)?.label ?? '');
	const selectedItem = $derived(items.find((item) => item.value === value));

	// 入力テキストの外部制御値。inputValue prop を優先し、なければ選択項目のラベル。
	// bits-ui の inputValue は read-only prop（プログラム的な入力欄更新用）で、
	// ユーザー入力・選択時のラベル反映は bits-ui が内部で処理する。
	const comboInputValue = $derived(inputValue ?? selectedLabel);
	const commitInput = (value: string) => {
		pendingCommit = undefined;
		onCommit?.(value);
	};
	const handleOpenChange = (open: boolean) => {
		isOpen = open;
		if (open) return;
		searchValue = '';
		if (pendingCommit !== undefined) commitInput(pendingCommit);
	};
	const handleValueChange = (next: string) => {
		pendingCommit = undefined;
		onValueChange?.(next);
	};

	// 外枠 (h-5 w-5 = 20px) から border 1px ×2 を引いた内容領域に収める。
	// これを超えると flex に押し潰されてスプライトの端が欠ける。
	const PREVIEW_BOX_SIZE = 18;
	const previewScale = (item: SelectItem): number => {
		if (!item.preview) return 1;
		const ratio = item.preview.pixelRatio ?? 1;
		const width = item.preview.width / ratio;
		const height = item.preview.height / ratio;
		return Math.min(2, PREVIEW_BOX_SIZE / Math.max(width, height, 1));
	};
	const previewCropStyle = (item: SelectItem): string => {
		if (!item.preview) return '';
		const ratio = item.preview.pixelRatio ?? 1;
		const scale = previewScale(item);
		return `width: ${Math.max(1, (item.preview.width / ratio) * scale)}px; height: ${Math.max(1, (item.preview.height / ratio) * scale)}px;`;
	};
	const previewImageStyle = (item: SelectItem): string => {
		if (!item.preview) return '';
		const ratio = item.preview.pixelRatio ?? 1;
		const scale = previewScale(item);
		return `left: ${-(item.preview.x / ratio) * scale}px; top: ${-(item.preview.y / ratio) * scale}px; transform: scale(${scale / ratio});`;
	};
</script>

{#snippet preview(item: SelectItem)}
	<span
		class="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-gray-200 bg-white"
		aria-hidden="true"
	>
		{#if item.preview}
			<span class="relative block shrink-0 overflow-hidden" style={previewCropStyle(item)}>
				<img
					src={item.preview.src}
					alt=""
					class="absolute max-w-none origin-top-left"
					style={previewImageStyle(item)}
				/>
			</span>
		{/if}
	</span>
{/snippet}

<div class={cn('flex items-center justify-between text-sm', className)}>
	{#if label}
		<div class="font-semibold text-gray-600">{label}</div>
	{/if}
	<Combobox.Root
		type="single"
		bind:value
		inputValue={comboInputValue}
		onValueChange={handleValueChange}
		{disabled}
		items={filteredItems}
		allowDeselect={false}
		onOpenChange={handleOpenChange}
	>
		<div
			class={cn(
				'flex w-1/2 cursor-pointer flex-row items-center gap-1 rounded border-none bg-gray-100 px-2 py-1 text-sm font-semibold transition-colors focus-within:bg-gray-200 hover:bg-gray-200 aria-expanded:bg-gray-200',
				triggerClass
			)}
		>
			{#if selectedItem?.preview}
				{@render preview(selectedItem)}
			{/if}
			<Combobox.Input
				aria-label={label ?? ariaLabel}
				oninput={(event) => {
					searchValue = event.currentTarget.value;
					if (allowsCustomValue) {
						onInputChange?.(event.currentTarget.value);
					}
				}}
				onblur={(event) => {
					if (!allowsCustomValue || !onCommit) return;
					if (isOpen) pendingCommit = event.currentTarget.value;
					else commitInput(event.currentTarget.value);
				}}
				onkeydown={(event) => {
					if (event.key === 'Enter' && allowsCustomValue && onCommit) {
						event.currentTarget.blur();
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
				collisionPadding={8}
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
									{#if item.preview}
										{@render preview(item)}
									{/if}
									<span class="min-w-0 truncate">{item.label}</span>
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
