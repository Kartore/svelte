<script lang="ts">
	import { latest } from '@maplibre/maplibre-gl-style-spec';

	import { Button } from '$lib/components/common/Button';
	import { NumberArrayInnerField } from '$lib/components/common/NumberArrayField/NumberArrayInnerField';
	import { Select } from '$lib/components/common/Select';
	import { CloseIcon } from '$lib/components/icons';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label = 'Value',
		compact = false,
		value,
		onChange
	}: {
		class?: string;
		label?: string;
		compact?: boolean;
		value?: unknown;
		onChange?: (value: (string | [number, number])[] | undefined) => void;
	} = $props();

	type AnchorOffsetPair = { anchor: string; offset: [number, number] };

	// アンカー候補は text-variable-anchor の enum と同一 (spec に values が無いため参照する)
	const anchors = Object.keys(
		(latest.layout_symbol['text-variable-anchor'] as { values?: Record<string, unknown> }).values ??
			{}
	);

	// [anchor, [x, y], anchor, [x, y], ...] の交互配列をペアの列に分解する
	const parsePairs = (raw: unknown): AnchorOffsetPair[] => {
		if (!Array.isArray(raw)) return [];
		const pairs: AnchorOffsetPair[] = [];
		for (let index = 0; index + 1 < raw.length; index += 2) {
			const anchor = raw[index];
			const offset = raw[index + 1];
			if (
				typeof anchor !== 'string' ||
				!Array.isArray(offset) ||
				offset.length !== 2 ||
				!offset.every((item) => typeof item === 'number')
			) {
				return [];
			}
			pairs.push({ anchor, offset: [offset[0], offset[1]] });
		}
		return pairs;
	};

	const pairs = $derived(parsePairs(value));
	const usedAnchors = $derived(new Set(pairs.map((pair) => pair.anchor)));
	const nextAnchor = $derived(anchors.find((anchor) => !usedAnchors.has(anchor)));

	const commit = (nextPairs: AnchorOffsetPair[]) => {
		onChange?.(
			nextPairs.length === 0
				? undefined
				: nextPairs.flatMap<string | [number, number]>((pair) => [pair.anchor, pair.offset])
		);
	};

	const replacePair = (index: number, pair: AnchorOffsetPair) => {
		commit(pairs.map((current, currentIndex) => (currentIndex === index ? pair : current)));
	};

	const replaceOffset = (index: number, axis: 0 | 1, axisValue: number) => {
		const pair = pairs[index];
		const offset: [number, number] = [...pair.offset];
		offset[axis] = axisValue;
		replacePair(index, { ...pair, offset });
	};
</script>

<div class={cn('flex min-w-0 flex-col gap-1', className)}>
	{#if !compact || nextAnchor !== undefined}
		<div class={cn('flex flex-row items-center justify-between', compact && 'justify-end')}>
			{#if !compact}
				<span class="text-sm font-semibold text-gray-600">{label}</span>
			{/if}
			{#if nextAnchor !== undefined}
				<Button
					aria-label={`Add ${label} entry`}
					class="rounded bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-200"
					onclick={() => commit([...pairs, { anchor: nextAnchor, offset: [0, 0] }])}
				>
					+ Add
				</Button>
			{/if}
		</div>
	{/if}
	{#each pairs as pair, index (index)}
		<div class="flex min-w-0 flex-row items-center gap-1">
			<Select
				class="min-w-0 flex-1"
				triggerClass="w-full"
				aria-label={`${label} anchor ${index + 1}`}
				items={anchors.map((anchor) => ({
					value: anchor,
					label: anchor,
					disabled: anchor !== pair.anchor && usedAnchors.has(anchor)
				}))}
				value={pair.anchor}
				onValueChange={(anchor) => replacePair(index, { ...pair, anchor })}
			/>
			<div class="flex w-2/5 shrink-0 flex-row gap-1">
				<NumberArrayInnerField
					label="X"
					value={pair.offset[0]}
					onValueChange={(axisValue) => replaceOffset(index, 0, axisValue)}
				/>
				<NumberArrayInnerField
					label="Y"
					value={pair.offset[1]}
					onValueChange={(axisValue) => replaceOffset(index, 1, axisValue)}
				/>
			</div>
			<Button
				aria-label={`Remove ${label} entry ${index + 1}`}
				class="rounded p-0.5 text-gray-400 hover:text-red-500"
				onclick={() => commit(pairs.filter((_, currentIndex) => currentIndex !== index))}
			>
				<CloseIcon class="w-4 fill-current" />
			</Button>
		</div>
	{/each}
</div>
