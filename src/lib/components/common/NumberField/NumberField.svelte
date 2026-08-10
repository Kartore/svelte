<script lang="ts">
	import {
		NumberFormatter,
		NumberParser,
		type NumberFormatOptions
	} from '@internationalized/number';
	import { Minus, Plus } from 'phosphor-svelte';
	import { onDestroy } from 'svelte';

	import { Button } from '#lib/components/common/Button';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label,
		value,
		onValueChange,
		onTransientValueChange,
		onValueCommit,
		onTransientCancel,
		minValue,
		maxValue,
		step,
		formatOptions,
		showButton,
		description,
		disabled,
		'aria-label': ariaLabel
	}: {
		class?: string;
		label?: string;
		value?: number;
		onValueChange?: (value: number) => void;
		/** Scrub 中の live 値。履歴を積まない更新へ接続する。 */
		onTransientValueChange?: (value: number) => void;
		/** Enter / blur / Arrow / scrub 終了時の確定値。 */
		onValueCommit?: (value: number) => void;
		onTransientCancel?: () => void;
		minValue?: number;
		maxValue?: number;
		step?: number;
		formatOptions?: NumberFormatOptions;
		showButton?: boolean;
		description?: string;
		disabled?: boolean;
		'aria-label'?: string;
	} = $props();

	const id = $props.id();
	const locale = 'en-US';
	const formatter = $derived(new NumberFormatter(locale, formatOptions));
	const parser = $derived(new NumberParser(locale, formatOptions));

	const format = (numberValue: number | undefined): string =>
		numberValue === undefined || Number.isNaN(numberValue) ? '' : formatter.format(numberValue);
	const clamp = (numberValue: number): number => {
		let result = numberValue;
		if (minValue !== undefined) result = Math.max(result, minValue);
		if (maxValue !== undefined) result = Math.min(result, maxValue);
		return result;
	};
	const normalizeSteppedValue = (numberValue: number): number =>
		clamp(Number(numberValue.toFixed(12)));
	const emitCommit = (next: number) => {
		(onValueCommit ?? onValueChange)?.(next);
	};

	let draft = $derived(format(value));
	let scrub = $state<{
		startX: number;
		startValue: number;
		lastValue: number;
		moved: boolean;
	} | null>(null);

	const commitDraft = () => {
		if (draft.trim() === '') {
			draft = format(value);
			return;
		}
		const parsed = parser.parse(draft);
		if (Number.isNaN(parsed)) {
			draft = format(value);
			return;
		}
		const next = clamp(parsed);
		draft = format(next);
		if (next !== value) emitCommit(next);
	};

	const stepBy = (direction: 1 | -1, large = false) => {
		const base = value ?? clamp(0);
		const next = normalizeSteppedValue(base + direction * (step ?? 1) * (large ? 10 : 1));
		draft = format(next);
		if (next !== value) emitCommit(next);
	};

	const resetScrubListeners = () => {
		document.removeEventListener('pointermove', handleScrubMove);
		document.removeEventListener('pointerup', handleScrubEnd);
		document.removeEventListener('pointercancel', handleScrubCancel);
		document.removeEventListener('keydown', handleScrubKeyDown);
		document.body.style.removeProperty('cursor');
		document.body.style.removeProperty('user-select');
	};

	const finishScrub = (cancelled: boolean) => {
		const current = scrub;
		scrub = null;
		resetScrubListeners();
		if (!current?.moved) return;
		if (cancelled) {
			draft = format(value);
			onTransientCancel?.();
		} else {
			emitCommit(current.lastValue);
		}
	};

	const handleScrubMove = (event: PointerEvent) => {
		if (!scrub) return;
		event.preventDefault();
		const pixelsPerStep = 2;
		const multiplier = event.shiftKey ? 10 : 1;
		const delta =
			Math.round((event.clientX - scrub.startX) / pixelsPerStep) * (step ?? 1) * multiplier;
		const next = normalizeSteppedValue(scrub.startValue + delta);
		if (next === scrub.lastValue) return;
		scrub.lastValue = next;
		scrub.moved = true;
		draft = format(next);
		(onTransientValueChange ?? onValueChange)?.(next);
	};

	const handleScrubEnd = () => finishScrub(false);
	const handleScrubCancel = () => finishScrub(true);
	const handleScrubKeyDown = (event: KeyboardEvent) => {
		if (event.key !== 'Escape') return;
		event.preventDefault();
		finishScrub(true);
	};

	const beginScrub = (event: PointerEvent) => {
		if (disabled || event.button !== 0) return;
		event.preventDefault();
		const initial = value ?? clamp(0);
		scrub = {
			startX: event.clientX,
			startValue: initial,
			lastValue: initial,
			moved: false
		};
		document.addEventListener('pointermove', handleScrubMove);
		document.addEventListener('pointerup', handleScrubEnd);
		document.addEventListener('pointercancel', handleScrubCancel);
		document.addEventListener('keydown', handleScrubKeyDown);
		document.body.style.setProperty('cursor', 'ew-resize');
		document.body.style.setProperty('user-select', 'none');
	};

	onDestroy(resetScrubListeners);
