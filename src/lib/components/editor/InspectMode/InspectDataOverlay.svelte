<script lang="ts">
	import { Eye, EyeSlash } from 'phosphor-svelte';

	import { cn } from '#lib/utils/tailwindUtil.ts';

	import type { InspectLegendEntry, InspectView } from './inspectUtils.ts';

	let {
		view,
		legend,
		hiddenKeys,
		onViewChange,
		onLegendToggle
	}: {
		view: InspectView;
		legend: InspectLegendEntry[];
		hiddenKeys: ReadonlySet<string>;
		onViewChange: (view: InspectView) => void;
		onLegendToggle: (key: string) => void;
	} = $props();
</script>

<div
	class="pointer-events-auto absolute top-3 right-12 z-20 flex rounded-[6px] bg-white p-0.5 shadow-[0_1px_4px_rgba(0,0,0,0.16)]"
	role="group"
	aria-label="検査表示"
>
	{#each [{ value: 'style' as const, label: 'スタイル' }, { value: 'data' as const, label: 'データ' }] as item (item.value)}
		<button
			type="button"
			class={cn(
				'h-6 rounded-[4px] px-2 text-[10px] text-ink-2 focus-visible:outline-2 focus-visible:outline-accent',
				view === item.value && 'bg-field font-semibold text-ink-1'
			)}
			aria-pressed={view === item.value}
			onclick={() => onViewChange(item.value)}
		>
			{item.label}
		</button>
	{/each}
</div>

{#if view === 'data'}
	<aside
		aria-label="データビュー凡例"
		class="pointer-events-auto absolute top-12 left-3 z-20 flex max-h-[calc(100%-96px)] w-[208px] flex-col overflow-hidden rounded-[6px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.16)]"
	>
		<header class="flex h-8 shrink-0 items-center border-b border-hairline-soft px-2.5">
			<h2 class="text-[11px] font-semibold text-ink-1">source-layer</h2>
			<span class="ml-auto font-mono text-[9.5px] text-ink-3">{legend.length}</span>
		</header>
		<div class="min-h-0 flex-1 overflow-y-auto p-1">
			{#if legend.length === 0}
				<p class="px-2 py-3 text-[10px] text-ink-3">検査できる vector data はありません。</p>
			{:else}
				{#each legend as entry (entry.key)}
					<button
						type="button"
						class="flex h-8 w-full min-w-0 items-center gap-2 rounded-[5px] px-1.5 text-left hover:bg-field focus-visible:outline-2 focus-visible:outline-accent"
						aria-pressed={!hiddenKeys.has(entry.key)}
						title={`${entry.sourceId} / ${entry.label}`}
						onclick={() => onLegendToggle(entry.key)}
					>
						<span
							class="size-3 shrink-0 rounded-[4px] border border-hairline"
							style:background={entry.color}
							aria-hidden="true"
						></span>
						<span class="min-w-0 flex-1">
							<span class="block truncate font-mono text-[10px] text-ink-1">{entry.label}</span>
							<span class="block truncate font-mono text-[8.5px] text-ink-3">{entry.sourceId}</span>
						</span>
						{#if hiddenKeys.has(entry.key)}
							<EyeSlash size={13} weight="regular" class="shrink-0 text-ink-3" aria-hidden="true" />
						{:else}
							<Eye size={13} weight="regular" class="shrink-0 text-ink-2" aria-hidden="true" />
						{/if}
					</button>
				{/each}
			{/if}
		</div>
	</aside>
{/if}
