<script lang="ts">
	import type { Attachment } from 'svelte/attachments';

	import { cn } from '#lib/utils/tailwindUtil.ts';

	import { isTextFieldCancelKey, isTextFieldCommitKey } from './textFieldKey.ts';

	let {
		class: className,
		label,
		value = $bindable(''),
		onValueChange,
		onCommit,
		onCancel,
		description,
		placeholder,
		disabled,
		'aria-label': ariaLabel,
		ref = $bindable(null)
	}: {
		class?: string;
		label?: string;
		value?: string;
		onValueChange?: (value: string) => void;
		onCommit?: (value: string) => void;
		onCancel?: () => void;
		description?: string;
		placeholder?: string;
		disabled?: boolean;
		'aria-label'?: string;
		ref?: HTMLInputElement | null;
	} = $props();

	const id = $props.id();
	let skipNextCommit = false;
	const setInputRef: Attachment<HTMLInputElement> = (node) => {
		ref = node;
		return () => {
			if (ref === node) ref = null;
		};
	};

	const handleBlur = () => {
		if (skipNextCommit) {
			skipNextCommit = false;
			return;
		}
		onCommit?.(value);
	};

	const handleKeyDown = (event: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
		if (isTextFieldCommitKey(event)) {
			event.preventDefault();
			event.currentTarget.blur();
			return;
		}
		if (onCancel && isTextFieldCancelKey(event)) {
			event.preventDefault();
			skipNextCommit = true;
			event.currentTarget.blur();
			onCancel();
		}
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
	<input
		{@attach setInputRef}
		{id}
		type="text"
		aria-label={label ? undefined : ariaLabel}
		{placeholder}
		{disabled}
		bind:value
		oninput={() => onValueChange?.(value)}
		onblur={handleBlur}
		onkeydown={handleKeyDown}
		class="h-6 min-w-0 flex-1 rounded-[5px] border-none bg-field px-2 font-mono text-[11px] font-normal text-ink-1 hover:shadow-[inset_0_0_0_1px_var(--color-accent)] focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)] focus-visible:outline-0"
	/>
	{#if description}
		<div class="text-xs">{description}</div>
	{/if}
</div>
