<script lang="ts">
	import { ColorField } from '#lib/components/common/ColorField';
	import { ComboBox } from '#lib/components/common/ComboBox';
	import { useSpriteImages } from '#lib/components/common/FilterInputField/expressions/common/SpriteImagesContext';
	import { NumberArrayField } from '#lib/components/common/NumberArrayField';
	import { NumberField } from '#lib/components/common/NumberField';
	import { NumberListField } from '#lib/components/common/NumberListField';
	import { Select } from '#lib/components/common/Select';
	import { VariableAnchorOffsetField } from '#lib/components/common/VariableAnchorOffsetField';
	import { parseColor, tryParseColor } from '#lib/utils/color.ts';
	import type { StylePropertySpec } from '#lib/utils/layerSpec.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	import { getSpecLiteralFieldKind } from './specLiteralField.ts';

	let {
		class: className,
		label,
		spec,
		value,
		compact = false,
		context,
		onChange,
		onTransientChange,
		onCommit,
		onTransientCancel,
		onPickVariable,
		onPromoteColor
	}: {
		class?: string;
		label?: string;
		spec: StylePropertySpec;
		value: unknown;
		compact?: boolean;
		context?: 'expression';
		onChange?: (value: unknown | undefined) => void;
		onTransientChange?: (value: unknown | undefined) => void;
		onCommit?: (value: unknown | undefined) => void;
		onTransientCancel?: () => void;
		onPickVariable?: (variableId: string) => void;
		onPromoteColor?: () => void;
	} = $props();

	const kind = $derived(getSpecLiteralFieldKind(spec, value, { context }));
	const visibleLabel = $derived(compact ? undefined : label);
	const getSpriteImages = useSpriteImages();
	const spriteImages = $derived(getSpriteImages());
	const enumItems = $derived(
		Object.keys(spec.values ?? {}).map((item) => ({ value: item, label: item }))
	);
	const spriteImageItems = $derived(
		(spriteImages ?? []).map((image) => ({
			value: image.id,
			label: image.id,
			preview: {
				src: image.src,
				x: image.x,
				y: image.y,
				width: image.width,
				height: image.height,
				pixelRatio: image.pixelRatio
			}
		}))
	);
	const stringValue = $derived(
		typeof value === 'string' ? value : typeof spec.default === 'string' ? spec.default : ''
	);
	const isPercentNumber = $derived(spec.minimum === 0 && spec.maximum === 1);
	const numberArrayLabels = $derived(
		spec.length === 4
			? ['Top', 'Right', 'Bottom', 'Left']
			: spec.length === 3
				? ['Radial', 'Azimuthal', 'Polar']
				: ['X', 'Y']
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
			{onPickVariable}
			{onPromoteColor}
		/>
	{:else if kind === 'enum'}
		<Select
			class={compactControlClass}
			label={visibleLabel}
			aria-label={compact ? (label ?? 'Value') : undefined}
			items={enumItems}
			value={stringValue}
			onValueChange={(next) => onChange?.(next)}
		/>
	{:else if kind === 'image'}
		<ComboBox
			class={compactControlClass}
			label={visibleLabel}
			aria-label={compact ? (label ?? 'Value') : undefined}
			allowsCustomValue
			items={spriteImageItems}
			inputValue={stringValue}
			value={stringValue}
			onValueChange={(next) => {
				if (!next || next === stringValue) return;
				onChange?.(next);
			}}
			onCommit={(next) => {
				if (next === stringValue) return;
				onChange?.(next);
			}}
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
			onValueCommit={(next) => (onCommit ?? onChange)?.(next)}
			onTransientValueChange={(next) => (onTransientChange ?? onChange)?.(next)}
			{onTransientCancel}
		/>
	{:else if kind === 'number-array' && spec.length !== undefined}
		<NumberArrayField
			class={compactControlClass}
			label={visibleLabel}
			arrayLabels={numberArrayLabels}
			values={numberArrayValue(value, spec.length)}
			stacked={spec.length === 3}
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
