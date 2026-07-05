<script lang="ts">
	import { cn } from '$lib/utils/tailwindUtil.ts';

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

	let draft = $state('');
	let focused = $state(false);
	$effect(() => {
		if (!focused) {
			draft = String(value);
		}
	});

	const commit = () => {
		if (draft.trim() === '') {
			draft = String(value);
			return;
		}
		const parsed = Number(draft);
		if (Number.isNaN(parsed)) {
			draft = String(value);
			return;
		}
		if (parsed !== value) {
			onValueChange?.(parsed);
		}
	};
</script>

<div
	class={cn(
		'flex flex-row items-center justify-between gap-2 rounded bg-gray-100 px-2 py-0.5',
		className
	)}
>
	<label for={id} class="text-sm font-semibold text-gray-500">{label}</label>
	<div class="w-full">
		<input
			{id}
			type="text"
			inputmode="decimal"
			autocomplete="off"
			bind:value={draft}
			onfocus={() => {
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
			class="w-full rounded border-none px-1 py-0.5 text-sm font-semibold transition-colors hover:bg-gray-200 focus-visible:bg-gray-200 focus-visible:outline-0"
		/>
	</div>
</div>
