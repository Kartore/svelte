<script lang="ts">
	import { onDestroy } from 'svelte';

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
		value,
		defaultValue,
		colorSpace,
		xChannel,
		yChannel,
		onChange,
		onChangeEnd,
		isDisabled,
		'aria-label': ariaLabel
	}: {
		class?: string;
		/** The current color value (controlled). */
		value?: string | Color | null;
		/** The default color value (uncontrolled). */
		defaultValue?: string | Color;
		/** The color space that the color area operates in. */
		colorSpace?: ColorSpace;
		/** Color channel for the horizontal axis. */
		xChannel?: ColorChannel;
		/** Color channel for the vertical axis. */
		yChannel?: ColorChannel;
		/** Handler that is called when the value changes, as the user drags. */
		onChange?: (color: Color) => void;
		/** Handler that is called when the user stops dragging. */
		onChangeEnd?: (color: Color) => void;
		/** Whether the color area is disabled. */
		isDisabled?: boolean;
		'aria-label'?: string;
	} = $props();

	const DEFAULT_COLOR = parseColor('#ffffff');

	let internalValue = $state<Color | undefined>(undefined);
	let isDragging = $state(false);

	const color = $derived.by(() => {
		const v =
			isDragging && internalValue
				? internalValue
				: value != null
					? normalizeColor(value)
					: (internalValue ?? (defaultValue ? normalizeColor(defaultValue) : DEFAULT_COLOR));
		return colorSpace ? v.toFormat(colorSpace) : v;
	});

	// Keeps track of the latest color for onChangeEnd, since `color` is derived
	// from the controlled `value` prop and may not have updated yet.
	let lastColor: Color | null = null;
	let pendingChange: Color | null = null;
	let changeFrame: number | null = null;

	const flushChange = () => {
		if (changeFrame !== null) {
			cancelAnimationFrame(changeFrame);
			changeFrame = null;
		}
		const nextColor = pendingChange;
		pendingChange = null;
		if (nextColor) onChange?.(nextColor);
	};

	const emitChange = (newColor: Color) => {
		if (!isDragging) {
			onChange?.(newColor);
			return;
		}
		pendingChange = newColor;
		if (changeFrame !== null) return;
		changeFrame = requestAnimationFrame(() => {
			changeFrame = null;
			const nextColor = pendingChange;
			pendingChange = null;
			if (nextColor) onChange?.(nextColor);
		});
	};

	onDestroy(() => {
		if (changeFrame !== null) cancelAnimationFrame(changeFrame);
	});

	const setColor = (newColor: Color) => {
		lastColor = newColor;
		internalValue = newColor;
		emitChange(newColor);
	};

	const channels = $derived(color.getColorSpaceAxes({ xChannel, yChannel }));
	const xRange = $derived(color.getChannelRange(channels.xChannel));
	const yRange = $derived(color.getChannelRange(channels.yChannel));

	const xValue = $derived(color.getChannelValue(channels.xChannel));
	const yValue = $derived(color.getChannelValue(channels.yChannel));

	const setXValue = (v: number) => {
		if (v === xValue) {
			return;
		}
		setColor(color.withChannelValue(channels.xChannel, v));
	};
	const setYValue = (v: number) => {
		if (v === yValue) {
			return;
		}
		setColor(color.withChannelValue(channels.yChannel, v));
	};

	const setColorFromPoint = (x: number, y: number) => {
		let newXValue = xRange.minValue + clamp(x, 0, 1) * (xRange.maxValue - xRange.minValue);
		let newYValue = yRange.minValue + (1 - clamp(y, 0, 1)) * (yRange.maxValue - yRange.minValue);
		let newColor: Color | undefined;
		if (newXValue !== xValue) {
			// Round new value to multiple of step, clamp value between min and max
			newXValue = snapValueToStep(newXValue, xRange.minValue, xRange.maxValue, xRange.step);
			newColor = color.withChannelValue(channels.xChannel, newXValue);
		}
		if (newYValue !== yValue) {
			// Round new value to multiple of step, clamp value between min and max
			newYValue = snapValueToStep(newYValue, yRange.minValue, yRange.maxValue, yRange.step);
			newColor = (newColor || color).withChannelValue(channels.yChannel, newYValue);
		}
		if (newColor) {
			setColor(newColor);
		}
	};

	const incrementX = (stepSize: number) => {
		setXValue(
			xValue + stepSize > xRange.maxValue
				? xRange.maxValue
				: snapValueToStep(xValue + stepSize, xRange.minValue, xRange.maxValue, xRange.step)
		);
	};
	const incrementY = (stepSize: number) => {
		setYValue(
			yValue + stepSize > yRange.maxValue
				? yRange.maxValue
				: snapValueToStep(yValue + stepSize, yRange.minValue, yRange.maxValue, yRange.step)
		);
	};
	const decrementX = (stepSize: number) => {
		setXValue(snapValueToStep(xValue - stepSize, xRange.minValue, xRange.maxValue, xRange.step));
	};
	const decrementY = (stepSize: number) => {
		setYValue(snapValueToStep(yValue - stepSize, yRange.minValue, yRange.maxValue, yRange.step));
	};

	const thumbPosition = $derived({
		x: (xValue - xRange.minValue) / (xRange.maxValue - xRange.minValue),
		y: 1 - (yValue - yRange.minValue) / (yRange.maxValue - yRange.minValue)
	});

	const displayColor = $derived(color.withChannelValue('alpha', 1));

	// Ported from @react-aria/color useColorAreaGradient.
	const hueGradient = (c: Color) =>
		[0, 60, 120, 180, 240, 300, 360]
			.map((hue) => c.withChannelValue('hue', hue).toString('css'))
			.join(', ');
	const saturationGradient = (c: Color) =>
		`${c.withChannelValue('saturation', 0).toString('css')}, transparent`;

	const hslChannels: Partial<Record<ColorChannel, (c: Color) => string>> = {
		hue: hueGradient,
		saturation: saturationGradient,
		lightness: () => 'black, transparent, white'
	};

	const hsbChannels: Partial<Record<ColorChannel, (c: Color) => string>> = {
		hue: hueGradient,
		saturation: saturationGradient,
		brightness: () => 'black, transparent'
	};

	const colorAreaStyle = $derived.by(() => {
		const end = 'right';
		const zValue = color.getChannelValue(channels.zChannel);

		switch (color.getColorSpace()) {
			case 'rgb': {
				const rgb = parseColor('rgb(0, 0, 0)');
				const background = [
					// The screen blend mode multiplies the inverse of each channel, e.g. 1 - (1 - a) * (1 - b).
					// Create a layer for each channel, with the other channels as 0. After blending, this should
					// result in the gradients being combined channel by channel.
					`linear-gradient(to ${end}, ${rgb.withChannelValue(channels.xChannel, 0).toString('css')}, ${rgb.withChannelValue(channels.xChannel, 255).toString('css')})`,
					`linear-gradient(to top, ${rgb.withChannelValue(channels.yChannel, 0).toString('css')}, ${rgb.withChannelValue(channels.yChannel, 255).toString('css')})`,
					rgb.withChannelValue(channels.zChannel, zValue).toString('css')
				].join(',');
				return `background: ${background}; background-blend-mode: screen;`;
			}
			case 'hsl': {
				const gradientValue = parseColor('hsl(0, 100%, 50%)').withChannelValue(
					channels.zChannel,
					zValue
				);

				const bg = color
					.getColorChannels()
					.filter((c) => c !== channels.zChannel)
					.map(
						(c) =>
							`linear-gradient(to ${c === channels.xChannel ? end : 'top'}, ${hslChannels[c]!(gradientValue)})`
					)
					.reverse();
				if (channels.zChannel === 'hue') {
					bg.push(gradientValue.toString('css'));
				}

				return `background: ${bg.join(', ')};`;
			}
			case 'hsb': {
				const gradientValue = parseColor('hsb(0, 100%, 100%)').withChannelValue(
					channels.zChannel,
					zValue
				);

				const bg = color
					.getColorChannels()
					.filter((c) => c !== channels.zChannel)
					.map(
						(c) =>
							`linear-gradient(to ${c === channels.xChannel ? end : 'top'}, ${hsbChannels[c]!(gradientValue)})`
					)
					.reverse();
				if (channels.zChannel === 'hue') {
					bg.push(gradientValue.toString('css'));
				}

				return `background: ${bg.join(', ')};`;
			}
		}
	});

	let containerEl: HTMLDivElement | null = $state(null);
	let xInputEl: HTMLInputElement | null = $state(null);
	let yInputEl: HTMLInputElement | null = $state(null);

	let focusedInput = $state<'x' | 'y' | null>(null);

	const focusInput = (input: 'x' | 'y' = 'x') => {
		const el = input === 'x' ? xInputEl : yInputEl;
		el?.focus({ preventScroll: true });
	};

	const setColorFromPointerEvent = (e: PointerEvent) => {
		if (!containerEl) {
			return;
		}
		const rect = containerEl.getBoundingClientRect();
		const x = (e.clientX - rect.x) / rect.width;
		const y = (e.clientY - rect.y) / rect.height;
		setColorFromPoint(x, y);
	};

	const onPointerDown = (e: PointerEvent) => {
		if (isDisabled) {
			return;
		}
		if (e.pointerType === 'mouse' && (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey)) {
			return;
		}
		e.preventDefault();
		containerEl?.setPointerCapture(e.pointerId);
		internalValue = color;
		lastColor = color;
		isDragging = true;
		setColorFromPointerEvent(e);
		focusInput();
	};

	const onPointerMove = (e: PointerEvent) => {
		if (!isDragging) {
			return;
		}
		setColorFromPointerEvent(e);
	};

	const onPointerUp = (e: PointerEvent) => {
		if (!isDragging) {
			return;
		}
		flushChange();
		isDragging = false;
		if (containerEl?.hasPointerCapture(e.pointerId)) {
			containerEl.releasePointerCapture(e.pointerId);
		}
		onChangeEnd?.(lastColor ?? color);
		focusInput();
	};

	const onInputKeyDown = (e: KeyboardEvent) => {
		if (isDisabled) {
			return;
		}
		const stepX = e.shiftKey && xRange.pageSize > xRange.step ? xRange.pageSize : xRange.step;
		const stepY = e.shiftKey && yRange.pageSize > yRange.step ? yRange.pageSize : yRange.step;
		let dir: 'x' | 'y';
		switch (e.key) {
			case 'ArrowRight':
				incrementX(stepX);
				dir = 'x';
				break;
			case 'ArrowLeft':
				decrementX(stepX);
				dir = 'x';
				break;
			case 'ArrowUp':
				incrementY(stepY);
				dir = 'y';
				break;
			case 'ArrowDown':
				decrementY(stepY);
				dir = 'y';
				break;
			case 'PageUp':
				incrementY(yRange.pageSize);
				dir = 'y';
				break;
			case 'PageDown':
				decrementY(yRange.pageSize);
				dir = 'y';
				break;
			case 'Home':
				decrementX(xRange.pageSize);
				dir = 'x';
				break;
			case 'End':
				incrementX(xRange.pageSize);
				dir = 'x';
				break;
			default:
				return;
		}
		e.preventDefault();
		onChangeEnd?.(lastColor ?? color);
		focusInput(dir);
		focusedInput = dir;
	};

	const getAriaValueTextForChannel = (channel: ColorChannel) => {
		const v = displayColor;
		const otherChannel = channel === channels.yChannel ? channels.xChannel : channels.yChannel;
		return `${[
			`${v.getChannelName(channel)}: ${v.formatChannelValue(channel)}`,
			`${v.getChannelName(otherChannel)}: ${v.formatChannelValue(otherChannel)}`,
			`${v.getChannelName(channels.zChannel)}: ${v.formatChannelValue(channels.zChannel)}`
		].join(', ')}, ${v.getColorName()}`;
	};

	const inputAriaLabel = $derived(ariaLabel ? `${ariaLabel}, Color picker` : 'Color picker');

	const visuallyHiddenStyle =
		'border: 0; clip: rect(0 0 0 0); clip-path: inset(50%); height: 100%; width: 100%; margin: -1px; overflow: hidden; padding: 0; position: absolute; white-space: nowrap; opacity: 0.0001; pointer-events: none;';
