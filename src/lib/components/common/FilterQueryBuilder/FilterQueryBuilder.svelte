<script lang="ts" module>
	import type {
		ExpressionFilterSpecification,
		FilterSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { HTMLAttributes } from 'svelte/elements';

	export type FilterQueryBuilderProps = Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		value?: FilterSpecification;
		onChange?: (value: ExpressionFilterSpecification | undefined) => void;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils/tailwindUtil.ts';

	import FilterGroupRow from './FilterGroupRow.svelte';
	import type { FilterGroupNode, FilterNode } from './model.ts';
	import { parseFilter } from './parse.ts';
	import { serializeFilter } from './serialize.ts';

	let { value, onChange, class: className, ...props }: FilterQueryBuilderProps = $props();

	let tree = $derived(parseFilter(value));

	const compactNode = (node: FilterNode, root = false): FilterNode | undefined => {
		if (node.kind !== 'group') return node;
		const children = node.children
			.map((child) => compactNode(child))
			.filter((child): child is FilterNode => child !== undefined);
		if (!root && children.length === 0) return undefined;
		return { ...node, children };
	};
	const updateTree = (next: FilterGroupNode, commit = true) => {
		tree = next;
		if (!commit) return;
		const compacted = compactNode(next, true) as FilterGroupNode;
		onChange?.(compacted.children.length === 0 ? undefined : serializeFilter(compacted));
	};
</script>

<div {...props} class={cn('flex min-w-0 flex-col gap-1 text-sm', className)}>
	<FilterGroupRow node={tree} root onChange={updateTree} />
</div>
