<script lang="ts">
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label,
		values,
		onChange,
		minLength,
		maxLength
	}: {
		class?: string;
		label: string;
		values?: number[];
		onChange?: (values: number[] | undefined) => void;
		minLength?: number;
		maxLength?: number;
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

<div class={cn('flex flex-row items-center justify-between', className)}>
	<label for={id} class="text-sm font-semibold text-gray-600">{label}</label>
	<input
		{id}
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
		class="w-1/2 rounded border-none bg-gray-100 px-2 py-1 text-sm font-semibold transition-colors hover:bg-gray-200 focus-visible:bg-gray-200 focus-visible:outline-0"
	/>
</div>
