<script lang="ts">
	import { Diamond, LinkBreak } from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import { ColorSwatch } from '#lib/components/common/ColorField/ColorSwatch';
	import type { StyleVariable } from '#lib/utils/styleVariables.ts';

	let {
		variable,
		stale,
		onDetach,
		onReapply
	}: {
		variable: StyleVariable;
		stale: boolean;
		onDetach: () => void;
		onReapply?: () => void;
	} = $props();
</script>

<div class="flex h-6 min-w-0 flex-1 items-center justify-end gap-1">
	<div
		class="flex h-6 min-w-0 items-center gap-1.5 rounded-[12px] bg-field pr-2.5 pl-1.5 font-mono text-[11px] text-ink-1"
		title={`スタイル変数「${variable.name}」を参照`}
	>
		{#if variable.type === 'color'}
			<ColorSwatch
				class="size-[11px] shrink-0 rounded-full border border-black/5"
				color={variable.value}
			/>
		{:else}
			<Diamond size={11} weight="regular" class="shrink-0 text-ink-3" aria-hidden="true" />
		{/if}
		<span class="min-w-0 truncate">{variable.name}</span>
		{#if stale}
			<span
				class="size-1.5 shrink-0 rounded-full bg-danger"
				title="プロパティ値が変数と一致していません"
				aria-label="変数参照が同期していません"
			></span>
		{/if}
	</div>
	{#if stale && onReapply}
		<Button
			class="h-6 shrink-0 rounded-[5px] px-1.5 text-[10px] font-semibold text-ink-2 hover:bg-field"
			onclick={onReapply}
		>
			再適用
		</Button>
	{/if}
	<Button
		class="flex size-6 shrink-0 items-center justify-center rounded-[5px] text-ink-3 hover:bg-field hover:text-ink-1"
		aria-label={`スタイル変数 ${variable.name} の参照を解除`}
		title="変数の参照を解除"
		onclick={onDetach}
	>
		<LinkBreak size={12} weight="regular" aria-hidden="true" />
	</Button>
</div>
