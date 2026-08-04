<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { StyleSpecification } from 'maplibre-gl';

	import { Button } from '#lib/components/common/Button';
	import { Switch } from '#lib/components/common/Switch';
	import { TextField } from '#lib/components/common/TextField';
	import { getLayerGroup, groupLayersByIdPrefix } from '#lib/utils/layerGroup.ts';
	import { parseImportedStyleJSON, type StyleImportResult } from '#lib/utils/styleImport.ts';

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
	let groupByPrefix = $state(false);
	const fileInputId = $props.id();

	// id 接頭辞 → kartore:group 変換のプレビュー (グループが作れないスタイルではトグルを出さない)
	const prefixGrouping = $derived(
		result?.ok === true ? groupLayersByIdPrefix(result.style.layers) : null
	);

	const reset = () => {
		url = '';
		result = null;
		isFetching = false;
		fileInputKey += 1;
		groupByPrefix = false;
	};

	const parseText = (text: string) => {
		result = parseImportedStyleJSON(text);
		// 既存グループが無く、変換で 1 つ以上グループが作れる場合はデフォルト ON
		groupByPrefix =
			result.ok &&
			!result.style.layers.some((layer) => getLayerGroup(layer) !== undefined) &&
			groupLayersByIdPrefix(result.style.layers).groupCount > 0;
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
		const style =
			groupByPrefix && prefixGrouping !== null && prefixGrouping.groupCount > 0
				? { ...result.style, layers: prefixGrouping.layers }
				: result.style;
		onImport(style);
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
		<Dialog.Overlay class="fixed inset-0 z-40 bg-ink-1/30" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-96 -translate-1/2 rounded-lg border border-hairline bg-white p-4 shadow-lg"
		>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<Dialog.Title class=" text-base font-semibold">スタイルを読み込む</Dialog.Title>
					<p class="text-xs text-ink-3">現在のスタイルは置き換えられます。</p>
				</div>

				<div class="flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<TextField
							class="flex-1 [&>input]:w-full"
							aria-label="スタイル URL"
							placeholder="https://example.com/style.json"
							bind:value={url}
						/>
						<Button
							class="rounded px-2 py-1 text-xs font-semibold text-ink-2 disabled:cursor-default disabled:text-ink-4"
							disabled={isFetching}
							onclick={fetchStyle}
						>
							取得
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
							class="inline-block cursor-pointer rounded px-2 py-1 text-xs font-semibold text-ink-2 transition-colors hover:bg-field active:bg-ink-4"
						>
							JSON ファイルを選択
						</label>
					</div>
				</div>

				{#if result?.ok === false}
					<p class="text-xs text-ink-2" role="alert">{result.error}</p>
				{:else if result?.ok === true}
					<div class="flex flex-col gap-2">
						<div class="rounded border border-hairline-soft bg-field px-3 py-2 text-xs text-ink-2">
							<p class="font-semibold">{result.style.name ?? '名称未設定のスタイル'}</p>
							<p>
								{result.style.layers.length} レイヤー /
								{Object.keys(result.style.sources).length} ソース
							</p>
						</div>
						{#if prefixGrouping !== null && prefixGrouping.groupCount > 0}
							<div class="flex flex-col gap-0.5">
								<Switch
									label="ID 接頭辞でレイヤーをグループ化"
									checked={groupByPrefix}
									onCheckedChange={(checked) => (groupByPrefix = checked)}
								/>
								<p class="text-xs text-ink-3">
									road_* / tunnel_* のように隣接するレイヤーから
									{prefixGrouping.groupCount} グループを作成します。
								</p>
							</div>
						{/if}
						{#if result.warnings.length > 0}
							<div class="flex flex-col gap-1 rounded border border-hairline bg-field px-3 py-2">
								<p class="text-xs font-semibold text-ink-2">
									検証エラーが {result.warnings.length} 件見つかりました
								</p>
								{#each result.warnings.slice(0, 10) as warning, index (warning + index)}
									<p class="text-xs break-words text-ink-2">{warning}</p>
								{/each}
								{#if result.warnings.length > 10}
									<p class="text-xs text-ink-2">
										ほか {result.warnings.length - 10} 件
									</p>
								{/if}
							</div>
						{/if}
					</div>
				{/if}

				<div class="flex justify-end gap-2">
					<Button class="rounded px-2 py-1 text-xs font-semibold text-ink-3" onclick={cancel}>
						キャンセル
					</Button>
					<Button
						class="rounded bg-ink-1 px-2 py-1 text-xs font-semibold text-white hover:bg-ink-2 disabled:cursor-default disabled:bg-ink-4"
						disabled={result?.ok !== true}
						onclick={importStyle}
					>
						読み込む
					</Button>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
