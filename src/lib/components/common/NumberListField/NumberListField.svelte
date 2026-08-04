<script lang="ts">
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label,
		values,
		onChange,
		minLength,
		maxLength,
		'aria-label': ariaLabel
	}: {
		class?: string;
		label?: string;
		values?: number[];
		onChange?: (values: number[] | undefined) => void;
		minLength?: number;
		maxLength?: number;
		'aria-label'?: string;
	} = $props();

	const id = $props.id();
	const format = (list: number[] | undefined) => list?.join(', ') ?? '';

	let draft = $state('');
	let focused = $state(false);
	const getDraft = () => (focused ? draft : format(values));
	const setDraft = (value: string) => {
		draft = value;
	};

	const isValidLength = (list: number[]) => {
		if (minLength !== undefined && list.length < minLength) return false;
		if (maxLength !== undefined && list.length > maxLength) return false;
		return true;
	};

	const parse = (input: string): number[] | undefined | null => {
		if (input.trim() === '') return undefined;
		const parts = input.split(',').map((value) => value.trim());
		if (parts.some((value) => value === '')) return null;
		const list = parts.map((value) => Number(value));
		if (list.some((value) => !Number.isFinite(value))) return null;
		if (!isValidLength(list)) return null;
		return list;
	};

	const commit = () => {
		const next = parse(draft);
		if (next === null) {
			draft = format(values);
			return;
		}
		draft = format(next);
		if (JSON.stringify(next) !== JSON.stringify(values)) {
			onChange?.(next);
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
		{id}
		aria-label={label ? undefined : ariaLabel}
		type="text"
		inputmode="decimal"
		autocomplete="off"
		bind:value={getDraft, setDraft}
		onfocus={() => {
			draft = format(values);
			focused = true;
		}}
		onblur={() => {
			focused = false;
			commit();
		}}
		onkeydown={(event) => {
			if (event.key === 'Enter') {
				event.currentTarget.blur();
			}
		}}
		class="h-6 min-w-0 flex-1 rounded-[5px] border-none bg-field px-2 font-mono text-[11px] font-normal text-ink-1 hover:shadow-[inset_0_0_0_1px_var(--color-accent)] focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)] focus-visible:outline-0"
	/>
</div>
