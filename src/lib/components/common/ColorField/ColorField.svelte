<script lang="ts">
	import { NumberFormatter, NumberParser } from '@internationalized/number';

	import { ColorPicker } from '$lib/components/common/ColorField/ColorPicker';
	import { clamp, parseColor, snapValueToStep, type Color } from '$lib/utils/color';
	import { cn } from '$lib/utils/tailwindUtil';

	let {
		class: className,
		label,
		value,
		onChange,
		description
	}: {
		class?: string;
		label?: string;
		value?: string | Color;
		onChange?: (color: Color | null) => void;
		description?: string;
	} = $props();

	const id = $props.id();
	const locale = 'en-US';

	const colorValue = $derived.by(() => {
		if (value == null) {
			return null;
		}
		if (typeof value !== 'string') {
			return value;
		}
		try {
			return parseColor(value);
		} catch {
			return null;
		}
	});

	// --- Hex input (ported from @react-stately/color useColorFieldState) ---

	const MIN_COLOR = parseColor('#000000');
	const MAX_COLOR = parseColor('#FFFFFF');
	const MIN_COLOR_INT = MIN_COLOR.toHexInt();
	const MAX_COLOR_INT = MAX_COLOR.toHexInt();
	const step = MIN_COLOR.getChannelRange('red').step;

	let inputValue = $derived(colorValue ? colorValue.toString('hex') : '');

	const validate = (v: string) => v === '' || !!v.match(/^#?[0-9a-f]{0,6}$/i)?.[0];

	const parsedValue = $derived.by(() => {
		try {
			return parseColor(inputValue.startsWith('#') ? inputValue : `#${inputValue}`);
		} catch {
			return null;
		}
	});

	const safelySetColorValue = (newColor: Color | null) => {
		if (!colorValue || !newColor) {
			onChange?.(newColor);
			return;
		}
		if (newColor.toHexInt() !== colorValue.toHexInt()) {
			onChange?.(newColor);
			return;
		}
	};

	const commit = () => {
		// Set to empty state if input value is empty
		if (!inputValue.length) {
			safelySetColorValue(null);
			if (value === undefined || colorValue === null) {
				inputValue = '';
			} else {
				inputValue = colorValue.toString('hex');
			}
			return;
		}

		// if it failed to parse, then reset input to formatted version of current color
		if (parsedValue == null) {
			inputValue = colorValue ? colorValue.toString('hex') : '';
			return;
		}

		safelySetColorValue(parsedValue);
		inputValue = (parsedValue ?? colorValue)?.toString('hex') ?? '';
	};

	const addColorValue = (color: Color | null, amount: number) => {
		let newColor = color ? color : MIN_COLOR;
		const colorInt = newColor.toHexInt();

		const clampInt = Math.min(Math.max(colorInt + amount, MIN_COLOR_INT), MAX_COLOR_INT);
		if (clampInt !== colorInt) {
			const newColorString = `#${clampInt.toString(16).padStart(6, '0').toUpperCase()}`;
			newColor = parseColor(newColorString);
		}
		return newColor;
	};

	const increment = () => {
		const newValue = addColorValue(parsedValue, step);
		safelySetColorValue(newValue);
		inputValue = newValue.toString('hex');
	};
	const decrement = () => {
		const newValue = addColorValue(parsedValue, -step);
		safelySetColorValue(newValue);
		inputValue = newValue.toString('hex');
	};
	const incrementToMax = () => {
		safelySetColorValue(MAX_COLOR);
		inputValue = MAX_COLOR.toString('hex');
	};
	const decrementToMin = () => {
		safelySetColorValue(MIN_COLOR);
		inputValue = MIN_COLOR.toString('hex');
	};

	// --- Alpha channel input (ported from @react-stately/color useColorChannelFieldState) ---

	const alphaRange = $derived((colorValue ?? MIN_COLOR).getChannelRange('alpha'));
	const alphaValue = $derived(colorValue ? colorValue.getChannelValue('alpha') : NaN);
	const alphaFormatter = new NumberFormatter(locale, { style: 'percent' });
	const alphaParser = new NumberParser(locale, { style: 'percent' });

	let alphaInputValue = $derived(Number.isNaN(alphaValue) ? '' : alphaFormatter.format(alphaValue));

	const commitAlpha = () => {
		if (!colorValue) {
			alphaInputValue = '';
			return;
		}
		let parsed = alphaParser.parse(alphaInputValue);
		if (Number.isNaN(parsed)) {
			const bare = parseFloat(alphaInputValue.replace(/[^0-9+\-.]/g, ''));
			parsed = bare / 100;
		}
		if (Number.isNaN(parsed)) {
			alphaInputValue = alphaFormatter.format(alphaValue);
			return;
		}
		const next = snapValueToStep(
			clamp(parsed, alphaRange.minValue, alphaRange.maxValue),
			alphaRange.minValue,
			alphaRange.maxValue,
			alphaRange.step
		);
		alphaInputValue = alphaFormatter.format(next);
		if (next !== alphaValue) {
			onChange?.(colorValue.withChannelValue('alpha', next));
		}
	};

	const stepAlphaBy = (direction: 1 | -1) => {
		if (!colorValue) {
			return;
		}
		const base = Number.isNaN(alphaValue) ? 0 : alphaValue;
		const next = snapValueToStep(
			clamp(base + direction * alphaRange.step, alphaRange.minValue, alphaRange.maxValue),
			alphaRange.minValue,
			alphaRange.maxValue,
			alphaRange.step
		);
		if (next !== alphaValue) {
			onChange?.(colorValue.withChannelValue('alpha', next));
		}
	};
</script>

<div class={cn('flex flex-row items-center justify-between', className)}>
	{#if label}
		<label for={`${id}-input`} class={cn('text-sm font-semibold text-gray-600')}>
			{label}
		</label>
	{/if}
	<div
		class="flex w-1/2 flex-row items-center gap-2 rounded border-none bg-gray-100 px-2 py-1 text-sm font-semibold transition-colors hover:bg-gray-200 focus-visible:bg-gray-200 focus-visible:outline-0"
	>
		<ColorPicker
			value={colorValue ?? undefined}
			aria-label={label ?? 'Color'}
			onChange={(color) => onChange?.(color)}
		/>
		<input
			id={`${id}-input`}
			type="text"
			autocomplete="off"
			autocorrect="off"
			spellcheck="false"
			aria-label={label ? undefined : 'Color'}
			value={inputValue}
			oninput={(e) => {
				const v = e.currentTarget.value;
				if (validate(v)) {
					inputValue = v;
				} else {
					e.currentTarget.value = inputValue;
				}
			}}
			onblur={commit}
			onkeydown={(event) => {
				if (event.key === 'Enter') {
					commit();
				} else if (event.key === 'ArrowUp') {
					event.preventDefault();
					increment();
				} else if (event.key === 'ArrowDown') {
					event.preventDefault();
					decrement();
				} else if (event.key === 'Home') {
					event.preventDefault();
					decrementToMin();
				} else if (event.key === 'End') {
					event.preventDefault();
					incrementToMax();
				}
			}}
			class={cn('min-w-10 flex-2 border-none focus-visible:outline-0')}
		/>
		<input
			type="text"
			inputmode="numeric"
			autocomplete="off"
			autocorrect="off"
			spellcheck="false"
			aria-label="Alpha"
			bind:value={alphaInputValue}
			onblur={commitAlpha}
			onkeydown={(event) => {
				if (event.key === 'Enter') {
					commitAlpha();
				} else if (event.key === 'ArrowUp') {
					event.preventDefault();
					stepAlphaBy(1);
				} else if (event.key === 'ArrowDown') {
					event.preventDefault();
					stepAlphaBy(-1);
				}
			}}
			class={cn('min-w-8 flex-1 border-none focus-visible:outline-0')}
		/>
	</div>
	{#if description}
		<div class={cn('text-xs')}>
			{description}
		</div>
	{/if}
</div>
