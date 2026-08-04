<script lang="ts">
	import { latest } from '@maplibre/maplibre-gl-style-spec';

	import { Button } from '#lib/components/common/Button';
	import { NumberArrayInnerField } from '#lib/components/common/NumberArrayField/NumberArrayInnerField';
	import { Select } from '#lib/components/common/Select';
	import { CloseIcon } from '#lib/components/icons';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label = '値',
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
		<div
			class={cn('flex min-h-[30px] min-w-0 flex-row items-center', compact && 'justify-end')}
			style="column-gap: var(--field-column-gap, 8px)"
		>
			{#if !compact}
				<span
					class="shrink-0 truncate font-mono text-[10px] font-normal text-ink-2"
					style="width: var(--field-label-width, auto)"
					title={label}>{label}</span
				>
			{/if}
			{#if nextAnchor !== undefined}
				<Button
					aria-label={`${label}を追加`}
					class="h-6 min-w-24 flex-1 rounded-[5px] bg-field px-2 font-mono text-[11px] font-normal text-ink-1 hover:bg-field"
					onclick={() => commit([...pairs, { anchor: nextAnchor, offset: [0, 0] }])}
				>
					＋ 追加
				</Button>
			{/if}
		</div>
	{/if}
	{#each pairs as pair, index (index)}
		<div class="flex min-w-0 flex-row items-center gap-1">
			<Select
				class="min-w-0 flex-1"
				triggerClass="w-full"
				aria-label={`${label}のアンカー ${index + 1}`}
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
				aria-label={`${label} ${index + 1} を削除`}
				class="rounded p-0.5 text-ink-3 hover:text-ink-2"
				onclick={() => commit(pairs.filter((_, currentIndex) => currentIndex !== index))}
			>
				<CloseIcon class="w-4 fill-current" />
			</Button>
		</div>
	{/each}
</div>
