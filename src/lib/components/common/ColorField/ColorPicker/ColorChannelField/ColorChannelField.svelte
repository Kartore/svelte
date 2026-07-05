<script lang="ts">
	import { NumberFormatter, NumberParser } from '@internationalized/number';

	import {
		clamp,
		normalizeColor,
		parseColor,
		snapValueToStep,
		type Color,
		type ColorChannel,
		type ColorSpace
	} from '$lib/utils/color';
	import { cn } from '$lib/utils/tailwindUtil';

	let {
		class: className,
		label,
		channel,
		colorSpace,
		value,
		onChange
	}: {
		class?: string;
		label?: string;
		/** The color channel that the field manipulates. */
		channel: ColorChannel;
		/** The color space that the field operates in. */
		colorSpace?: ColorSpace;
		/** The current color value. */
		value?: string | Color | null;
		/** Handler that is called when the value changes. */
		onChange?: (color: Color | null) => void;
	} = $props();

	const id = $props.id();
	const locale = 'en-US';

	const black = parseColor('#000');

	const color = $derived.by(() => {
		const nonNullColorValue = value != null ? normalizeColor(value) : black;
		return colorSpace ? nonNullColorValue.toFormat(colorSpace) : nonNullColorValue;
	});

	const range = $derived(color.getChannelRange(channel));
	const formatOptions = $derived(color.getChannelFormatOptions(channel));
	const multiplier = $derived(
		formatOptions.style === 'percent' && range.maxValue === 100 ? 100 : 1
	);

	const numberValue = $derived(value == null ? NaN : color.getChannelValue(channel) / multiplier);
	const minValue = $derived(range.minValue / multiplier);
	const maxValue = $derived(range.maxValue / multiplier);
	const step = $derived(range.step / multiplier);

	const formatter = $derived(new NumberFormatter(locale, formatOptions));
	const parser = $derived(new NumberParser(locale, formatOptions));

	const format = (v: number): string => (Number.isNaN(v) ? '' : formatter.format(v));

	let draft = $state('');
	let focused = $state(false);
	$effect(() => {
		if (!focused) {
			draft = format(numberValue);
		}
	});

	const parse = (text: string): number => {
		let parsed = parser.parse(text);
		if (Number.isNaN(parsed)) {
			// Fallback: parse a bare number (e.g. "50" in a percent field).
			const bare = parseFloat(text.replace(/[^0-9+\-.]/g, ''));
			parsed = formatOptions.style === 'percent' ? bare / 100 : bare;
		}
		return parsed;
	};

	const setNumberValue = (v: number) => {
		if (Number.isNaN(v)) {
			onChange?.(null);
			return;
		}
		const snapped = snapValueToStep(clamp(v, minValue, maxValue), minValue, maxValue, step);
		if (snapped !== numberValue) {
			onChange?.(color.withChannelValue(channel, snapped * multiplier));
		}
	};

	const commit = () => {
		if (draft.trim() === '') {
			setNumberValue(NaN);
			draft = format(numberValue);
			return;
		}
		const parsed = parse(draft);
		if (Number.isNaN(parsed)) {
			draft = format(numberValue);
			return;
		}
		setNumberValue(parsed);
		draft = format(
			Number.isNaN(numberValue)
				? snapValueToStep(clamp(parsed, minValue, maxValue), minValue, maxValue, step)
				: numberValue
		);
	};

	const stepBy = (direction: 1 | -1) => {
		const base = Number.isNaN(numberValue) ? clamp(0, minValue, maxValue) : numberValue;
		const next = snapValueToStep(
			clamp(base + direction * step, minValue, maxValue),
			minValue,
			maxValue,
			step
		);
		if (next !== numberValue) {
			onChange?.(color.withChannelValue(channel, next * multiplier));
		}
	};
</script>

<div class={cn('text-xs', className)}>
	<label class={cn('sr-only font-semibold text-gray-600')} for={id}>
		{label}
	</label>
	<input
		{id}
		type="text"
		inputmode="numeric"
		autocomplete="off"
		autocorrect="off"
		spellcheck="false"
		aria-label={label ?? color.getChannelName(channel)}
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
				commit();
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				stepBy(1);
			} else if (event.key === 'ArrowDown') {
				event.preventDefault();
				stepBy(-1);
			}
		}}
		class={cn(
			'h-full w-full border-none bg-gray-100 px-2 py-1 font-semibold transition-colors hover:bg-gray-200 focus-visible:bg-gray-200 focus-visible:outline-0'
		)}
	/>
</div>
