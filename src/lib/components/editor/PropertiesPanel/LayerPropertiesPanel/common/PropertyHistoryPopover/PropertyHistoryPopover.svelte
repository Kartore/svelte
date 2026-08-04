<script lang="ts">
	import { Popover } from 'bits-ui';
	import { ClockCounterClockwiseIcon } from 'phosphor-svelte';
	import { onDestroy } from 'svelte';

	import { Button } from '#lib/components/common/Button';
	import { useStyleHistory } from '#lib/contexts/styleHistory.svelte.ts';
	import type { StyleHistoryProvider, StyleHistoryRevision } from '#lib/editor/EditorModule.ts';
	import { tryParseColor } from '#lib/utils/color.ts';
	import {
		computeHistoryEntries,
		loadPropertyRevisionValue,
		type PropertyHistoryEntry,
		type PropertyHistoryGroup,
		type PropertyRevisionValue
	} from '#lib/utils/propertyHistory.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		layerId,
		group,
		key,
		label,
		currentValue,
		defaultValue,
		onRestore
	}: {
		layerId: string;
		group: PropertyHistoryGroup;
		key: string;
		label: string;
		currentValue: unknown;
		defaultValue?: unknown;
		onRestore: (value: unknown | undefined) => void;
	} = $props();

	const history = useStyleHistory();
	const provider = $derived(history?.provider ?? null);
	const providerLabel = $derived(provider?.label ?? '接続中のスタイル');

	let open = $state(false);
	let loading = $state(false);
	let loadedCount = $state(0);
	let totalCount = $state(0);
	let hasNext = $state(false);
	let nextPage = $state(1);
	let error = $state<string | null>(null);
	let revisionValues = $state<PropertyRevisionValue[]>([]);
	let pageValues = $state<PropertyRevisionValue[]>([]);
	let entries = $state<PropertyHistoryEntry[]>([]);
	let generation = 0;

	const isDefined = <T,>(value: T | undefined): value is T => value !== undefined;
	const errorMessage = (value: unknown): string =>
		value instanceof Error ? value.message : value ? String(value) : '履歴を読み込めませんでした。';
	const valuesEqual = (left: unknown, right: unknown): boolean =>
		JSON.stringify(left) === JSON.stringify(right);
	const formatValue = (value: unknown): string => {
		if (value === undefined) return '(未設定)';
		const serialized = JSON.stringify(value);
		return serialized === undefined ? String(value) : serialized;
	};
	const colorValue = (value: unknown): string | undefined =>
		typeof value === 'string' && tryParseColor(value) ? value : undefined;
	const firstLine = (message: string): string => message.split(/\r?\n/, 1)[0] || '(メッセージなし)';
	const formatDate = (authoredAt: string): string => {
		const date = new Date(authoredAt);
		if (Number.isNaN(date.getTime())) return '日時不明';
		const parts = new Intl.DateTimeFormat('ja-JP', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).formatToParts(date);
		const part = (type: Intl.DateTimeFormatPartTypes): string =>
			parts.find((candidate) => candidate.type === type)?.value ?? '';
		return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}`;
	};
	const provisionalEntry = (item: PropertyRevisionValue): PropertyHistoryEntry => ({
		revision: item.revision,
		value: item.value,
		kind:
			item.state === 'error'
				? 'error'
				: item.state === 'layer-missing'
					? 'layer-missing'
					: 'oldest-loaded',
		error: item.error
	});
	const displayEntries = $derived(
		loading && revisionValues.length === 0 ? pageValues.map(provisionalEntry) : entries
	);
	const unsetLabel = $derived(group === 'filter' ? 'フィルターなし' : '既定値');
	const unsetDescription = $derived(
		group === 'filter'
			? 'フィルターを適用せず、すべてのフィーチャーを表示します。'
			: 'プロパティは未設定で、スタイルの既定値が適用されます。'
	);
	const unsetActionLabel = $derived(group === 'filter' ? 'フィルターを解除' : '既定値を使用');

	const loadRevisionValues = async (
		revisions: StyleHistoryRevision[],
		activeProvider: StyleHistoryProvider,
		requestGeneration: number
	): Promise<PropertyRevisionValue[] | null> => {
		const results: Array<PropertyRevisionValue | undefined> = Array.from({
			length: revisions.length
		});
		let cursor = 0;

		const worker = async () => {
			while (requestGeneration === generation && cursor < revisions.length) {
				const index = cursor;
				cursor += 1;
				const revision = revisions[index];
				const result = await loadPropertyRevisionValue(
					activeProvider,
					revision,
					layerId,
					group,
					key
				);

				if (requestGeneration !== generation) return;
				results[index] = result;
				loadedCount += 1;
				pageValues = results.filter(isDefined);
			}
		};

		await Promise.all(Array.from({ length: Math.min(4, revisions.length) }, () => worker()));
		return requestGeneration === generation ? results.filter(isDefined) : null;
	};

	const loadPage = async (page: number, reset: boolean) => {
		const activeProvider = provider;
		if (!activeProvider) return;
		const requestGeneration = reset ? ++generation : generation;
		if (reset) {
			hasNext = false;
			nextPage = 1;
			revisionValues = [];
			entries = [];
		}
		loading = true;
		loadedCount = 0;
		totalCount = 0;
		pageValues = [];
		error = null;

		try {
			const response = await activeProvider.listRevisions({
				page,
				scope: { layerId }
			});
			if (requestGeneration !== generation) return;
			totalCount = response.revisions.length;
			hasNext = response.hasNext;
			const loaded = await loadRevisionValues(
				response.revisions,
				activeProvider,
				requestGeneration
			);
			if (!loaded || requestGeneration !== generation) return;

			revisionValues = reset ? loaded : [...revisionValues, ...loaded];
			entries = computeHistoryEntries(revisionValues, hasNext);
			nextPage = page + 1;
		} catch (loadError) {
			if (requestGeneration === generation) error = errorMessage(loadError);
		} finally {
			if (requestGeneration === generation) {
				loading = false;
				pageValues = [];
			}
		}
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (nextOpen) {
			void loadPage(1, true);
			return;
		}
		generation += 1;
		loading = false;
		pageValues = [];
	};

	onDestroy(() => {
		generation += 1;
	});
</script>

<Popover.Root bind:open onOpenChange={handleOpenChange}>
	<Popover.Trigger
		aria-label={`${label} の履歴を表示`}
		title={`${label} の履歴を表示`}
		class="flex shrink-0 items-center justify-center rounded px-1.5 py-0.5 font-mono text-xs text-ink-3 transition-colors hover:bg-field hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent data-[state=open]:bg-accent-soft data-[state=open]:text-accent"
	>
		<ClockCounterClockwiseIcon size={13} weight="regular" aria-hidden="true" />
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			class="z-50 w-[28rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-hairline-soft bg-white shadow-xl shadow-ink-1/15"
			side="left"
			align="start"
			sideOffset={8}
			collisionPadding={8}
		>
			<header class="border-b border-hairline-soft bg-field px-4 py-3">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<h2 class="truncate text-[11.5px] font-semibold text-ink-1">{label} の履歴</h2>
						<p class="mt-0.5 truncate font-mono text-[11px] text-ink-3" title={providerLabel}>
							{providerLabel}
						</p>
					</div>
					{#if loading}
						<span
							class="shrink-0 rounded-full bg-accent-soft px-2 py-1 text-[10px] font-semibold text-accent"
							aria-live="polite"
						>
							{#if totalCount > 0}{loadedCount}/{totalCount}{:else}読込中…{/if}
						</span>
					{/if}
				</div>
			</header>

			<div class="max-h-[min(32rem,calc(100vh-8rem))] overflow-y-auto overscroll-contain">
				{#if displayEntries.length > 0}
					<ol class="relative ml-5 border-l border-hairline-soft py-1">
						{#each displayEntries as entry (`${entry.revision.id}-${entry.kind}`)}
							<li class="relative border-b border-hairline-soft py-3 pr-4 pl-4 last:border-b-0">
								<span
									aria-hidden="true"
									class={cn(
										'absolute top-4 -left-[5px] h-2.5 w-2.5 rounded-full border-2 border-white',
										entry.kind === 'error'
											? 'border-white bg-ink-1'
											: entry.kind === 'layer-missing'
												? 'border-white bg-ink-4'
												: entry.value === undefined
													? 'border-hairline bg-white'
													: 'border-white bg-accent'
									)}
								></span>

								{#if entry.kind === 'layer-missing'}
									<p class="text-xs font-semibold text-ink-3">このレイヤーが作成される前です</p>
								{:else if entry.kind === 'error'}
									<p class="text-xs font-semibold text-ink-2">このリビジョンを読めませんでした</p>
									<p class="mt-1 text-xs text-ink-2">{entry.error}</p>
								{:else}
									<div class="flex min-w-0 items-center gap-2">
										<div class="min-w-0 flex-1">
											{#if entry.value === undefined}
												<div class="flex min-w-0 items-center gap-1.5">
													<span class="truncate text-xs font-semibold text-ink-1">{unsetLabel}</span
													>
													<span
														class="shrink-0 rounded border border-hairline-soft bg-field px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-ink-3"
														>未設定</span
													>
												</div>
												{#if group !== 'filter' && defaultValue !== undefined}
													<div
														class="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-ink-3"
													>
														<span class="shrink-0">実効値</span>
														<span aria-hidden="true">·</span>
														{#if colorValue(defaultValue) !== undefined}
															<span
																class="h-3 w-3 shrink-0 rounded-sm border border-hairline shadow-sm"
																style:background={colorValue(defaultValue)}
																aria-hidden="true"
															></span>
														{/if}
														<code
															class="min-w-0 truncate font-mono text-[11px] font-normal text-ink-2"
															title={formatValue(defaultValue)}>{formatValue(defaultValue)}</code
														>
													</div>
												{:else}
													<p class="mt-1 truncate text-[10px] text-ink-3" title={unsetDescription}>
														{unsetDescription}
													</p>
												{/if}
											{:else}
												<div class="flex min-w-0 items-center gap-2">
													{#if colorValue(entry.value) !== undefined}
														<span
															class="h-3 w-3 shrink-0 rounded-sm border border-hairline shadow-sm"
															style:background={colorValue(entry.value)}
															aria-hidden="true"
														></span>
													{/if}
													<code
														class="min-w-0 flex-1 truncate font-mono text-[11px] font-normal text-ink-1"
														title={formatValue(entry.value)}>{formatValue(entry.value)}</code
													>
												</div>
											{/if}
										</div>
										{#if valuesEqual(entry.value, currentValue)}
											<span
												class="shrink-0 rounded-full bg-field px-2 py-1 text-[10px] font-semibold text-ink-3"
												>現在</span
											>
										{:else}
											<Button
												aria-label={`${entry.revision.id.slice(0, 7)} から ${entry.value === undefined ? unsetActionLabel : `${label}を復元`}`}
												class="shrink-0 rounded border border-accent bg-accent-soft px-2 py-1 text-[10px] font-semibold text-accent hover:bg-accent-soft"
												onclick={() => onRestore(entry.value)}
											>
												{entry.value === undefined ? unsetActionLabel : '復元'}
											</Button>
										{/if}
									</div>
									{#if entry.kind === 'oldest-loaded' && hasNext}
										<p class="mt-1 text-[10px] font-medium text-ink-3">
											現在読み込んでいる中で最も古い値
										</p>
									{/if}
								{/if}

								<div class="mt-2 flex min-w-0 items-center gap-1.5 text-[10px] text-ink-3">
									{#if entry.revision.avatarUrl}
										<img
											class="h-4 w-4 shrink-0 rounded-full"
											src={entry.revision.avatarUrl}
											alt=""
											loading="lazy"
										/>
									{/if}
									<span class="shrink-0 font-medium text-ink-2">{entry.revision.authorName}</span>
									<span aria-hidden="true">·</span>
									<time class="shrink-0" datetime={entry.revision.authoredAt}
										>{formatDate(entry.revision.authoredAt)}</time
									>
								</div>
								<div class="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-ink-3">
									<span class="min-w-0 flex-1 truncate" title={firstLine(entry.revision.message)}
										>{firstLine(entry.revision.message)}</span
									>
									{#if entry.revision.htmlUrl}
										<a
											class="shrink-0 font-mono text-accent hover:underline"
											href={entry.revision.htmlUrl}
											target="_blank"
											rel="noreferrer"
											aria-label={`リビジョン ${entry.revision.id.slice(0, 7)} を開く`}
											>{entry.revision.id.slice(0, 7)}</a
										>
									{:else}
										<code class="shrink-0">{entry.revision.id.slice(0, 7)}</code>
									{/if}
								</div>
							</li>
						{/each}
					</ol>
				{:else if !loading && !error}
					<div class="px-5 py-8 text-center">
						<p class="text-[11px] font-semibold text-ink-2">プロパティ履歴はありません</p>
						<p class="mt-1 text-xs text-ink-3">
							このスタイルファイルのコミットは見つかりませんでした。
						</p>
					</div>
				{:else if loading}
					<div class="space-y-3 px-4 py-5" aria-hidden="true">
						<div class="h-3 w-2/3 animate-pulse rounded bg-field"></div>
						<div class="h-3 w-5/6 animate-pulse rounded bg-field"></div>
						<div class="h-3 w-1/2 animate-pulse rounded bg-field"></div>
					</div>
				{/if}
			</div>

			{#if error || hasNext || (loading && revisionValues.length > 0)}
				<footer class="border-t border-hairline-soft bg-field px-4 py-2.5">
					{#if error}
						<div class="flex items-center justify-between gap-3">
							<p class="min-w-0 flex-1 truncate text-xs text-ink-2" title={error}>{error}</p>
							<Button
								class="shrink-0 rounded px-2 py-1 text-xs font-semibold text-ink-2 hover:bg-field"
								onclick={() =>
									void loadPage(
										revisionValues.length === 0 ? 1 : nextPage,
										revisionValues.length === 0
									)}
							>
								再試行
							</Button>
						</div>
					{:else if hasNext}
						<Button
							class="w-full rounded border border-hairline-soft bg-white px-3 py-1.5 text-xs font-semibold text-ink-2 hover:border-hairline hover:bg-field disabled:cursor-wait disabled:opacity-60"
							disabled={loading}
							onclick={() => void loadPage(nextPage, false)}
						>
							{loading ? `読込中 ${loadedCount}/${totalCount}…` : 'さらに読み込む'}
						</Button>
					{/if}
				</footer>
			{/if}
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
