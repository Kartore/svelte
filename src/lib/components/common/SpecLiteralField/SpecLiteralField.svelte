<script lang="ts">
	import { ColorField } from '$lib/components/common/ColorField';
	import { NumberArrayField } from '$lib/components/common/NumberArrayField';
	import { NumberField } from '$lib/components/common/NumberField';
	import { NumberListField } from '$lib/components/common/NumberListField';
	import { VariableAnchorOffsetField } from '$lib/components/common/VariableAnchorOffsetField';
	import { parseColor, tryParseColor } from '$lib/utils/color.ts';
	import type { StylePropertySpec } from '$lib/utils/layerSpec.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	import { getSpecLiteralFieldKind } from './specLiteralField.ts';

	let {
		class: className,
		label,
		spec,
		value,
		compact = false,
		onChange
	}: {
		class?: string;
		label?: string;
		spec: StylePropertySpec;
		value: unknown;
		compact?: boolean;
		onChange?: (value: unknown | undefined) => void;
	} = $props();

	const kind = $derived(getSpecLiteralFieldKind(spec, value));
	const visibleLabel = $derived(compact ? undefined : label);
	const isPercentNumber = $derived(spec.minimum === 0 && spec.maximum === 1);
	const numberArrayLabels = $derived(
		spec.length === 4 ? ['Top', 'Right', 'Bottom', 'Left'] : ['X', 'Y']
	);
	const compactControlClass = $derived(compact ? 'w-full [&>div]:w-full' : undefined);
	const compactListClass = $derived(compact ? 'w-full [&>input]:w-full' : undefined);

	const unitLabels: Record<string, string> = {
		pixels: 'px',
		ems: 'em',
		degrees: '°',
		meters: 'm',
		milliseconds: 'ms',
		'factor of the original icon size': '×',
		'line widths': '× width'
	};
	const unitLabel = $derived(
		spec.units === undefined ? undefined : (unitLabels[spec.units] ?? spec.units)
	);

	const numberArrayValue = (raw: unknown, length: number): number[] => {
		if (
			Array.isArray(raw) &&
			raw.length === length &&
			raw.every((item) => typeof item === 'number')
		) {
			return raw;
		}
		if (
			Array.isArray(spec.default) &&
			spec.default.length === length &&
			spec.default.every((item) => typeof item === 'number')
		) {
			return spec.default;
		}
		return Array.from({ length }, () => 0);
	};
	const numberListValue = (raw: unknown): number[] | undefined =>
		Array.isArray(raw) && raw.every((item) => typeof item === 'number') ? raw : undefined;
</script>

<div class={cn('min-w-0', compact && 'w-full', className)}>
	{#if kind === 'color'}
		<ColorField
			class={compactControlClass}
			label={visibleLabel}
			value={(typeof value === 'string' ? tryParseColor(value) : undefined) ??
				(typeof spec.default === 'string' ? tryParseColor(spec.default) : undefined) ??
				parseColor('rgba(255, 255, 255, 1)')}
			onChange={(color) => onChange?.(color?.toString('rgba'))}
		/>
	{:else if kind === 'number'}
		<NumberField
			class={compactControlClass}
			label={visibleLabel}
			aria-label={compact ? (label ?? 'Value') : undefined}
			value={typeof value === 'number'
				? value
				: typeof spec.default === 'number'
					? spec.default
					: undefined}
			minValue={spec.minimum}
			maxValue={spec.maximum}
			step={isPercentNumber ? 0.01 : undefined}
			formatOptions={isPercentNumber
				? {
						style: 'percent',
						maximumFractionDigits: 2
					}
				: undefined}
			description={unitLabel}
			onValueChange={(next) => onChange?.(next)}
		/>
	{:else if kind === 'number-array' && spec.length !== undefined}
		<NumberArrayField
			class={compactControlClass}
			label={visibleLabel}
			arrayLabels={numberArrayLabels}
			values={numberArrayValue(value, spec.length)}
			onChange={(next) => onChange?.(next)}
		/>
	{:else if kind === 'number-list' || kind === 'padding'}
		<NumberListField
			class={compactListClass}
			label={visibleLabel}
			aria-label={compact ? (label ?? 'Value') : undefined}
			values={numberListValue(value ?? spec.default)}
			minLength={kind === 'padding' ? 1 : undefined}
			maxLength={kind === 'padding' ? 4 : undefined}
			onChange={(next) => onChange?.(next)}
		/>
	{:else if kind === 'variable-anchor-offset'}
		<VariableAnchorOffsetField
			label={label ?? 'Value'}
			{compact}
			{value}
			onChange={(next) => onChange?.(next)}
		/>
	{/if}
</div>
