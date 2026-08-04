<script lang="ts">
	import { DotsSixVertical, Plus, X } from 'phosphor-svelte';
	import { onDestroy } from 'svelte';

	import { Button } from '#lib/components/common/Button';
	import { useExpressionSuggestions } from '#lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	import FilterConditionRow from './FilterConditionRow.svelte';
	import FilterGroupRow from './FilterGroupRow.svelte';
	import FilterRawRow from './FilterRawRow.svelte';
	import type { FilterGroupNode, FilterNode } from './model.ts';

	let {
		node,
		root = false,
		depth = 0,
		onChange,
		onRemove
	}: {
		node: FilterGroupNode;
		root?: boolean;
		depth?: number;
		onChange: (node: FilterGroupNode, commit?: boolean) => void;
		onRemove?: (commit?: boolean) => void;
	} = $props();

	const getSuggestions = useExpressionSuggestions();
	const suggestions = $derived(getSuggestions());
	const defaultCondition = (): FilterNode => ({
		kind: 'comparison',
		op: '==',
		subject: { kind: 'property', key: suggestions?.propertyKeys[0]?.name ?? '' },
		value: ''
	});
	let draggedIndex = $state<number | null>(null);
	let dragTargetIndex = $state<number | null>(null);
	let pointerDragCleanup: (() => void) | undefined;

	const updateChild = (index: number, child: FilterNode, commit = true) => {
		onChange(
			{ ...node, children: node.children.map((current, i) => (i === index ? child : current)) },
			commit
		);
	};
	const removeChild = (index: number, commit = true) => {
		const children = node.children.filter((_, i) => i !== index);
		if (children.length === 0 && !root && onRemove) {
			onRemove(commit);
			return;
		}
		onChange({ ...node, children }, commit);
	};
	const moveChild = (from: number, to: number) => {
		if (from === to || from < 0 || to < 0) return;
		const children = [...node.children];
		const [moved] = children.splice(from, 1);
		children.splice(to, 0, moved);
		onChange({ ...node, children });
	};
	const stopPointerDrag = () => {
		pointerDragCleanup?.();
		pointerDragCleanup = undefined;
		draggedIndex = null;
		dragTargetIndex = null;
	};
	const startPointerDrag = (event: PointerEvent, index: number) => {
		if (event.button !== 0) return;
		event.preventDefault();
		stopPointerDrag();
		const target = event.currentTarget;
		if (!(target instanceof HTMLElement)) return;
		const group = target.closest<HTMLElement>('[data-filter-group]');
		if (!group) return;
		draggedIndex = index;
		dragTargetIndex = index;

		const handleMove = (moveEvent: PointerEvent) => {
			const rows = [
				...group.querySelectorAll<HTMLElement>(':scope > [role="list"] > [data-filter-child]')
			];
			if (rows.length === 0) return;
			let closestIndex = 0;
			let closestDistance = Number.POSITIVE_INFINITY;
			for (const [rowIndex, row] of rows.entries()) {
				const rect = row.getBoundingClientRect();
				const distance = Math.abs(moveEvent.clientY - (rect.top + rect.height / 2));
				if (distance >= closestDistance) continue;
				closestDistance = distance;
				closestIndex = rowIndex;
			}
			dragTargetIndex = closestIndex;
		};
		const handleUp = (upEvent: PointerEvent) => {
			handleMove(upEvent);
			const target = dragTargetIndex;
			stopPointerDrag();
			if (target !== null) moveChild(index, target);
		};
		window.addEventListener('pointermove', handleMove);
		window.addEventListener('pointerup', handleUp, { once: true });
		window.addEventListener('pointercancel', stopPointerDrag, { once: true });
		pointerDragCleanup = () => {
			window.removeEventListener('pointermove', handleMove);
			window.removeEventListener('pointerup', handleUp);
			window.removeEventListener('pointercancel', stopPointerDrag);
		};
	};
	const toggleOperator = () => {
		const op: FilterGroupNode['op'] = node.op === 'all' ? 'any' : 'all';
		onChange({ ...node, op }, node.children.length > 0);
	};
	const operatorLabel = $derived(
		node.op === 'all' ? 'かつ' : node.op === 'any' ? 'または' : 'いずれも除外'
	);
	onDestroy(stopPointerDrag);
