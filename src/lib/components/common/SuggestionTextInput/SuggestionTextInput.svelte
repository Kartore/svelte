<script lang="ts">
	import { Combobox } from 'bits-ui';
	import type { Attachment } from 'svelte/attachments';

	import { cn } from '#lib/utils/tailwindUtil.ts';
	import {
		isTextFieldCancelKey,
		isTextFieldCommitKey
	} from '#lib/components/common/TextField/textFieldKey.ts';

	let {
		value,
		suggestions,
		onCommit,
		onValueChange,
		onCancel,
		class: className,
		inputClass,
		autoWidth = false,
		placeholder,
		disabled,
		'aria-label': ariaLabel,
		ref = $bindable(null)
	}: {
		value: string;
		suggestions: (string | number | boolean)[];
		onCommit: (text: string) => void;
		onValueChange?: (text: string) => void;
		onCancel?: () => void;
		class?: string;
		inputClass?: string;
		autoWidth?: boolean;
		placeholder?: string;
		disabled?: boolean;
		'aria-label'?: string;
		ref?: HTMLInputElement | null;
	} = $props();

	let draft = $derived(value);
	let searchValue = $state('');
	let open = $state(false);
	let pendingCommit = $state<string>();
	let skipNextCommit = false;

	const items = $derived(
		suggestions.map((suggestion) => ({ value: String(suggestion), label: String(suggestion) }))
	);
	const filteredItems = $derived(
		searchValue === ''
			? items
			: items.filter((item) => item.label.toLowerCase().includes(searchValue.toLowerCase()))
	);
	const setInputRef: Attachment<HTMLElement> = (node) => {
		ref = node.querySelector('input');
		return () => {
			ref = null;
		};
	};
	const commit = (text: string) => {
		pendingCommit = undefined;
		draft = text;
		onCommit(text);
	};
	const showAllSuggestions = () => {
		if (disabled) return;
		searchValue = '';
		open = true;
	};
	const handleOpenChange = (nextOpen: boolean) => {
		open = nextOpen;
		if (nextOpen) return;
		searchValue = '';
		if (pendingCommit !== undefined) commit(pendingCommit);
	};
	const handleValueChange = (nextValue: string) => {
		pendingCommit = undefined;
		commit(nextValue);
		open = false;
	};
	const handleBlur = (event: FocusEvent & { currentTarget: HTMLInputElement }) => {
		if (skipNextCommit) {
			skipNextCommit = false;
			return;
		}
		if (open) pendingCommit = event.currentTarget.value;
		else commit(event.currentTarget.value);
	};
	const handleKeyDown = (event: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
		if (isTextFieldCommitKey(event)) {
			const input = event.currentTarget;
			queueMicrotask(() => {
				if (!event.defaultPrevented) input.blur();
			});
			return;
		}
		if (!isTextFieldCancelKey(event)) return;
		if (open) {
			open = false;
			pendingCommit = undefined;
			return;
		}
		event.preventDefault();
		draft = value;
		onValueChange?.(value);
		skipNextCommit = true;
		event.currentTarget.blur();
		onCancel?.();
	};
</script>

<Combobox.Root
	type="single"
	inputValue={draft}
	items={filteredItems}
	allowDeselect={false}
	{disabled}
	{open}
	onOpenChange={handleOpenChange}
	onValueChange={handleValueChange}
>
	<div
		{@attach setInputRef}
		class={cn('max-w-full min-w-0', autoWidth ? 'inline-flex' : 'flex flex-1', className)}
	>
		<Combobox.Input
			aria-label={ariaLabel}
			{placeholder}
			onfocus={showAllSuggestions}
			onclick={showAllSuggestions}
			oninput={(event) => {
				draft = event.currentTarget.value;
				searchValue = draft;
				onValueChange?.(draft);
				open = true;
			}}
			onblur={handleBlur}
			onkeydown={handleKeyDown}
			class={cn(
				'h-6 max-w-full min-w-0 flex-1 border-none text-ellipsis focus-visible:outline-0',
				inputClass
			)}
			style={autoWidth ? `width: ${Math.max(draft.length, 1) + 2}ch` : undefined}
		/>
	</div>
	<Combobox.Portal>
		<Combobox.Content
			class="z-50 m-0 max-h-40 min-w-32 list-none overflow-auto rounded-[10px] border border-hairline bg-white p-0 text-[11px] shadow-xl shadow-ink-1/15"
			sideOffset={4}
			align="start"
			collisionPadding={8}
		>
			<Combobox.Viewport>
				{#each filteredItems as item (item.value)}
					<Combobox.Item value={item.value} label={item.label}>
						<div class="cursor-pointer px-2 py-1 outline-0 hover:bg-field aria-selected:bg-field">
							{item.label}
						</div>
					</Combobox.Item>
				{:else}
					<div class="px-2 py-1 text-[10px] text-ink-3">候補はありません</div>
				{/each}
			</Combobox.Viewport>
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>
