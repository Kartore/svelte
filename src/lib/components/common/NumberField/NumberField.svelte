<script lang="ts">
	import {
		NumberFormatter,
		NumberParser,
		type NumberFormatOptions
	} from '@internationalized/number';

	import { Button } from '$lib/components/common/Button';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		label,
		value,
		onValueChange,
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

	let draft = $state('');
	let focused = $state(false);
	$effect(() => {
		if (!focused) {
			draft = format(value);
		}
	});

	const clamp = (numberValue: number): number => {
		let result = numberValue;
		if (minValue !== undefined) result = Math.max(result, minValue);
		if (maxValue !== undefined) result = Math.min(result, maxValue);
		return result;
	};

	const commit = () => {
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
		if (next !== value) {
			onValueChange?.(next);
		}
	};

	const stepBy = (direction: 1 | -1) => {
		const base = value ?? clamp(0);
		const next = clamp(base + direction * (step ?? 1));
		if (next !== value) {
			onValueChange?.(next);
		}
	};
</script>

<div class={cn('flex flex-row items-center justify-between', className)}>
	{#if label}
		<label for={id} class="text-sm font-semibold text-gray-600">{label}</label>
	{/if}
	<div class="w-1/2">
		<input
			{id}
			type="text"
			inputmode="decimal"
			autocomplete="off"
			aria-label={label ? undefined : ariaLabel}
			{disabled}
			bind:value={draft}
			onfocus={() => {
				focused = true;
			}}
			onblur={() => {
				focused = false;
				commit();
			}}
			onkeydown={(event) => {
				if (event.key === 'Enter') {
					event.currentTarget.blur();
				} else if (event.key === 'ArrowUp') {
					event.preventDefault();
					stepBy(1);
				} else if (event.key === 'ArrowDown') {
					event.preventDefault();
					stepBy(-1);
				}
			}}
			class="w-full rounded border-none bg-gray-100 px-2 py-1 text-sm font-semibold transition-colors hover:bg-gray-200 focus-visible:bg-gray-200 focus-visible:outline-0"
		/>
		{#if showButton}
			<Button aria-label="Decrement" onclick={() => stepBy(-1)}>-</Button>
			<Button aria-label="Increment" onclick={() => stepBy(1)}>+</Button>
		{/if}
	</div>
	{#if description}
		<div class="text-xs">{description}</div>
	{/if}
</div>
