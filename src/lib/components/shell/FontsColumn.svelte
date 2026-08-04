<script lang="ts">
	import type { FontInfo } from '@kartore/glyphore';
	import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
	import { ArrowDown, Plus, Trash, X } from 'phosphor-svelte';
	import { onMount, tick } from 'svelte';

	import { Button } from '#lib/components/common/Button';
	import { TextField } from '#lib/components/common/TextField';
	import { buildGlyphArchive, type GlyphDownloadProgress } from '#lib/fonts/glyphDownload.ts';
	import { loadGlyphore } from '#lib/fonts/glyphore.ts';
	import type { FontMeta, LoadedFont, StoredFont } from '#lib/stores/fonts';
	import { fontUsageLayerIds, referencedFontStacks } from '#lib/utils/assetUsage.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		mapStyle,
		fonts,
		readOnly = false,
		onAddFont,
		onRemoveFont,
		getLoadedFont,
		getStoredFonts,
		onSelectLayer
	}: {
		mapStyle: StyleSpecification;
		fonts: Record<string, FontMeta>;
		readOnly?: boolean;
		onAddFont: (bytes: ArrayBuffer | Uint8Array) => Promise<FontInfo>;
		onRemoveFont: (name: string) => Promise<void>;
		getLoadedFont: (name: string) => Promise<LoadedFont | null>;
		getStoredFonts: () => Promise<Record<string, StoredFont>>;
		onSelectLayer?: (layerId: string) => void;
	} = $props();

	let search = $state('');
	let selectedFontstack = $state<string>();
	let fontInfos = $state<Record<string, FontInfo | undefined>>({});
	let fontSizes = $state<Record<string, number | undefined>>({});
	let validationErrors = $state<Record<string, string | undefined>>({});
	let isValidating = $state(false);
	let isUploading = $state(false);
	let deletingFontstack = $state<string>();
	let downloadingFontstack = $state<string>();
	let downloadProgress = $state<GlyphDownloadProgress>();
	let operationError = $state<string>();
	let validationGeneration = 0;

	const referencedFonts = $derived(
		referencedFontStacks(mapStyle).sort((a, b) => a.localeCompare(b))
	);
	const fontstacks = $derived(
		[...new Set([...Object.keys(fonts), ...referencedFonts])]
			.filter((name) => name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
			.sort((a, b) => a.localeCompare(b))
	);
	const selectedMeta = $derived(selectedFontstack ? fonts[selectedFontstack] : undefined);
	const selectedInfo = $derived(selectedFontstack ? fontInfos[selectedFontstack] : undefined);
	const selectedUsages = $derived(
		selectedFontstack ? fontUsageLayerIds(mapStyle, selectedFontstack) : []
	);
	const isBusy = $derived(
		isValidating ||
			isUploading ||
			deletingFontstack !== undefined ||
			downloadingFontstack !== undefined
	);

	const errorMessage = (error: unknown): string =>
		error instanceof Error ? error.message : String(error);
	const unresolved = (fontstack: string): boolean => !(fontstack in fonts) && !mapStyle.glyphs;
	const fallbackLabel = (fontstack: string): string | undefined => {
		if (fontstack in fonts) return undefined;
		return mapStyle.glyphs ? 'glyphs URL から取得' : 'sans-serif へフォールバック';
	};
	const formatBytes = (bytes: number | undefined): string => {
		if (bytes === undefined) return '—';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	};
	const validateFonts = async (fontNames: string[]) => {
		const generation = ++validationGeneration;
		if (fontNames.length === 0) {
			fontInfos = {};
			fontSizes = {};
			validationErrors = {};
			isValidating = false;
			return;
		}
		isValidating = true;
		const nextInfos: Record<string, FontInfo | undefined> = {};
		const nextErrors: Record<string, string | undefined> = {};
		const nextSizes: Record<string, number | undefined> = {};
		try {
			const stored = await getStoredFonts();
			for (const [name, font] of Object.entries(stored)) {
				nextSizes[name] = font.bytes.byteLength;
			}
		} catch (error) {
			operationError = `フォント容量を取得できません: ${errorMessage(error)}`;
		}
		for (const fontstack of fontNames) {
			try {
				const font = await getLoadedFont(fontstack);
				if (!font) throw new Error('保存フォントを読み込めません。');
				nextInfos[fontstack] = font.info;
			} catch (error) {
				nextErrors[fontstack] = errorMessage(error);
			}
		}
		if (generation !== validationGeneration) return;
		fontInfos = nextInfos;
		fontSizes = nextSizes;
		validationErrors = nextErrors;
		isValidating = false;
	};
	const handleFiles = async (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const files = [...(input.files ?? [])];
		input.value = '';
		if (files.length === 0 || isBusy || readOnly) return;
		validationGeneration += 1;
		isValidating = false;
		isUploading = true;
		operationError = undefined;
		await tick();
		for (const file of files) {
			try {
				const info = await onAddFont(await file.arrayBuffer());
				fontInfos = { ...fontInfos, [info.fontstackName]: info };
				fontSizes = { ...fontSizes, [info.fontstackName]: file.size };
				validationErrors = { ...validationErrors, [info.fontstackName]: undefined };
				selectedFontstack = info.fontstackName;
			} catch (error) {
				operationError = `${file.name} を追加できません: ${errorMessage(error)}`;
			}
		}
		isUploading = false;
	};
	const removeFont = async (fontstack: string) => {
		if (readOnly || isBusy) return;
		deletingFontstack = fontstack;
		operationError = undefined;
		try {
			await onRemoveFont(fontstack);
			selectedFontstack = undefined;
			const nextInfos = { ...fontInfos };
			const nextSizes = { ...fontSizes };
			const nextErrors = { ...validationErrors };
			delete nextInfos[fontstack];
			delete nextSizes[fontstack];
			delete nextErrors[fontstack];
			fontInfos = nextInfos;
			fontSizes = nextSizes;
			validationErrors = nextErrors;
		} catch (error) {
			operationError = `“${fontstack}” を削除できません: ${errorMessage(error)}`;
		} finally {
			deletingFontstack = undefined;
		}
	};
	const downloadBlob = (contents: Uint8Array, fileName: string) => {
		const blob = new Blob([contents as BlobPart], { type: 'application/zip' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = fileName;
		anchor.click();
		URL.revokeObjectURL(url);
	};
	const downloadGlyphs = async (fontstack: string) => {
		if (isBusy || !(fontstack in fonts)) return;
		downloadingFontstack = fontstack;
		downloadProgress = undefined;
		operationError = undefined;
		await tick();
		try {
			const font = await getLoadedFont(fontstack);
			if (!font) throw new Error('保存フォントを読み込めません。');
			const { generateRange } = await loadGlyphore();
			const archive = await buildGlyphArchive({
				fontstack,
				ranges: font.info.coveredRanges,
				generateRange: (start) => generateRange(font, start),
				onProgress: (progress) => (downloadProgress = progress)
			});
			downloadBlob(archive, `${fontstack}-glyphs.zip`);
		} catch (error) {
			operationError = `glyphs を生成できません: ${errorMessage(error)}`;
		} finally {
			downloadingFontstack = undefined;
			downloadProgress = undefined;
		}
	};

	onMount(() => {
		void validateFonts(Object.keys(fonts).sort((a, b) => a.localeCompare(b)));
	});
</script>

<aside class="flex w-60 shrink-0 flex-col border-r border-hairline bg-white">
	<header class="flex h-10 shrink-0 items-center gap-1.5 px-3">
		<h2 class="text-[12px] font-semibold text-ink-1">フォント</h2>
		<p class="text-[10.5px] text-ink-3">{fontstacks.length}</p>
		<label
			class={cn(
				'ml-auto flex size-6 items-center justify-center rounded-[5px] text-ink-2 hover:bg-field hover:text-ink-1',
				readOnly || isBusy ? 'cursor-default text-ink-4' : 'cursor-pointer'
			)}
			aria-label="フォントを追加"
			title="TTF または OTF を追加"
		>
			<Plus size={16} weight="regular" aria-hidden="true" />
			<input
				class="sr-only"
				type="file"
				accept=".ttf,.otf,font/ttf,font/otf,application/x-font-ttf,application/x-font-opentype"
				multiple
				disabled={readOnly || isBusy}
				onchange={handleFiles}
			/>
		</label>
	</header>

	<div class="shrink-0 px-3 pb-1.5">
		<div class="relative">
			<TextField
				class="w-full [&>input]:h-[26px] [&>input]:w-full [&>input]:rounded-[6px] [&>input]:pr-7 [&>input]:text-[11px] [&>input]:font-normal"
				aria-label="フォントを検索"
				placeholder="検索"
				value={search}
				onValueChange={(value) => (search = value)}
			/>
			{#if search}
				<Button
					class="absolute top-0 right-0 flex size-6 items-center justify-center text-ink-3 hover:text-ink-1"
					aria-label="フォント検索をクリア"
					onclick={() => (search = '')}
				>
					<X size={14} weight="regular" aria-hidden="true" />
				</Button>
			{/if}
		</div>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto">
		{#if fontstacks.length === 0}
			<p class="px-3 py-6 text-center text-[11px] text-ink-3">フォント参照はありません。</p>
		{/if}
		{#each fontstacks as fontstack (fontstack)}
			{@const selected = selectedFontstack === fontstack}
			<button
				type="button"
				class={cn(
					'flex min-h-[42px] w-full items-center gap-2 px-3 py-1.5 text-left outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]',
					selected ? 'bg-accent-soft text-ink-1' : 'text-ink-2 hover:bg-field'
				)}
				onclick={() => (selectedFontstack = selected ? undefined : fontstack)}
			>
				<span class="min-w-0 flex-1">
					<span class="flex items-center gap-1.5">
						<span class="min-w-0 flex-1 truncate text-[11px] text-ink-1">{fontstack}</span>
						{#if unresolved(fontstack)}
							<span
								class="size-1.5 shrink-0 rounded-full bg-danger"
								aria-label="未解決フォント"
								title="未解決フォント"
							></span>
						{/if}
					</span>
					<span class="mt-0.5 block truncate text-[9.5px] text-ink-3">
						{fontstack in fonts ? 'ローカル' : `見つかりません ・ ${fallbackLabel(fontstack)}`}
					</span>
				</span>
			</button>
			{#if selected}
				<div class="flex flex-col border-b border-hairline-soft px-3 pb-2.5 text-[10px]">
					<p
						class="my-2 truncate rounded-[6px] border border-hairline-soft px-2 py-3 text-center text-[21px] tracking-[0.08em] text-ink-1"
						style:font-family={selectedMeta
							? `"${selectedMeta.familyName}", sans-serif`
							: 'sans-serif'}
					>
						Basis 地図 Aa 123
					</p>
					{#if selectedMeta}
						<div class="flex min-h-[30px] items-center">
							<span class="w-[84px] shrink-0 text-ink-2">グリフ</span>
							<span class="font-mono text-ink-1">
								{selectedInfo?.glyphCount.toLocaleString() ?? (isValidating ? '取得中…' : '—')} ・
								{formatBytes(fontSizes[fontstack])}
							</span>
						</div>
					{:else}
						<p class={unresolved(fontstack) ? 'text-ink-2' : 'text-ink-3'}>
							{fallbackLabel(fontstack)}
						</p>
					{/if}
					{#if validationErrors[fontstack]}
						<p class="text-ink-2" role="alert">{validationErrors[fontstack]}</p>
					{/if}
					<div class="flex min-h-[30px] items-start">
						<p class="w-[84px] shrink-0 pt-2 text-ink-2">使用</p>
						{#if selectedUsages.length === 0}
							<p class="pt-2 text-ink-3">使用レイヤーなし</p>
						{:else}
							<div class="min-w-0 flex-1">
								{#each selectedUsages as layerId (layerId)}
									<button
										type="button"
										class="block h-[22px] w-full truncate text-left font-mono text-ink-2 outline-none hover:bg-field hover:text-ink-1 focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]"
										onclick={() => onSelectLayer?.(layerId)}
									>
										{layerId}
									</button>
								{/each}
							</div>
						{/if}
					</div>
					{#if downloadProgress && downloadingFontstack === fontstack}
						<progress
							class="h-1 w-full accent-accent"
							value={downloadProgress.completed}
							max={Math.max(downloadProgress.total, 1)}
						></progress>
					{/if}
					{#if selectedMeta}
						<div class="flex items-center justify-between gap-2">
							<Button
								class="flex size-6 items-center justify-center text-ink-2 hover:bg-field disabled:text-ink-4"
								aria-label={`${fontstack} を削除`}
								disabled={readOnly || isBusy}
								onclick={() => removeFont(fontstack)}
							>
								<Trash size={14} weight="regular" aria-hidden="true" />
							</Button>
							<Button
								class="flex h-6 items-center gap-1 rounded-[6px] px-2 text-[10px] text-ink-2 hover:bg-field disabled:text-ink-4"
								disabled={isBusy}
								onclick={() => downloadGlyphs(fontstack)}
							>
								<ArrowDown size={12} weight="regular" aria-hidden="true" />
								{downloadingFontstack === fontstack ? '生成中…' : 'glyphs'}
							</Button>
						</div>
					{/if}
				</div>
			{/if}
		{/each}
		{#if operationError}
			<p class="px-3 py-2 text-[10px] text-ink-2" role="alert">{operationError}</p>
		{/if}
	</div>

	<footer
		class="flex h-8 shrink-0 items-center justify-between border-t border-hairline-soft px-3 font-mono text-[10px] text-ink-3"
	>
		<span>{Object.keys(fonts).length} ローカル</span>
		<span>⌘5</span>
	</footer>
</aside>
