<script lang="ts">
	import { createExpression } from '@maplibre/maplibre-gl-style-spec';
	import { X } from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import { TextField } from '#lib/components/common/TextField';

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
			error = `JSON が不正です: ${caught instanceof Error ? caught.message : String(caught)}`;
			return;
		}
		if (!Array.isArray(expression)) {
			error = '式は JSON 配列で指定してください。';
			return;
		}

		const result = createExpression(expression, 'filter');
		if (result.result === 'error') {
			error = result.value.map(({ message }) => message).join(' ');
			return;
		}

		error = undefined;
		onChange({ kind: 'raw', expression });
	};
</script>

<div class="flex flex-col gap-0.5">
	<div class="grid grid-cols-[minmax(0,1fr)_68px_minmax(0,1fr)_20px] items-start gap-1">
		<div class="pt-1">
			<span class="rounded bg-field px-1.5 py-0.5 font-mono text-xs text-ink-2">式</span>
		</div>
		<div class="col-span-2 min-w-0">
			<TextField
				aria-label="フィルター式"
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
			aria-label="フィルター式を削除"
			class="mt-0.5 flex size-5 items-center justify-center rounded-[5px] text-ink-3 hover:bg-field hover:text-ink-1"
			onclick={onRemove}
		>
			<X size={13} weight="regular" aria-hidden="true" />
		</Button>
	</div>
	{#if error}
		<p class="pl-[calc(25%+24px)] text-xs text-ink-2">{error}</p>
	{/if}
</div>
