<script lang="ts">
	import {
		ClockCounterClockwise,
		Database,
		GearSix,
		Palette,
		Shapes,
		StackSimple,
		TextAa
	} from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import type { ShellMode } from '#lib/components/shell/shellMode.ts';
	import type { RegisteredEditorRailItem } from '#lib/editor/editorRail.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		activeMode = 'layers',
		historyAvailable = false,
		onLayers,
		onPalette,
		onSources,
		onSprites,
		onFonts,
		onHistory,
		railItems = [],
		onRailItem,
		onSettings
	}: {
		activeMode?: ShellMode;
		historyAvailable?: boolean;
		onLayers?: () => void;
		onPalette?: () => void;
		onSources?: () => void;
		onSprites?: () => void;
		onFonts?: () => void;
		onHistory?: () => void;
		railItems?: RegisteredEditorRailItem[];
		onRailItem?: (item: RegisteredEditorRailItem) => void;
		onSettings?: () => void;
	} = $props();

	const mainRailItems = $derived(railItems.filter((item) => item.placement !== 'bottom'));
	const bottomRailItems = $derived(railItems.filter((item) => item.placement === 'bottom'));

	const buttonClass = (selected = false, disabled = false) =>
		cn(
			'flex size-8 cursor-pointer items-center justify-center rounded-[6px] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-accent)]',
			selected ? 'bg-accent text-white hover:bg-accent' : 'text-ink-2 hover:bg-field',
			disabled && 'cursor-default text-ink-4 hover:bg-transparent'
		);
</script>

<aside
	class="flex w-11 shrink-0 flex-col items-center gap-0.5 border-r border-hairline bg-white py-2"
	aria-label="編集モード"
>
	<Button
		class={buttonClass(activeMode === 'layers')}
		aria-label="レイヤー"
		title="レイヤー (⌘1)"
		onclick={() => onLayers?.()}
	>
		<StackSimple size={18} weight="regular" aria-hidden="true" />
	</Button>
	<Button
		class={buttonClass(activeMode === 'palette', !onPalette)}
		aria-label="パレット"
		title="パレット (⌘2)"
		disabled={!onPalette}
		onclick={() => onPalette?.()}
	>
		<Palette size={18} weight="regular" aria-hidden="true" />
	</Button>
	<Button
		class={buttonClass(activeMode === 'sources')}
		aria-label="ソース"
		title="ソース (⌘3)"
		onclick={() => onSources?.()}
	>
		<Database size={18} weight="regular" aria-hidden="true" />
	</Button>
	<Button
		class={buttonClass(activeMode === 'sprites')}
		aria-label="スプライト"
		title="スプライト (⌘4)"
		onclick={() => onSprites?.()}
	>
		<Shapes size={18} weight="regular" aria-hidden="true" />
	</Button>
	<Button
		class={buttonClass(activeMode === 'fonts')}
		aria-label="フォント"
		title="フォント (⌘5)"
		onclick={() => onFonts?.()}
	>
		<TextAa size={18} weight="regular" aria-hidden="true" />
	</Button>
	{#if historyAvailable}
		<Button
			class={buttonClass(activeMode === 'history', !onHistory)}
			aria-label="履歴"
			title="履歴 (⌘6)"
			disabled={!onHistory}
			onclick={() => onHistory?.()}
		>
			<ClockCounterClockwise size={18} weight="regular" aria-hidden="true" />
		</Button>
	{/if}
	{#each mainRailItems as item (`${item.moduleId}:${item.id}`)}
		{@const Icon = item.icon}
		<Button
			class={buttonClass(activeMode === item.mode)}
			aria-label={item.label}
			title={item.label}
			onclick={() => onRailItem?.(item)}
		>
			<Icon size={18} weight="regular" aria-hidden="true" />
		</Button>
	{/each}
	<div class="mt-auto flex flex-col gap-0.5">
		{#each bottomRailItems as item (`${item.moduleId}:${item.id}`)}
			{@const Icon = item.icon}
			<Button
				class={buttonClass(activeMode === item.mode)}
				aria-label={item.label}
				title={item.label}
				onclick={() => onRailItem?.(item)}
			>
				<Icon size={18} weight="regular" aria-hidden="true" />
			</Button>
		{/each}
		<Button
			class={buttonClass(activeMode === 'settings')}
			aria-label="スタイル設定"
			title="スタイル設定"
			onclick={() => onSettings?.()}
		>
			<GearSix size={18} weight="regular" aria-hidden="true" />
		</Button>
	</div>
</aside>
