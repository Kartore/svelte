<script lang="ts">
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label,
		value,
		onValueChange
	}: {
		class?: string;
		label: string;
		value: number;
		onValueChange?: (value: number) => void;
	} = $props();

	const id = $props.id();

	let editDraft = $state<string | null>(null);
	const draft = $derived(editDraft ?? String(value));

	const commit = () => {
		if (draft.trim() === '') {
			editDraft = String(value);
			return;
		}
		const parsed = Number(draft);
		if (Number.isNaN(parsed)) {
			editDraft = String(value);
			return;
		}
		if (parsed !== value) {
			onValueChange?.(parsed);
		}
	};
</script>

<div
	class={cn(
		'flex h-6 min-w-0 flex-1 flex-row items-center justify-between gap-1 rounded-[5px] bg-field px-2',
		className
	)}
>
	<label for={id} class="shrink-0 font-mono text-[10px] font-normal text-ink-3">{label}</label>
	<div class="min-w-0 flex-1">
		<input
			{id}
			type="text"
			inputmode="decimal"
			autocomplete="off"
			value={draft}
			oninput={(event) => {
				editDraft = event.currentTarget.value;
			}}
			onfocus={() => {
				editDraft = draft;
			}}
			onblur={() => {
				commit();
				editDraft = null;
			}}
			onkeydown={(event) => {
				if (event.key === 'Enter') {
					event.currentTarget.blur();
				}
			}}
			class="h-6 w-full min-w-0 border-none bg-transparent px-1 font-mono text-[11px] font-normal text-ink-1 focus-visible:outline-0"
		/>
	</div>
</div>
