<script lang="ts">
	import { Button } from '$lib/components/common/Button';
	import { useExpressionSuggestions } from '$lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';
	import { Select } from '$lib/components/common/Select';
	import { CloseIcon } from '$lib/components/icons';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	import FilterConditionRow from './FilterConditionRow.svelte';
	import FilterGroupRow from './FilterGroupRow.svelte';
	import FilterRawRow from './FilterRawRow.svelte';
	import type { FilterGroupNode, FilterNode } from './model.ts';

	let {
		node,
		root = false,
		onChange,
		onRemove
	}: {
		node: FilterGroupNode;
		root?: boolean;
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
</script>

<div class={cn('flex min-w-0 flex-col gap-1', !root && 'ml-2 border-l border-gray-200 pl-2')}>
	<div class="grid grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)_20px] items-center gap-1">
		<div class="col-span-3 flex min-w-0 items-center gap-2">
			<Select
				aria-label="Filter group operator"
				class="w-24 shrink-0 font-mono"
				triggerClass="w-full font-mono font-normal"
				items={[
					{ value: 'all', label: 'all' },
					{ value: 'any', label: 'any' },
					{ value: 'none', label: 'none' }
				]}
				value={node.op}
				onValueChange={(value) =>
					onChange({ ...node, op: value as FilterGroupNode['op'] }, node.children.length > 0)}
			/>
			<span class="truncate text-xs text-gray-400">
				{node.children.length}
				{node.children.length === 1 ? 'rule' : 'rules'}
			</span>
		</div>
		{#if onRemove}
			<Button
				aria-label="Remove filter group"
				class="rounded text-gray-400 hover:text-red-500"
				onclick={() => onRemove(node.children.length > 0)}
			>
				<CloseIcon class="h-4 w-4 fill-current" />
			</Button>
		{/if}
	</div>

	{#each node.children as child, index (child)}
		{#if child.kind === 'group'}
			<FilterGroupRow
				node={child}
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
	{/each}

	<div class="flex flex-wrap items-center gap-1 pl-1">
		<Button
			class="rounded px-1.5 py-0.5 text-xs font-semibold text-gray-400 hover:text-gray-600"
			onclick={() => onChange({ ...node, children: [...node.children, defaultCondition()] })}
		>
			+ Condition
		</Button>
		<Button
			class="rounded px-1.5 py-0.5 text-xs font-semibold text-gray-400 hover:text-gray-600"
			onclick={() =>
				onChange(
					{
						...node,
						children: [...node.children, { kind: 'group', op: 'all', children: [] }]
					},
					false
				)}
		>
			+ Group
		</Button>
		<Button
			class="rounded px-1.5 py-0.5 text-xs font-semibold text-gray-400 hover:text-gray-600"
			onclick={() =>
				onChange(
					{
						...node,
						children: [...node.children, { kind: 'raw', expression: ['==', ['get', ''], ''] }]
					},
					false
				)}
		>
			+ Expression
		</Button>
	</div>
</div>
