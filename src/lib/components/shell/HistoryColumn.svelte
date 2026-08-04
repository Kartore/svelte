<script lang="ts">
	import { X } from 'phosphor-svelte';
	import { onMount } from 'svelte';

	import { Button } from '#lib/components/common/Button';
	import { TextField } from '#lib/components/common/TextField';
	import type {
		EditorPreview,
		StyleHistoryProvider,
		StyleHistoryRevision
	} from '#lib/editor/EditorModule.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		provider,
		onSetPreview,
		onRevert
	}: {
		provider: StyleHistoryProvider;
		onSetPreview: (preview: EditorPreview | null) => void;
		onRevert: (style: Awaited<ReturnType<StyleHistoryProvider['loadStyleAtRevision']>>) => void;
	} = $props();

	let search = $state('');
	let revisions = $state<StyleHistoryRevision[]>([]);
	let page = $state(0);
	let hasNext = $state(false);
	let loading = $state(false);
	let actionRevisionId = $state<string>();
	let selectedRevisionId = $state<string>();
	let error = $state<string>();

	const firstLine = (message: string): string => message.split(/\r?\n/, 1)[0] || '(メッセージなし)';
	const filteredRevisions = $derived(
		revisions.filter((revision) =>
			`${firstLine(revision.message)} ${revision.authorName}`
				.toLocaleLowerCase()
				.includes(search.trim().toLocaleLowerCase())
		)
	);
	const dateLabel = (authoredAt: string): string => {
		const date = new Date(authoredAt);
		const today = new Date();
		const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
		const dayKey = (value: Date): string =>
			`${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
		if (dayKey(date) === dayKey(today)) return '今日';
		if (dayKey(date) === dayKey(yesterday)) return '昨日';
		return new Intl.DateTimeFormat('ja-JP', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(date);
	};
	const timeLabel = (authoredAt: string): string =>
		new Intl.DateTimeFormat('ja-JP', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(authoredAt));
	const groupedRevisions = $derived.by(() => {
		const groups: { date: string; items: StyleHistoryRevision[] }[] = [];
		for (const revision of filteredRevisions) {
			const key = dateLabel(revision.authoredAt);
			const group = groups.find(({ date }) => date === key);
			if (group) group.items.push(revision);
			else groups.push({ date: key, items: [revision] });
		}
		return groups;
	});

	const loadPage = async (nextPage: number, replace = false) => {
		if (loading) return;
		loading = true;
		error = undefined;
		try {
			const result = await provider.listRevisions({ page: nextPage, perPage: 30 });
			revisions = replace ? result.revisions : [...revisions, ...result.revisions];
			page = nextPage;
			hasNext = result.hasNext;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : String(cause);
		} finally {
			loading = false;
		}
	};
	const showRevision = async (revision: StyleHistoryRevision) => {
		if (actionRevisionId) return;
		actionRevisionId = revision.id;
		error = undefined;
		try {
			const style = await provider.loadStyleAtRevision(revision.id);
			onSetPreview({ style, label: firstLine(revision.message) });
			selectedRevisionId = revision.id;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : String(cause);
		} finally {
			actionRevisionId = undefined;
		}
	};
	const revertRevision = async (revision: StyleHistoryRevision) => {
		if (actionRevisionId) return;
		actionRevisionId = revision.id;
		error = undefined;
		try {
			const style = await provider.loadStyleAtRevision(revision.id);
			onSetPreview(null);
			onRevert(style);
			selectedRevisionId = revision.id;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : String(cause);
		} finally {
			actionRevisionId = undefined;
		}
	};

	onMount(() => {
		void loadPage(1, true);
	});
</script>

<aside class="flex w-60 shrink-0 flex-col border-r border-hairline bg-white">
	<header class="flex h-10 shrink-0 items-center gap-1.5 px-3">
		<h2 class="text-[12px] font-semibold text-ink-1">履歴</h2>
		<p class="min-w-0 truncate font-mono text-[10.5px] text-ink-3">
			{provider.label ?? '未接続'}
		</p>
	</header>

	<div class="shrink-0 px-3 pb-1.5">
		<div class="relative">
			<TextField
				class="w-full [&>input]:h-[26px] [&>input]:w-full [&>input]:rounded-[6px] [&>input]:pr-7 [&>input]:text-[11px] [&>input]:font-normal"
				aria-label="履歴を検索"
				placeholder="検索"
				value={search}
				onValueChange={(value) => (search = value)}
			/>
			{#if search}
				<Button
					class="absolute top-0 right-0 flex size-6 items-center justify-center text-ink-3 hover:text-ink-1"
					aria-label="履歴検索をクリア"
					onclick={() => (search = '')}
				>
					<X size={14} weight="regular" aria-hidden="true" />
				</Button>
			{/if}
		</div>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto">
		{#if loading && revisions.length === 0}
			<p class="px-3 py-6 text-center text-[11px] text-ink-3">履歴を取得中…</p>
		{:else if groupedRevisions.length === 0}
			<p class="px-3 py-6 text-center text-[11px] text-ink-3">履歴はありません。</p>
		{/if}
		{#each groupedRevisions as group (group.date)}
			<p class="px-3 pt-2 pb-0.5 text-[10px] font-normal text-ink-3">
				{group.date}
			</p>
			{#each group.items as revision (revision.id)}
				{@const selected = selectedRevisionId === revision.id}
				<button
					type="button"
					class={cn(
						'w-full border-l-2 px-3 py-[5px] text-left outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]',
						selected
							? 'border-accent bg-accent-soft text-ink-1'
							: 'border-transparent text-ink-2 hover:bg-field'
					)}
					onclick={() => (selectedRevisionId = selected ? undefined : revision.id)}
				>
					<span class="block truncate text-[11.5px] text-ink-1">
						{firstLine(revision.message)}
					</span>
					<span class="mt-px block truncate font-mono text-[9.5px] text-ink-3">
						{revision.id.slice(0, 7)} ・ {timeLabel(revision.authoredAt)} ・ {revision.authorName}
					</span>
				</button>
				{#if selected}
					<div class="border-l-2 border-accent bg-accent-soft px-3 pb-2 text-[10px]">
						<div class="flex gap-3 font-semibold text-accent">
							<Button
								class="h-5 px-0 text-[10px] hover:bg-transparent disabled:text-ink-4"
								disabled={actionRevisionId !== undefined}
								onclick={() => showRevision(revision)}
							>
								この時点を表示
							</Button>
							<Button
								class="h-5 px-0 text-[10px] hover:bg-transparent disabled:text-ink-4"
								disabled={actionRevisionId !== undefined}
								onclick={() => revertRevision(revision)}
							>
								戻す
							</Button>
						</div>
					</div>
				{/if}
			{/each}
		{/each}
		{#if hasNext && search === ''}
			<div class="p-2">
				<Button
					class="h-6 w-full rounded-[6px] bg-field text-[10px] text-ink-2 hover:text-ink-1 disabled:text-ink-4"
					disabled={loading}
					onclick={() => loadPage(page + 1)}
				>
					{loading ? '取得中…' : 'さらに読み込む'}
				</Button>
			</div>
		{/if}
		{#if error}
			<p class="px-3 py-2 text-[10px] text-ink-2" role="alert">{error}</p>
		{/if}
	</div>

	<footer
		class="flex h-8 shrink-0 items-center justify-between border-t border-hairline-soft px-3 font-mono text-[10px] text-ink-3"
	>
		<span>{revisions.length} 件</span>
		<span>⌘6</span>
	</footer>
</aside>
