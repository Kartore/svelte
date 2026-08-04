<script lang="ts">
	import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
	import { ArrowDown, Plus, Trash, X } from 'phosphor-svelte';
	import { onMount, tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	import { Button } from '#lib/components/common/Button';
	import { TextField } from '#lib/components/common/TextField';
	import { loadSpritore } from '#lib/sprites/spritore.ts';
	import { spriteIdFromFileName, svgDataUrl } from '#lib/sprites/spriteSvg.ts';
	import { spriteUsageLayerIds } from '#lib/utils/assetUsage.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		mapStyle,
		icons,
		readOnly = false,
		onSetIcon,
		onRemoveIcon,
		onSelectLayer
	}: {
		mapStyle: StyleSpecification;
		icons: Record<string, string>;
		readOnly?: boolean;
		onSetIcon: (id: string, svg: string) => void;
		onRemoveIcon: (id: string) => void;
		onSelectLayer?: (layerId: string) => void;
	} = $props();

	let search = $state('');
	let selectedId = $state<string>();
	let validationErrors = $state<Record<string, string | undefined>>({});
	let isValidating = $state(false);
	let isDownloading = $state(false);
	let uploadError = $state<string>();
	let downloadError = $state<string>();
	let pendingDeleteId = $state<string>();
	let validationGeneration = 0;

	const iconEntries = $derived(
		Object.entries(icons)
			.filter(([id]) => id.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
			.sort(([left], [right]) => left.localeCompare(right))
	);
	const allIconEntries = $derived(
		Object.entries(icons).sort(([left], [right]) => left.localeCompare(right))
	);
	const validIconEntries = $derived(
		allIconEntries.filter(([id]) => validationErrors[id] === undefined)
	);
	const selectedSvg = $derived(selectedId ? icons[selectedId] : undefined);
	const selectedUsages = $derived(selectedId ? spriteUsageLayerIds(mapStyle, selectedId) : []);

	const errorMessage = (error: unknown): string =>
		error instanceof Error ? error.message : String(error);
	const validateIcons = async (entries: [string, string][]) => {
		const generation = ++validationGeneration;
		if (entries.length === 0) {
			validationErrors = {};
			isValidating = false;
			return;
		}
		isValidating = true;
		try {
			const { renderIcon } = await loadSpritore();
			const errors: Record<string, string | undefined> = {};
			for (const [id, svg] of entries) {
				try {
					await renderIcon(id, svg, 1);
				} catch (error) {
					errors[id] = errorMessage(error);
				}
			}
			if (generation === validationGeneration) validationErrors = errors;
		} catch (error) {
			if (generation === validationGeneration) {
				const message = errorMessage(error);
				validationErrors = Object.fromEntries(entries.map(([id]) => [id, message]));
			}
		} finally {
			if (generation === validationGeneration) isValidating = false;
		}
	};

	const addFiles = async (files: File[]) => {
		if (readOnly || files.length === 0) return;
		uploadError = undefined;
		downloadError = undefined;
		const occupiedIds = new SvelteSet(Object.keys(icons));
		const nextIcons = { ...icons };
		for (const file of files) {
			const id = spriteIdFromFileName(file.name);
			if (occupiedIds.has(id) && !window.confirm(`“${id}” は既にあります。上書きしますか？`)) {
				continue;
			}
			try {
				const svg = await file.text();
				onSetIcon(id, svg);
				nextIcons[id] = svg;
				occupiedIds.add(id);
				selectedId = id;
			} catch (error) {
				uploadError = `${file.name} を読み込めません: ${errorMessage(error)}`;
			}
		}
		await validateIcons(Object.entries(nextIcons));
	};
	const handleFiles = async (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const files = [...(input.files ?? [])];
		input.value = '';
		await addFiles(files);
	};
	const handleDrop = async (event: DragEvent) => {
		event.preventDefault();
		await addFiles(
			[...(event.dataTransfer?.files ?? [])].filter((file) => /\.svg$/i.test(file.name))
		);
	};
	const renameIcon = (nextName: string) => {
		if (!selectedId || !selectedSvg || readOnly) return;
		const trimmed = nextName.trim();
		if (!trimmed || trimmed === selectedId || trimmed in icons) return;
		const previousId = selectedId;
		onSetIcon(trimmed, selectedSvg);
		onRemoveIcon(previousId);
		selectedId = trimmed;
	};
	const confirmDelete = (id: string) => {
		if (readOnly) return;
		onRemoveIcon(id);
		selectedId = undefined;
		pendingDeleteId = undefined;
		void validateIcons(allIconEntries.filter(([currentId]) => currentId !== id));
	};
	const downloadBlob = (contents: string | Uint8Array, type: string, fileName: string) => {
		const blob = new Blob([contents as BlobPart], { type });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = fileName;
		anchor.click();
		URL.revokeObjectURL(url);
	};
	const downloadSprite = async () => {
		if (validIconEntries.length === 0 || isValidating || isDownloading) return;
		isDownloading = true;
		downloadError = undefined;
		await tick();
		try {
			const { buildSpriteSheet } = await loadSpritore();
			const spriteIcons = validIconEntries.map(([id, svg]) => ({ id, svg }));
			const [oneX, twoX] = await Promise.all([
				buildSpriteSheet(spriteIcons, 1),
				buildSpriteSheet(spriteIcons, 2)
			]);
			downloadBlob(oneX.indexJson, 'application/json', 'sprite.json');
			downloadBlob(oneX.png, 'image/png', 'sprite.png');
			downloadBlob(twoX.indexJson, 'application/json', 'sprite@2x.json');
			downloadBlob(twoX.png, 'image/png', 'sprite@2x.png');
		} catch (error) {
			downloadError = errorMessage(error);
		} finally {
			isDownloading = false;
		}
	};

	onMount(() => {
		void validateIcons(allIconEntries);
	});
</script>

<aside class="flex w-60 shrink-0 flex-col border-r border-hairline bg-white">
	<header class="flex h-10 shrink-0 items-center gap-1.5 px-3">
		<h2 class="text-[12px] font-semibold text-ink-1">スプライト</h2>
		<p class="text-[10.5px] text-ink-3">{allIconEntries.length}</p>
		<label
			class={cn(
				'ml-auto flex size-6 items-center justify-center rounded-[5px] text-ink-2 hover:bg-field hover:text-ink-1',
				readOnly ? 'cursor-default text-ink-4' : 'cursor-pointer'
			)}
			aria-label="SVG スプライトを追加"
			title="SVG スプライトを追加"
		>
			<Plus size={16} weight="regular" aria-hidden="true" />
			<input
				class="sr-only"
				type="file"
				accept=".svg,image/svg+xml"
				multiple
				disabled={readOnly}
				onchange={handleFiles}
			/>
		</label>
	</header>

	<div class="shrink-0 px-3 pb-1.5">
		<div class="relative">
			<TextField
				class="w-full [&>input]:h-[26px] [&>input]:w-full [&>input]:rounded-[6px] [&>input]:pr-7 [&>input]:text-[11px] [&>input]:font-normal"
				aria-label="スプライトを検索"
				placeholder="検索"
				value={search}
				onValueChange={(value) => (search = value)}
			/>
			{#if search}
				<Button
					class="absolute top-0 right-0 flex size-6 items-center justify-center text-ink-3 hover:text-ink-1"
					aria-label="スプライト検索をクリア"
					onclick={() => (search = '')}
				>
					<X size={14} weight="regular" aria-hidden="true" />
				</Button>
			{/if}
		</div>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto">
		<div
			class="grid min-h-16 grid-cols-5 gap-1.5 px-3 pt-1 pb-2"
			role="region"
			aria-label="スプライト一覧"
			ondragover={(event) => event.preventDefault()}
			ondrop={handleDrop}
		>
			{#if iconEntries.length === 0}
				<p class="col-span-5 self-center text-center text-[10px] text-ink-3">
					スプライトはありません。
				</p>
			{:else}
				{#each iconEntries as [id, svg] (id)}
					<button
						type="button"
						class={cn(
							'flex aspect-square items-center justify-center rounded-[6px] border border-hairline-soft p-1 text-ink-2 outline-none hover:bg-field focus-visible:border-accent',
							selectedId === id && 'border-accent outline-1 outline-accent'
						)}
						aria-label={`${id} を選択`}
						title={id}
						onclick={() => (selectedId = selectedId === id ? undefined : id)}
					>
						<img src={svgDataUrl(svg)} alt="" class="max-h-full max-w-full" />
					</button>
				{/each}
			{/if}
		</div>

		{#if selectedId && selectedSvg}
			<div class="flex flex-col gap-1 border-t border-hairline-soft px-3 pt-1 pb-2.5 text-[10px]">
				<TextField label="名前" value={selectedId} disabled={readOnly} onCommit={renameIcon} />
				{#if validationErrors[selectedId]}
					<p class="text-ink-2" role="alert">{validationErrors[selectedId]}</p>
				{:else if isValidating}
					<p class="text-ink-3">検証中…</p>
				{/if}
				<div class="flex min-h-[30px] items-start">
					<p class="w-[84px] shrink-0 pt-2 text-[10px] text-ink-2">使用</p>
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
									{layerId} ・ icon-image
								</button>
							{/each}
						</div>
					{/if}
				</div>
				<p class="mt-1 text-[9.5px] leading-4 text-ink-4">
					SVG ソースを保持 ・ 表示は WASM(spritore)で生成
				</p>
				<div class="flex justify-end">
					{#if pendingDeleteId === selectedId}
						<Button
							class="h-6 px-2 text-[10px] text-ink-3 hover:bg-field"
							onclick={() => (pendingDeleteId = undefined)}
						>
							キャンセル
						</Button>
						<Button
							class="h-6 bg-ink-1 px-2 text-[10px] font-semibold text-white"
							onclick={() => confirmDelete(selectedId!)}
						>
							削除
						</Button>
					{:else}
						<Button
							class="flex h-6 items-center gap-1 px-2 text-[10px] text-ink-2 hover:bg-field disabled:text-ink-4"
							disabled={readOnly}
							onclick={() => (pendingDeleteId = selectedId)}
						>
							<Trash size={12} weight="regular" aria-hidden="true" />
							削除
						</Button>
					{/if}
				</div>
			</div>
		{/if}
		{#if uploadError}
			<p class="px-3 py-2 text-[10px] text-ink-2" role="alert">{uploadError}</p>
		{/if}
		{#if downloadError}
			<p class="px-3 py-2 text-[10px] text-ink-2" role="alert">{downloadError}</p>
		{/if}
	</div>

	<footer
		class="flex h-8 shrink-0 items-center justify-between border-t border-hairline-soft px-2 font-mono text-[10px] text-ink-3"
	>
		<Button
			class="flex h-6 items-center gap-1 rounded-[6px] px-1.5 text-[10px] text-ink-2 hover:bg-field disabled:text-ink-4"
			disabled={validIconEntries.length === 0 || isValidating || isDownloading}
			onclick={downloadSprite}
		>
			<ArrowDown size={12} weight="regular" aria-hidden="true" />
			{isDownloading ? '生成中…' : 'sprite を保存'}
		</Button>
		<span>⌘4</span>
	</footer>
</aside>
