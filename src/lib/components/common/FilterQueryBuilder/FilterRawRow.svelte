<script lang="ts">
	import { createExpression } from '@maplibre/maplibre-gl-style-spec';

	import { Button } from '$lib/components/common/Button';
	import { TextField } from '$lib/components/common/TextField';
	import { CloseIcon } from '$lib/components/icons';

	import type { FilterRawNode } from './model.ts';

	let {
		node,
		onChange,
		onRemove
	}: {
		node: FilterRawNode;
		onChange: (node: FilterRawNode) => void;
		onRemove?: () => void;
	} = $props();

	let draft = $derived(JSON.stringify(node.expression));
	let error = $state<string>();

	const commit = (value: string) => {
		if (value === JSON.stringify(node.expression)) {
			error = undefined;
			return;
		}
		let expression: unknown;
		try {
			expression = JSON.parse(value);
		} catch (caught) {
			error = `Invalid JSON: ${caught instanceof Error ? caught.message : String(caught)}`;
			return;
		}
		if (!Array.isArray(expression)) {
			error = 'Expression must be a JSON array.';
			return;
		}

		const result = createExpression(expression);
		if (result.result === 'error') {
			error = result.value.map(({ message }) => message).join(' ');
			return;
		}

		error = undefined;
		onChange({ kind: 'raw', expression });
	};
</script>

<div class="flex flex-col gap-0.5">
	<div class="grid grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)_20px] items-start gap-1">
		<div class="pt-1">
			<span class="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-600">式</span>
		</div>
		<div class="col-span-2 min-w-0">
			<TextField
				aria-label="Raw filter expression"
				class="min-w-0 font-mono [&>input]:w-full [&>input]:font-normal"
				value={draft}
				onValueChange={(value) => {
					draft = value;
					error = undefined;
				}}
				onCommit={commit}
			/>
		</div>
		<Button
			aria-label="Remove raw filter expression"
			class="mt-1 rounded text-gray-400 hover:text-red-500"
			onclick={onRemove}
		>
			<CloseIcon class="h-4 w-4 fill-current" />
		</Button>
	</div>
	{#if error}
		<p class="pl-[calc(25%+24px)] text-xs text-red-500">{error}</p>
	{/if}
</div>
