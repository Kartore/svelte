<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { StyleSpecification } from 'maplibre-gl';

	import { Button } from '$lib/components/common/Button';
	import { TextField } from '$lib/components/common/TextField';
	import { parseStyleJSON, type StyleImportResult } from '$lib/utils/styleImport.ts';

	let {
		open = $bindable(false),
		onImport
	}: {
		open?: boolean;
		onImport: (style: StyleSpecification) => void;
	} = $props();

	let url = $state('');
	let result = $state<StyleImportResult | null>(null);
	let isFetching = $state(false);
	let fileInputKey = $state(0);
	const fileInputId = $props.id();

	const reset = () => {
		url = '';
		result = null;
		isFetching = false;
		fileInputKey += 1;
	};

	const parseText = (text: string) => {
		result = parseStyleJSON(text);
	};

	const fetchStyle = async () => {
		let parsedUrl: URL;
		try {
			parsedUrl = new URL(url);
		} catch {
			result = { ok: false, error: 'Invalid URL.' };
			return;
		}

		isFetching = true;
		try {
			const response = await fetch(parsedUrl);
			if (!response.ok) {
				result = { ok: false, error: `Fetch failed: ${response.status} ${response.statusText}` };
				return;
			}
			parseText(await response.text());
		} catch (error) {
			result = {
				ok: false,
				error: `Fetch failed: ${error instanceof Error ? error.message : String(error)}`
			};
		} finally {
			isFetching = false;
		}
	};

	const importFile = async (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			parseText(await file.text());
		} catch (error) {
			result = {
				ok: false,
				error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
			};
		}
	};

	const importStyle = () => {
		if (result?.ok !== true) return;
		onImport(result.style);
		open = false;
		reset();
	};

	const cancel = () => {
		open = false;
		reset();
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-40 bg-black/30" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-96 -translate-1/2 rounded-lg border border-gray-300 bg-white p-4 shadow-lg"
		>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<Dialog.Title class="font-montserrat text-base font-semibold">Import Style</Dialog.Title>
					<p class="text-xs text-gray-500">現在のスタイルは置き換えられます。</p>
				</div>

				<div class="flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<TextField
							class="flex-1 [&>input]:w-full"
							aria-label="Style URL"
							bind:value={url}
							onValueChange={(value) => (url = value)}
						/>
						<Button
							class="rounded px-2 py-1 text-xs font-semibold text-gray-600 disabled:cursor-default disabled:text-gray-300"
							disabled={isFetching}
							onclick={fetchStyle}
						>
							Fetch
						</Button>
					</div>

					<div>
						{#key fileInputKey}
							<input
								id={fileInputId}
								class="hidden"
								type="file"
								accept=".json,application/json"
								onchange={importFile}
							/>
						{/key}
						<label
							for={fileInputId}
							class="inline-block cursor-pointer rounded px-2 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-300"
						>
							Choose JSON File
						</label>
					</div>
				</div>

				{#if result?.ok === false}
					<p class="text-xs text-red-600" role="alert">{result.error}</p>
				{:else if result?.ok === true}
					<div class="flex flex-col gap-2">
						<div class="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
							<p class="font-semibold">{result.style.name ?? 'Untitled style'}</p>
							<p>
								{result.style.layers.length} layers / {Object.keys(result.style.sources).length}
								sources
							</p>
						</div>
						{#if result.warnings.length > 0}
							<div
								class="flex flex-col gap-1 rounded border border-yellow-300 bg-yellow-50 px-3 py-2"
							>
								<p class="text-xs font-semibold text-yellow-700">
									{result.warnings.length} 件の検証エラーがあります
								</p>
								{#each result.warnings.slice(0, 10) as warning, index (warning + index)}
									<p class="text-xs break-words text-yellow-700">{warning}</p>
								{/each}
								{#if result.warnings.length > 10}
									<p class="text-xs text-yellow-700">他 {result.warnings.length - 10} 件</p>
								{/if}
							</div>
						{/if}
					</div>
				{/if}

				<div class="flex justify-end gap-2">
					<Button class="rounded px-2 py-1 text-xs font-semibold text-gray-500" onclick={cancel}>
						Cancel
					</Button>
					<Button
						class="rounded bg-gray-800 px-2 py-1 text-xs font-semibold text-white hover:bg-gray-700 disabled:cursor-default disabled:bg-gray-300"
						disabled={result?.ok !== true}
						onclick={importStyle}
					>
						Import
					</Button>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
