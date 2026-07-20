<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	import { Button } from '$lib/components/common/Button';
	import { loadSpritore } from '$lib/sprites/spritore.ts';
	import { spriteIdFromFileName, svgDataUrl } from '$lib/sprites/spriteSvg.ts';

	let {
		open = $bindable(false),
		icons,
		onSetIcon,
		onRemoveIcon
	}: {
		open?: boolean;
		icons: Record<string, string>;
		onSetIcon: (id: string, svg: string) => void;
		onRemoveIcon: (id: string) => void;
	} = $props();

	let validationErrors = $state<Record<string, string | undefined>>({});
	let isValidating = $state(false);
	let isDownloading = $state(false);
	let pendingDeleteId = $state<string>();
	let uploadError = $state<string>();
	let downloadError = $state<string>();
	let validationGeneration = 0;

	const iconEntries = $derived(
		Object.entries(icons).sort(([left], [right]) => left.localeCompare(right))
	);
	const validIconEntries = $derived(
		iconEntries.filter(([id]) => validationErrors[id] === undefined)
	);

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
			if (generation !== validationGeneration) return;
			validationErrors = errors;
		} catch (error) {
			if (generation !== validationGeneration) return;
			const message = errorMessage(error);
			validationErrors = Object.fromEntries(entries.map(([id]) => [id, message]));
		} finally {
			if (generation === validationGeneration) isValidating = false;
		}
	};

	const handleFiles = async (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const files = [...(input.files ?? [])];
		input.value = '';
		uploadError = undefined;
		downloadError = undefined;
		const occupiedIds = new SvelteSet(Object.keys(icons));
		const nextIcons = { ...icons };

		for (const file of files) {
			const id = spriteIdFromFileName(file.name);
			if (
				occupiedIds.has(id) &&
				!window.confirm(`A sprite named “${id}” already exists. Overwrite it?`)
			) {
				continue;
			}

			try {
				const svg = await file.text();
				onSetIcon(id, svg);
				nextIcons[id] = svg;
				occupiedIds.add(id);
			} catch (error) {
				uploadError = `Could not read ${file.name}: ${errorMessage(error)}`;
			}
		}

		await validateIcons(Object.entries(nextIcons));
	};

	const confirmDelete = (id: string) => {
		onRemoveIcon(id);
		if (pendingDeleteId === id) pendingDeleteId = undefined;
		downloadError = undefined;
		void validateIcons(iconEntries.filter(([currentId]) => currentId !== id));
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

	const close = () => {
		open = false;
		pendingDeleteId = undefined;
		uploadError = undefined;
		downloadError = undefined;
	};

	// The dialog is conditionally mounted only while open, so initial validation runs once per opening.
	// svelte-ignore state_referenced_locally
	void validateIcons(Object.entries(icons));
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-40 bg-gray-950/35 backdrop-blur-[1px]" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[min(94vw,46rem)] -translate-1/2 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xl shadow-gray-950/20"
		>
			<div class="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-3">
				<div class="flex flex-col gap-1">
					<Dialog.Title class="font-montserrat text-base font-semibold text-gray-950">
						Sprites
					</Dialog.Title>
					<Dialog.Description class="text-xs font-medium text-gray-500">
						Upload local SVG icons for previewing and sprite download.
					</Dialog.Description>
				</div>
				<label
					class="flex h-8 cursor-pointer items-center rounded-md bg-gray-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-gray-700"
				>
					Upload SVGs
					<input
						class="sr-only"
						type="file"
						accept=".svg,image/svg+xml"
						multiple
						onchange={handleFiles}
					/>
				</label>
			</div>

			<div class="flex flex-1 flex-col gap-3 overflow-auto px-4 py-4">
				{#if uploadError}
					<p
						class="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
						role="alert"
					>
						{uploadError}
					</p>
				{/if}
				{#if iconEntries.length === 0}
					<div class="rounded-md border border-dashed border-gray-300 px-4 py-10 text-center">
						<p class="text-sm font-semibold text-gray-600">No local sprites</p>
						<p class="mt-1 text-xs text-gray-400">Upload one or more SVG files to get started.</p>
					</div>
				{:else}
					{#each iconEntries as [id, svg] (id)}
						<div class="rounded-md border border-gray-200 bg-white px-3 py-2">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50 p-1"
								>
									<img src={svgDataUrl(svg)} alt="" class="max-h-full max-w-full" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-semibold text-gray-800">{id}</p>
									{#if validationErrors[id]}
										<p class="mt-0.5 text-xs break-words text-red-600" role="alert">
											{validationErrors[id]}
										</p>
									{:else if isValidating}
										<p class="mt-0.5 text-xs text-gray-400">Validating…</p>
									{/if}
								</div>
								{#if pendingDeleteId === id}
									<span class="text-xs font-semibold text-red-600">Delete?</span>
									<Button
										class="h-7 rounded-md px-2 text-xs font-semibold text-gray-500 hover:bg-gray-100"
										onclick={() => (pendingDeleteId = undefined)}
									>
										Cancel
									</Button>
									<Button
										class="h-7 rounded-md bg-red-600 px-2 text-xs font-semibold text-white hover:bg-red-500"
										onclick={() => confirmDelete(id)}
									>
										Delete
									</Button>
								{:else}
									<Button
										class="h-7 rounded-md px-2 text-xs font-semibold text-red-600 hover:bg-red-50"
										onclick={() => (pendingDeleteId = id)}
									>
										Delete
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div
				class="flex items-center justify-between gap-4 border-t border-gray-200 bg-white px-4 py-3"
			>
				<div class="min-w-0 flex-1">
					{#if downloadError}
						<p class="text-xs break-words text-red-600" role="alert">{downloadError}</p>
					{:else if iconEntries.length > 0 && validIconEntries.length < iconEntries.length}
						<p class="text-xs text-gray-500">
							Invalid SVGs are excluded from the downloaded sheet.
						</p>
					{/if}
				</div>
				<Button
					class="h-8 rounded-md bg-gray-900 px-3 text-xs font-semibold text-white hover:bg-gray-700 disabled:cursor-default disabled:bg-gray-300"
					disabled={validIconEntries.length === 0 || isValidating || isDownloading}
					onclick={downloadSprite}
				>
					{isDownloading ? 'Building…' : 'Download sprite'}
				</Button>
				<Button
					class="h-8 rounded-md px-3 text-xs font-semibold text-gray-600 hover:bg-gray-100"
					onclick={close}
				>
					Close
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