</script>

<div
	data-filter-group=""
	class={cn(
		'relative min-w-0',
		!root && 'my-1 rounded-[8px] border border-hairline-soft bg-[#fbfbfc] px-2 pt-1.5 pb-1'
	)}
>
	{#if !root}
		<div class="flex min-h-5 items-center px-0.5 pb-0.5 text-[9.5px] text-ink-3">
			<span>グループ ・ {node.children.length} 条件</span>
			{#if onRemove}
				<Button
					aria-label="フィルターグループを削除"
					class="ml-auto flex size-[18px] items-center justify-center text-ink-4 hover:text-ink-2"
					onclick={() => onRemove(node.children.length > 0)}
				>
					<X size={12} weight="regular" aria-hidden="true" />
				</Button>
			{/if}
		</div>
	{/if}

	<div class="relative min-w-0 pl-6">
		<span
			class="absolute top-4 bottom-4 left-1 w-[9px] rounded-l-[7px] border border-r-0 border-[#e3e3e3]"
			aria-hidden="true"
		></span>
		<Button
			aria-label={`条件の結合を${node.op === 'all' ? 'または' : 'かつ'}へ変更`}
			title="クリックで「かつ / または」を切り替え"
			class="absolute top-1/2 left-1 z-10 h-[18px] -translate-x-1/2 -translate-y-1/2 rounded-[9px] border border-[#e3e3e3] bg-white px-[7px] text-[9px] font-normal whitespace-nowrap text-ink-2 hover:text-ink-1 focus-visible:outline-2 focus-visible:outline-accent"
			onclick={toggleOperator}
		>
			{operatorLabel}
		</Button>

		<div class="flex min-w-0 flex-col" role="list">
			{#each node.children as child, index (child)}
				<div
					role="listitem"
					data-filter-child=""
					class={cn(
						'flex min-w-0 items-start py-0.5',
						dragTargetIndex === index && 'bg-accent-soft'
					)}
				>
					<button
						type="button"
						aria-label={`フィルター条件 ${index + 1} を並べ替え`}
						class={cn(
							'mt-1 flex size-5 shrink-0 touch-none items-center justify-center rounded-[5px] text-ink-4 hover:bg-field hover:text-ink-2',
							draggedIndex === index ? 'cursor-grabbing' : 'cursor-grab'
						)}
						onpointerdown={(event) => startPointerDrag(event, index)}
					>
						<DotsSixVertical size={14} weight="regular" aria-hidden="true" />
					</button>
					<div class="min-w-0 flex-1">
						{#if child.kind === 'group'}
							<FilterGroupRow
								node={child}
								depth={depth + 1}
								onChange={(next, commit = true) => updateChild(index, next, commit)}
								onRemove={(commit = true) => removeChild(index, commit)}
							/>
						{:else if child.kind === 'raw'}
							<FilterRawRow
								node={child}
								onChange={(next) => updateChild(index, next)}
								onRemove={() => removeChild(index)}
							/>
						{:else}
							<FilterConditionRow
								node={child}
								onChange={(next) => updateChild(index, next)}
								onRemove={() => removeChild(index)}
							/>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-3 pt-1 pl-6">
		<Button
			class="flex h-5 items-center gap-0.5 px-0 text-[10.5px] font-normal text-ink-3 hover:text-accent"
			onclick={() => onChange({ ...node, children: [...node.children, defaultCondition()] })}
		>
			<Plus size={11} weight="regular" aria-hidden="true" />
			条件
		</Button>
		{#if depth < 2}
			<Button
				class="flex h-5 items-center gap-0.5 px-0 text-[10.5px] font-normal text-ink-3 hover:text-accent"
				onclick={() =>
					onChange(
						{
							...node,
							children: [...node.children, { kind: 'group', op: 'all', children: [] }]
						},
						false
					)}
			>
				<Plus size={11} weight="regular" aria-hidden="true" />
				グループ
			</Button>
		{/if}
	</div>
</div>