</script>

<div
	bind:this={containerEl}
	role="group"
	aria-label={ariaLabel ? `${ariaLabel}, Color picker` : undefined}
	class={cn('aspect-square w-full', className)}
	style={`position: relative; touch-action: none; forced-color-adjust: none; ${colorAreaStyle}`}
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
>
	<div
		role="presentation"
		class="h-3 w-3"
		style={`position: absolute; left: ${thumbPosition.x * 100}%; top: ${thumbPosition.y * 100}%; transform: translate(-50%, -50%); touch-action: none; forced-color-adjust: none; background: ${displayColor.toString('css')}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 0 1px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0,0,0,0.25); box-sizing: border-box;`}
	>
		<input
			bind:this={xInputEl}
			type="range"
			min={xRange.minValue}
			max={xRange.maxValue}
			step={xRange.step}
			value={xValue}
			disabled={isDisabled}
			aria-label={inputAriaLabel}
			aria-roledescription="2D slider"
			aria-valuetext={getAriaValueTextForChannel(channels.xChannel)}
			aria-orientation="horizontal"
			aria-hidden={!focusedInput || focusedInput === 'x' ? undefined : 'true'}
			tabindex={!focusedInput || focusedInput === 'x' ? undefined : -1}
			style={visuallyHiddenStyle}
			onfocus={() => {
				focusedInput = 'x';
			}}
			onkeydown={onInputKeyDown}
			onchange={(e) => {
				setXValue(parseFloat(e.currentTarget.value));
			}}
		/>
		<input
			bind:this={yInputEl}
			type="range"
			min={yRange.minValue}
			max={yRange.maxValue}
			step={yRange.step}
			value={yValue}
			disabled={isDisabled}
			aria-label={inputAriaLabel}
			aria-roledescription="2D slider"
			aria-valuetext={getAriaValueTextForChannel(channels.yChannel)}
			aria-orientation="vertical"
			aria-hidden={focusedInput === 'y' ? undefined : 'true'}
			tabindex={focusedInput === 'y' ? undefined : -1}
			style={visuallyHiddenStyle}
			onfocus={() => {
				focusedInput = 'y';
			}}
			onkeydown={onInputKeyDown}
			onchange={(e) => {
				setYValue(parseFloat(e.currentTarget.value));
			}}
		/>
	</div>
</div>
