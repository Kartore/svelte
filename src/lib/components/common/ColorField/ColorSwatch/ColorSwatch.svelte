<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { parseColor, type Color } from '$lib/utils/color';
	import { cn } from '$lib/utils/tailwindUtil';

	let {
		class: className,
		color: value,
		colorName,
		id,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'color'> & {
		class?: string;
		/** The color value to display in the swatch. */
		color?: string | Color;
		/**
		 * An accessible name for the color.
		 * By default, a description is generated from the color value,
		 * but this can be overridden if you have a more specific color
		 * name (e.g. Pantone colors).
		 */
		colorName?: string;
	} = $props();

	const uid = $props.id();
	const resolvedId = $derived(id ?? uid);

	const color = $derived.by(() => {
		const nonNullValue = value || '#fff0';
		return typeof nonNullValue === 'string' ? parseColor(nonNullValue) : nonNullValue;
	});

	const resolvedColorName = $derived(
		colorName ?? (color.getChannelValue('alpha') === 0 ? 'transparent' : color.getColorName())
	);
</script>

<div
	{...props}
	role="img"
	aria-roledescription="color swatch"
	aria-label={[resolvedColorName, ariaLabel || ''].filter(Boolean).join(', ')}
	aria-labelledby={ariaLabelledby ? `${resolvedId} ${ariaLabelledby}` : undefined}
	id={resolvedId}
	class={cn('', className)}
	style={`forced-color-adjust: none; background: linear-gradient(${color.toString('css')}, ${color.toString('css')}),
          repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 16px 16px;`}
></div>
