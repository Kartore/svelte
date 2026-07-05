<script lang="ts">
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
		label,
		channel,
		value,
		defaultValue,
		colorSpace,
		onChange,
		onChangeEnd,
		isDisabled,
		'aria-label': ariaLabel
	}: {
		/** The label for the slider. Defaults to the channel name. */
		label?: string;
		/** The color channel that the slider manipulates. */
		channel: ColorChannel;
		/** The current color value (controlled). */
		value?: string | Color | null;
		/** The default color value (uncontrolled). */
		defaultValue?: string | Color;
		/** The color space that the slider operates in. */
		colorSpace?: ColorSpace;
		/** Handler that is called when the value changes, as the user drags. */
		onChange?: (color: Color) => void;
		/** Handler that is called when the user stops dragging. */
		onChangeEnd?: (color: Color) => void;
		/** Whether the slider is disabled. */
		isDisabled?: boolean;
		'aria-label'?: string;
	} = $props();

	const DEFAULT_COLOR = parseColor('hsl(0, 100%, 50%)');

	let internalValue = $state<Color | undefined>(undefined);

	const color = $derived.by(() => {
		const v =
			value != null
				? normalizeColor(value)
				: (internalValue ?? (defaultValue ? normalizeColor(defaultValue) : DEFAULT_COLOR));
		return colorSpace ? v.toFormat(colorSpace) : v;
	});

	let lastColor: Color | null = null;

	const setColor = (newColor: Color) => {
		lastColor = newColor;
		internalValue = newColor;
		onChange?.(newColor);
	};

	const range = $derived(color.getChannelRange(channel));
	const channelValue = $derived(color.getChannelValue(channel));
	const percent = $derived((channelValue - range.minValue) / (range.maxValue - range.minValue));

	const setChannelValue = (v: number) => {
		if (v === channelValue) {
			return;
		}
		setColor(color.withChannelValue(channel, v));
	};

	// Default label to the channel name.
	const resolvedLabel = $derived(label || color.getChannelName(channel));

	const displayColor = $derived.by(() => {
		switch (channel) {
			case 'hue':
				return parseColor(`hsl(${color.getChannelValue('hue')}, 100%, 50%)`);
			case 'alpha':
				return color;
			default:
				return color.withChannelValue('alpha', 1);
		}
	});

	// Ported from @react-aria/color useColorSlider generateBackground.
	const trackBackground = $derived.by(() => {
		const to = 'right';
		const v = displayColor;
		switch (channel) {
			case 'hue': {
				const stops = [0, 60, 120, 180, 240, 300, 360]
					.map((hue) => v.withChannelValue('hue', hue).toString('css'))
					.join(', ');
				return `linear-gradient(to ${to}, ${stops})`;
			}
			case 'lightness': {
				// We have to add an extra color stop in the middle so that the hue shows up at all.
				// Otherwise it will always just be black to white.
				const start = v.withChannelValue(channel, range.minValue).toString('css');
				const middle = v
					.withChannelValue(channel, (range.maxValue - range.minValue) / 2)
					.toString('css');
				const end = v.withChannelValue(channel, range.maxValue).toString('css');
				return `linear-gradient(to ${to}, ${start}, ${middle}, ${end})`;
			}
			default: {
				const start = v.withChannelValue(channel, range.minValue).toString('css');
				const end = v.withChannelValue(channel, range.maxValue).toString('css');
				return `linear-gradient(to ${to}, ${start}, ${end})`;
			}
		}
	});

	const ariaValueText = $derived.by(() => {
		let valueText = color.formatChannelValue(channel);
		if (channel === 'hue') {
			valueText += `, ${displayColor.getHueName()}`;
		} else if (channel !== 'alpha') {
			valueText += `, ${displayColor.getColorName()}`;
		}
		return valueText;
	});

	let trackEl: HTMLDivElement | null = $state(null);
	let inputEl: HTMLInputElement | null = $state(null);
	let isDragging = $state(false);

	const setValueFromPointerEvent = (e: PointerEvent) => {
		if (!trackEl) {
			return;
		}
		const rect = trackEl.getBoundingClientRect();
		const x = clamp((e.clientX - rect.x) / rect.width, 0, 1);
		const newValue = snapValueToStep(
			range.minValue + x * (range.maxValue - range.minValue),
			range.minValue,
			range.maxValue,
			range.step
		);
		setChannelValue(newValue);
	};

	const onPointerDown = (e: PointerEvent) => {
		if (isDisabled) {
			return;
		}
		if (e.pointerType === 'mouse' && (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey)) {
			return;
		}
		e.preventDefault();
		trackEl?.setPointerCapture(e.pointerId);
		isDragging = true;
		setValueFromPointerEvent(e);
		inputEl?.focus({ preventScroll: true });
	};

	const onPointerMove = (e: PointerEvent) => {
		if (!isDragging) {
			return;
		}
		setValueFromPointerEvent(e);
	};

	const onPointerUp = (e: PointerEvent) => {
		if (!isDragging) {
			return;
		}
		isDragging = false;
		if (trackEl?.hasPointerCapture(e.pointerId)) {
			trackEl.releasePointerCapture(e.pointerId);
		}
		onChangeEnd?.(lastColor ?? color);
		inputEl?.focus({ preventScroll: true });
	};

	const visuallyHiddenStyle =
		'border: 0; clip: rect(0 0 0 0); clip-path: inset(50%); height: 100%; width: 100%; margin: -1px; overflow: hidden; padding: 0; position: absolute; white-space: nowrap; opacity: 0.0001; pointer-events: none;';
</script>

<div
	bind:this={trackEl}
	role="group"
	aria-label={ariaLabel ?? resolvedLabel}
	class={cn('h-3 w-full rounded-full border border-gray-300')}
	style={`position: relative; touch-action: none; forced-color-adjust: none; background: ${trackBackground},
            repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 12px 12px;`}
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
>
	<div
		role="presentation"
		class="top-[5px] box-border h-3 w-3 rounded-full"
		style={`position: absolute; left: ${percent * 100}%; transform: translate(-50%, -50%); touch-action: none; forced-color-adjust: none; background: linear-gradient(${displayColor.toString('css')}, ${displayColor.toString('css')}),
          repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 16px 16px; border: 2px solid white; box-shadow: 0 0 0 1px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0,0,0,0.25);`}
	>
		<input
			bind:this={inputEl}
			type="range"
			min={range.minValue}
			max={range.maxValue}
			step={range.step}
			value={channelValue}
			disabled={isDisabled}
			aria-label={ariaLabel ?? resolvedLabel}
			aria-valuetext={ariaValueText}
			aria-orientation="horizontal"
			style={visuallyHiddenStyle}
			oninput={(e) => {
				setChannelValue(parseFloat(e.currentTarget.value));
			}}
			onchange={() => {
				onChangeEnd?.(lastColor ?? color);
			}}
		/>
	</div>
</div>
