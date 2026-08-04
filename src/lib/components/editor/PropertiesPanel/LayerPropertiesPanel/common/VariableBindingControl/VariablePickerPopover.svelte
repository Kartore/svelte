<script lang="ts">
	import { Diamond, Plus } from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import { ColorSwatch } from '#lib/components/common/ColorField/ColorSwatch';
	import { RowPopover } from '#lib/components/common/RowPopover';
	import { useStyleVariables } from '#lib/contexts/styleVariables.svelte.ts';
	import type { StyleVariableType } from '#lib/utils/styleVariables.ts';

	let {
		type,
		currentValue,
		onPick,
		onCreateFromValue
	}: {
		type: StyleVariableType;
		currentValue: unknown;
		onPick: (variableId: string) => void;
		onCreateFromValue?: () => void;
	} = $props();

	const context = useStyleVariables();
	const matchingVariables = $derived(
		(context?.variables ?? []).filter((variable) => variable.type === type)
	);
	const pick = (variableId: string) => {
		onPick(variableId);
	};

	const createFromValue = () => {
		onCreateFromValue?.();
	};

	const formatValue = (value: unknown): string => {
		if (value === undefined) return '(未設定)';
		const serialized = JSON.stringify(value);
		return serialized === undefined ? String(value) : serialized;
	};
	const typeLabel = $derived(type === 'color' ? 'カラー' : type === 'number' ? '数値' : '補間');
</script>

<RowPopover
	aria-label={`${typeLabel}のスタイル変数を参照`}
	triggerClass="flex size-6 items-center justify-center rounded-[6px] text-ink-3 hover:bg-field hover:text-accent focus-visible:outline-2 focus-visible:outline-accent aria-expanded:bg-accent-soft aria-expanded:text-accent"
>
	{#snippet trigger()}
		<Diamond size={14} weight="regular" aria-hidden="true" />
	{/snippet}

	{#snippet children({ close })}
		<div class="border-b border-hairline-soft px-3 py-2">
			<p class="text-[11px] font-semibold text-ink-1">スタイル変数</p>
			<p class="mt-0.5 text-[10px] text-ink-3">{typeLabel}</p>
		</div>

		<div class="max-h-56 overflow-y-auto p-1">
			{#if matchingVariables.length === 0}
				<p class="px-2 py-4 text-center text-[11px] text-ink-3">
					{typeLabel}変数はありません。
				</p>
			{:else}
				{#each matchingVariables as variable (variable.id)}
					<Button
						class="flex h-7 w-full items-center gap-2 rounded-[6px] px-2 text-left hover:bg-field"
						onclick={() => {
							pick(variable.id);
							close();
						}}
					>
						{#if variable.type === 'color'}
							<ColorSwatch
								class="size-4 shrink-0 rounded-[5px] border border-hairline-soft"
								color={variable.value}
							/>
						{:else}
							<span
								class="max-w-20 shrink-0 truncate rounded-[5px] bg-field px-1 py-0.5 font-mono text-[9px] text-ink-3"
								title={formatValue(variable.value)}
							>
								{formatValue(variable.value)}
							</span>
						{/if}
						<span
							class="min-w-0 flex-1 truncate font-mono text-[11px] font-normal text-ink-1"
							title={variable.name}
						>
							{variable.name}
						</span>
					</Button>
				{/each}
			{/if}
		</div>

		{#if onCreateFromValue}
			<div class="border-t border-hairline-soft p-1">
				<Button
					class="flex h-7 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[11px] font-semibold text-accent hover:bg-accent-soft"
					onclick={() => {
						createFromValue();
						close();
					}}
				>
					<Plus size={14} weight="regular" class="shrink-0" aria-hidden="true" />
					<span class="min-w-0 flex-1 truncate">現在の値から作成</span>
					<span
						class="max-w-20 truncate font-mono text-[9px] text-ink-3"
						title={formatValue(currentValue)}
					>
						{formatValue(currentValue)}
					</span>
				</Button>
			</div>
		{/if}
	{/snippet}
</RowPopover>