</script>

<div
	class={cn('flex h-[30px] min-w-0 flex-row items-center', className)}
	style="column-gap: var(--field-column-gap, 0px)"
>
	{#if label}
		<button
			type="button"
			class="min-w-0 shrink-0 cursor-ew-resize truncate rounded-[5px] text-left font-mono text-[10px] font-normal text-ink-2 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default disabled:text-ink-4"
			style="width: var(--field-label-width, 84px)"
			aria-label={`${label} を調整`}
			title={`${label} — 左右にドラッグして調整。Shift で大きく変更`}
			{disabled}
			onpointerdown={beginScrub}
			onkeydown={(event) => {
				if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
					event.preventDefault();
					stepBy(1, event.shiftKey);
				} else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
					event.preventDefault();
					stepBy(-1, event.shiftKey);
				}
			}}
		>
			{label}
		</button>
	{/if}
	<div
		class="flex h-6 min-w-0 flex-1 flex-row items-center rounded-[5px] bg-[var(--expression-control-background,var(--color-field))] focus-within:shadow-[inset_0_0_0_1px_var(--color-accent)]"
	>
		<input
			{id}
			type="text"
			inputmode="decimal"
			autocomplete="off"
			aria-label={label ?? ariaLabel}
			{disabled}
			bind:value={draft}
			onblur={commitDraft}
			onkeydown={(event) => {
				if (event.key === 'Enter') {
					event.currentTarget.blur();
				} else if (event.key === 'ArrowUp') {
					event.preventDefault();
					stepBy(1, event.shiftKey);
				} else if (event.key === 'ArrowDown') {
					event.preventDefault();
					stepBy(-1, event.shiftKey);
				} else if (event.key === 'Escape') {
					draft = format(value);
					event.currentTarget.blur();
				}
			}}
			class="h-full w-full min-w-0 flex-1 border-none bg-transparent px-2 font-mono text-[11px] font-normal text-ink-1 focus-visible:outline-0 disabled:text-ink-4"
		/>
		{#if description}
			<span
				class="max-w-16 truncate pr-2 text-[10px] font-normal text-ink-3 select-none"
				title={description}
			>
				{description}
			</span>
		{/if}
		{#if showButton}
			<Button
				class="flex size-6 items-center justify-center text-ink-2 hover:bg-white"
				aria-label="減らす"
				onclick={() => stepBy(-1)}
			>
				<Minus size={14} weight="regular" aria-hidden="true" />
			</Button>
			<Button
				class="flex size-6 items-center justify-center text-ink-2 hover:bg-white"
				aria-label="増やす"
				onclick={() => stepBy(1)}
			>
				<Plus size={14} weight="regular" aria-hidden="true" />
			</Button>
		{/if}
	</div>
</div>
