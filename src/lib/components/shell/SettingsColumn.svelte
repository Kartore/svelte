<script lang="ts">
	import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
	import { X } from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import { TextField } from '#lib/components/common/TextField';
	import { StylePropertiesPanel } from '#lib/components/editor/StylePropertiesPanel';
	import type { RootPropertyKind } from '#lib/utils/layerSpec.ts';
	import type { StyleSettingChange } from '#lib/utils/styleRoot.ts';

	let {
		mapStyle,
		styleErrors,
		onChangeStyleSetting,
		onChangeRoot,
		onSetRootObject,
		onOpenStyleJson,
		onUseCurrentView,
		onOpenPalette
	}: {
		mapStyle: StyleSpecification;
		styleErrors: string[];
		onChangeStyleSetting?: StyleSettingChange;
		onChangeRoot?: (kind: RootPropertyKind, key: string, value: unknown) => void;
		onSetRootObject?: (kind: RootPropertyKind, value: object | undefined) => void;
		onOpenStyleJson?: () => void;
		onUseCurrentView?: () => void;
		onOpenPalette?: () => void;
	} = $props();

	let search = $state('');
</script>

<aside class="flex w-60 shrink-0 flex-col border-r border-hairline bg-white">
	<header class="flex h-10 shrink-0 items-center gap-2 px-3">
		<h2 class="text-[12px] font-semibold text-ink-1">スタイル設定</h2>
	</header>

	<div class="shrink-0 px-3 pb-1.5">
		<div class="relative">
			<TextField
				class="w-full [&>input]:h-[26px] [&>input]:w-full [&>input]:rounded-[6px] [&>input]:pr-7 [&>input]:text-[11px] [&>input]:font-normal"
				aria-label="スタイル設定を検索"
				placeholder="検索"
				value={search}
				onValueChange={(value) => (search = value)}
			/>
			{#if search}
				<Button
					class="absolute top-0 right-0 flex size-6 items-center justify-center text-ink-3 hover:text-ink-1"
					aria-label="設定検索をクリア"
					onclick={() => (search = '')}
				>
					<X size={14} weight="regular" aria-hidden="true" />
				</Button>
			{/if}
		</div>
	</div>

	<StylePropertiesPanel
		class="min-h-0 flex-1 text-[11px] [&_h3]:text-[11px]"
		{mapStyle}
		{styleErrors}
		{search}
		managedSprite
		{onChangeStyleSetting}
		{onChangeRoot}
		{onSetRootObject}
		{onOpenStyleJson}
		{onUseCurrentView}
		onOpenVariables={onOpenPalette}
	/>

	<footer
		class="flex h-8 shrink-0 items-center justify-between border-t border-hairline-soft px-3 font-mono text-[10px] text-ink-3"
	>
		<span>{mapStyle.name ?? '名称未設定'}</span>
		<span>設定</span>
	</footer>
</aside>
