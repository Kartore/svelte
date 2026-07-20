<script lang="ts">
	import type { FontInfo } from '@kartore/glyphore';
	import { Dialog } from 'bits-ui';
	import { tick } from 'svelte';

	import { Button } from '$lib/components/common/Button';
	import { buildGlyphArchive, type GlyphDownloadProgress } from '$lib/fonts/glyphDownload.ts';
	import { loadGlyphore } from '$lib/fonts/glyphore.ts';
	import type { FontMeta, LoadedFont } from '$lib/stores/fonts';

	let {
		open = $bindable(false),
		fonts,
		onAddFont,
		onRemoveFont,
		getLoadedFont
	}: {
		open?: boolean;
		fonts: Record<string, FontMeta>;
		onAddFont: (bytes: ArrayBuffer | Uint8Array) => Promise<FontInfo>;
		onRemoveFont: (name: string) => Promise<void>;
		getLoadedFont: (name: string) => Promise<LoadedFont | null>;
	} = $props();

	let fontInfos = $state<Record<string, FontInfo | undefined>>({});
	let validationErrors = $state<Record<string, string | undefined>>({});
	let isValidating = $state(false);
	let isUploading = $state(false);
	let deletingFontstack = $state<string>();
	let pendingDeleteFontstack = $state<string>();
	let copiedFontstack = $state<string>();
	let downloadingFontstack = $state<string>();
	let downloadProgress = $state<GlyphDownloadProgress>();
	let uploadErrors = $state<string[]>([]);
	let operationError = $state<string>();
	let validationGeneration = 0;

	const fontEntries = $derived(
		Object.entries(fonts).sort(([left], [right]) => left.localeCompare(right))
	);
	const isBusy = $derived(
		isValidating ||
			isUploading ||
			deletingFontstack !== undefined ||
			downloadingFontstack !== undefined
	);

	const errorMessage = (error: unknown): string =>
		error instanceof Error ? error.message : String(error);

	const validateFonts = async (fontstacks: string[]) => {
		const generation = ++validationGeneration;
		if (fontstacks.length === 0) {
			fontInfos = {};
			validationErrors = {};
			isValidating = false;
			return;
		}

		isValidating = true;
		const nextInfos: Record<string, FontInfo | undefined> = {};
		const nextErrors: Record<string, string | undefined> = {};
		for (const fontstack of fontstacks) {
			try {
				const font = await getLoadedFont(fontstack);
				if (!font) throw new Error('The font is no longer available.');
				nextInfos[fontstack] = font.info;
			} catch (error) {
				nextErrors[fontstack] = errorMessage(error);
			}
		}

		if (generation !== validationGeneration) return;
		fontInfos = nextInfos;
		validationErrors = nextErrors;
		isValidating = false;
	};

	const handleFiles = async (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const files = [...(input.files ?? [])];
		input.value = '';
		if (files.length === 0 || isBusy) return;

		validationGeneration += 1;
		isValidating = false;
		isUploading = true;
		uploadErrors = [];
		operationError = undefined;
		await tick();

		const nextInfos = { ...fontInfos };
		const errors: string[] = [];
		for (const file of files) {
			try {
				const info = await onAddFont(await file.arrayBuffer());
				nextInfos[info.fontstackName] = info;
				validationErrors[info.fontstackName] = undefined;
			} catch (error) {
				errors.push(`Could not add ${file.name}: ${errorMessage(error)}`);
			}
		}

		fontInfos = nextInfos;
		uploadErrors = errors;
		isUploading = false;
	};

	const copyFontstack = async (fontstack: string) => {
		operationError = undefined;
		try {
			await navigator.clipboard.writeText(fontstack);
			copiedFontstack = fontstack;
		} catch (error) {
			operationError = `Could not copy the fontstack: ${errorMessage(error)}`;
		}
	};

	const confirmDelete = async (fontstack: string) => {
		if (isBusy) return;
		deletingFontstack = fontstack;
		operationError = undefined;
		validationGeneration += 1;
		isValidating = false;
		try {
			await onRemoveFont(fontstack);
			const nextInfos = { ...fontInfos };
			const nextErrors = { ...validationErrors };
			delete nextInfos[fontstack];
			delete nextErrors[fontstack];
			fontInfos = nextInfos;
			validationErrors = nextErrors;
			pendingDeleteFontstack = undefined;
			if (copiedFontstack === fontstack) copiedFontstack = undefined;
			void validateFonts(fontEntries.filter(([name]) => name !== fontstack).map(([name]) => name));
		} catch (error) {
			operationError = `Could not delete “${fontstack}”: ${errorMessage(error)}`;
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
		if (isBusy) return;
		downloadingFontstack = fontstack;
		downloadProgress = undefined;
		operationError = undefined;
		await tick();

		try {
			const font = await getLoadedFont(fontstack);
			if (!font) throw new Error('The font is no longer available.');
			fontInfos = { ...fontInfos, [fontstack]: font.info };
			const { generateRange } = await loadGlyphore();
			const archive = await buildGlyphArchive({
				fontstack,
				ranges: font.info.coveredRanges,
				generateRange: (start) => generateRange(font, start),
				onProgress: (progress) => (downloadProgress = progress)
			});
			downloadBlob(archive, `${fontstack}-glyphs.zip`);
		} catch (error) {
			operationError = `Could not download glyphs for “${fontstack}”: ${errorMessage(error)}`;
		} finally {
			downloadingFontstack = undefined;
			downloadProgress = undefined;
		}
	};

	const progressLabel = (progress: GlyphDownloadProgress): string =>
		progress.phase === 'zipping'
			? `Compressing ${progress.total.toLocaleString()} ranges…`
			: `Generating ${progress.completed.toLocaleString()} of ${progress.total.toLocaleString()} ranges…`;

	const close = () => {
		validationGeneration += 1;
		open = false;
		pendingDeleteFontstack = undefined;
		copiedFontstack = undefined;
		uploadErrors = [];
		operationError = undefined;
	};

	// The dialog is conditionally mounted only while open, so saved fonts are loaded on opening,
	// never during application startup.
	// svelte-ignore state_referenced_locally
	void validateFonts(Object.keys(fonts));
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-40 bg-gray-950/35 backdrop-blur-[1px]" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[min(94vw,50rem)] -translate-1/2 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xl shadow-gray-950/20"
		>
			<div class="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-3">
				<div class="flex flex-col gap-1">
					<Dialog.Title class="font-montserrat text-base font-semibold text-gray-950">
						Fonts
					</Dialog.Title>
					<Dialog.Description class="text-xs font-medium text-gray-500">
						Upload local TTF or OTF fonts for map labels and glyph download.
					</Dialog.Description>
				</div>
				<label
					class="flex h-8 cursor-pointer items-center rounded-md bg-gray-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-gray-700 has-[:disabled]:cursor-default has-[:disabled]:bg-gray-300"
				>
					{isUploading ? 'Parsing…' : 'Upload fonts'}
					<input
						class="sr-only"
						type="file"
						accept=".ttf,.otf,font/ttf,font/otf,application/x-font-ttf,application/x-font-opentype"
						multiple
						disabled={isBusy}
						onchange={handleFiles}
					/>
				</label>
			</div>

			<div class="flex flex-1 flex-col gap-3 overflow-auto px-4 py-4">
				{#each uploadErrors as error (error)}
					<p
						class="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs break-words text-red-700"
						role="alert"
					>
						{error}
					</p>
				{/each}
				{#if operationError}
					<p
						class="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs break-words text-red-700"
						role="alert"
					>
						{operationError}
					</p>
				{/if}

				{#if fontEntries.length === 0}
					<div class="rounded-md border border-dashed border-gray-300 px-4 py-10 text-center">
						<p class="text-sm font-semibold text-gray-600">No local fonts</p>
						<p class="mt-1 text-xs text-gray-400">
							Upload a TTF or OTF file to generate MapLibre glyphs in the browser.
						</p>
					</div>
				{:else}
					{#each fontEntries as [fontstack, meta] (fontstack)}
						{@const info = fontInfos[fontstack]}
						<div class="overflow-hidden rounded-md border border-gray-200 bg-white">
							<div class="flex items-start gap-3 px-3 py-3">
								<div class="min-w-0 flex-1">
									<p class="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
										text-font value
									</p>
									<div class="mt-1 flex min-w-0 items-center gap-2">
										<code
											class="min-w-0 truncate rounded bg-gray-100 px-2 py-1 font-mono text-xs font-semibold text-gray-800"
											title={fontstack}
										>
											{fontstack}
										</code>
										<Button
											class="h-7 shrink-0 rounded-md border border-gray-200 px-2 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50"
											disabled={isBusy}
											onclick={() => copyFontstack(fontstack)}
										>
											{copiedFontstack === fontstack ? 'Copied' : 'Copy'}
										</Button>
									</div>
									<p class="mt-2 text-xs text-gray-500">
										{meta.familyName} · {meta.styleName}
									</p>
									{#if validationErrors[fontstack]}
										<p class="mt-1 text-xs break-words text-red-600" role="alert">
											{validationErrors[fontstack]}
										</p>
									{:else if info}
										<p class="mt-1 text-xs font-medium text-gray-500">
											{info.glyphCount.toLocaleString()} glyphs · {info.coveredRanges.length.toLocaleString()}
											ranges
										</p>
									{:else if isValidating}
										<p class="mt-1 text-xs text-gray-400">Reading font metadata…</p>
									{/if}
								</div>

								<div class="flex shrink-0 items-center gap-1">
									<Button
										class="h-7 rounded-md border border-gray-200 px-2 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 disabled:cursor-default disabled:text-gray-300"
										disabled={isBusy || validationErrors[fontstack] !== undefined}
										onclick={() => downloadGlyphs(fontstack)}
									>
										{downloadingFontstack === fontstack ? 'Building…' : 'Download glyphs'}
									</Button>
									{#if pendingDeleteFontstack === fontstack}
										<span class="ml-1 text-xs font-semibold text-red-600">Delete?</span>
										<Button
											class="h-7 rounded-md px-2 text-xs font-semibold text-gray-500 hover:bg-gray-100"
											disabled={isBusy}
											onclick={() => (pendingDeleteFontstack = undefined)}
										>
											Cancel
										</Button>
										<Button
											class="h-7 rounded-md bg-red-600 px-2 text-xs font-semibold text-white hover:bg-red-500"
											disabled={isBusy}
											onclick={() => confirmDelete(fontstack)}
										>
											Delete
										</Button>
									{:else}
										<Button
											class="h-7 rounded-md px-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-default disabled:text-gray-300"
											disabled={isBusy}
											onclick={() => (pendingDeleteFontstack = fontstack)}
										>
											Delete
										</Button>
									{/if}
								</div>
							</div>

							{#if downloadingFontstack === fontstack && downloadProgress}
								<div class="border-t border-gray-200 bg-gray-50 px-3 py-2.5">
									<div
										class="flex items-center justify-between gap-3 text-xs font-medium text-gray-600"
									>
										<span>{progressLabel(downloadProgress)}</span>
										<span class="font-mono text-[11px] text-gray-400">
											{downloadProgress.total === 0
												? 0
												: Math.round((downloadProgress.completed / downloadProgress.total) * 100)}%
										</span>
									</div>
									<progress
										class="mt-2 h-1.5 w-full accent-gray-800"
										value={downloadProgress.completed}
										max={Math.max(downloadProgress.total, 1)}
									></progress>
								</div>
							{/if}
						</div>
					{/each}
				{/if}
			</div>

			<div
				class="flex items-center justify-between gap-4 border-t border-gray-200 bg-white px-4 py-3"
			>
				<p class="text-xs text-gray-500">
					Local fonts stay in this browser. Copy a fontstack into a symbol layer’s text-font.
				</p>
				<Button
					class="h-8 shrink-0 rounded-md px-3 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:cursor-default disabled:text-gray-300"
					disabled={downloadingFontstack !== undefined}
					onclick={close}
				>
					Close
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
