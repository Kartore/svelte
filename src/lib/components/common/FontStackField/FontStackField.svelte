<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { tick } from 'svelte';

	import {
		isTextFieldCancelKey,
		isTextFieldCommitKey
	} from '#lib/components/common/TextField/textFieldKey.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label,
		value,
		suggestions = [],
		onCommit,
		disabled,
		'aria-label': ariaLabel
	}: {
		class?: string;
		label?: string;
		value: string;
		suggestions?: string[];
		onCommit: (value: string) => void;
		disabled?: boolean;
		'aria-label'?: string;
	} = $props();

	const id = $props.id();
	let inputElement = $state<HTMLInputElement | null>(null);
	let draft = $derived(value);
	let searchValue = $state('');
	let open = $state(false);
	let pendingCommit = $state<string>();
	let tokenStart = 0;
	let tokenEnd = 0;
	let skipNextCommit = false;

	const items = $derived(
		[...new Set(suggestions.map((suggestion) => suggestion.trim()).filter(Boolean))].map(
			(suggestion) => ({ value: suggestion, label: suggestion })
		)
	);
	const filteredItems = $derived(
		searchValue === ''
			? items
			: items.filter((item) =>
					item.label.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase())
				)
	);

	const tokenBounds = (text: string, cursor: number) => {
		const startOfToken = text.lastIndexOf(',', Math.max(cursor - 1, 0)) + 1;
		const commaAfterCursor = text.indexOf(',', cursor);
		const endOfToken = commaAfterCursor === -1 ? text.length : commaAfterCursor;
		const rawToken = text.slice(startOfToken, endOfToken);
		const leadingWhitespace = rawToken.length - rawToken.trimStart().length;
		return {
			start: startOfToken + leadingWhitespace,
			end: endOfToken,
			query: rawToken.trim()
		};
	};

	const updateTokenSearch = (text: string, cursor: number) => {
		const bounds = tokenBounds(text, cursor);
		tokenStart = bounds.start;
		tokenEnd = bounds.end;
		searchValue = bounds.query;
	};

	const commit = (text: string) => {
		pendingCommit = undefined;
		draft = text;
		onCommit(text);
	};

	const handleOpenChange = (nextOpen: boolean) => {
		open = nextOpen;
		if (nextOpen) return;
		searchValue = '';
		if (pendingCommit !== undefined) commit(pendingCommit);
	};

	const handleValueChange = (nextValue: string) => {
		const nextDraft = `${draft.slice(0, tokenStart)}${nextValue}${draft.slice(tokenEnd)}`;
		pendingCommit = undefined;
		open = false;
		commit(nextDraft);
		void tick().then(() => {
			const nextCursor = tokenStart + nextValue.length;
			inputElement?.focus();
			inputElement?.setSelectionRange(nextCursor, nextCursor);
			updateTokenSearch(nextDraft, nextCursor);
		});
	};

	const showSuggestions = (event: FocusEvent & { currentTarget: HTMLInputElement }) => {
		const cursor = event.currentTarget.selectionStart ?? event.currentTarget.value.length;
		updateTokenSearch(event.currentTarget.value, cursor);
		open = true;
	};

	const handleInput = (event: InputEvent & { currentTarget: HTMLInputElement }) => {
		draft = event.currentTarget.value;
		const cursor = event.currentTarget.selectionStart ?? draft.length;
		updateTokenSearch(draft, cursor);
		open = true;
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
			queueMicrotask(() => {
				if (!event.defaultPrevented) event.currentTarget.blur();
			});
			return;
		}
		if (!isTextFieldCancelKey(event)) return;
		if (open) {
			open = false;
			pendingCommit = undefined;
			draft = value;
			return;
		}
		event.preventDefault();
		draft = value;
		skipNextCommit = true;
		event.currentTarget.blur();
	};
</script>

<div
	class={cn('flex h-[30px] min-w-0 flex-row items-center', className)}
	style="column-gap: var(--field-column-gap, 0px)"
>
	{#if label}
		<label
			for={id}
			class="shrink-0 truncate font-mono text-[10px] font-normal text-ink-2"
			style="width: var(--field-label-width, 84px)"
			title={label}>{label}</label
		>
	{/if}
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
			class="flex h-6 min-w-0 flex-1 rounded-[5px] bg-[var(--expression-control-background,var(--color-field))] focus-within:shadow-[inset_0_0_0_1px_var(--color-accent)]"
		>
			<Combobox.Input
				bind:ref={inputElement}
				{id}
				aria-label={label ?? ariaLabel}
				onfocus={showSuggestions}
				oninput={handleInput}
				onblur={handleBlur}
				onkeydown={handleKeyDown}
				class="h-full w-full min-w-0 flex-1 border-none bg-transparent px-2 font-mono text-[11px] text-ink-1 focus-visible:outline-0"
			/>
		</div>
		<Combobox.Portal>
			<Combobox.Content
				class="z-50 m-0 max-h-40 min-w-48 list-none overflow-auto rounded-[10px] border border-hairline bg-white p-0 text-[11px] shadow-xl shadow-ink-1/15"
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
</div>
