<script lang="ts">
	import { BoxRadioGroup } from '#lib/components/common/BoxRadioGroup';
	import {
		SpecLiteralField,
		getSpecLiteralFieldKind
	} from '#lib/components/common/SpecLiteralField';
	import { TextField } from '#lib/components/common/TextField';
	import { ExpressionPropertyField } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/ExpressionPropertyField';
	import { labelFromPropertyKey, type LayerPropertyEntry } from '#lib/utils/layerSpec.ts';

	let {
		entry,
		value,
		onChange
	}: {
		entry: LayerPropertyEntry;
		value: unknown;
		onChange?: (value: unknown | undefined) => void;
	} = $props();

	const label = $derived(labelFromPropertyKey(entry.key));
	const specLiteralFieldKind = $derived(getSpecLiteralFieldKind(entry.spec, value));
	const canUseSpecLiteralField = $derived(
		specLiteralFieldKind === 'color' ||
			specLiteralFieldKind === 'number' ||
			specLiteralFieldKind === 'number-array'
	);
	const enumItems = $derived(
		Object.keys(entry.spec.values ?? {}).map((item) => ({
			value: item,
			label: item
		}))
	);

	const isDefault = (next: unknown) => JSON.stringify(next) === JSON.stringify(entry.spec.default);
	const commit = (next: unknown | undefined) => {
		onChange?.(next !== undefined && isDefault(next) ? undefined : next);
	};
	const fallbackValue = (raw: unknown) => {
		if (raw === undefined) return '';
		const json = JSON.stringify(raw);
		return json === undefined ? String(raw) : json;
	};
</script>

<ExpressionPropertyField
	{label}
	{value}
	defaultLiteral={entry.spec.default ?? ''}
	styleDefaultValue={entry.spec.default}
	propertySpec={entry.spec}
	rampable={entry.spec.expression?.interpolated === true}
	onChange={(next) => onChange?.(next)}
>
	{#if canUseSpecLiteralField}
		<SpecLiteralField {label} spec={entry.spec} {value} onChange={commit} />
	{:else if entry.spec.type === 'enum'}
		<BoxRadioGroup
			{label}
			items={enumItems}
			value={typeof value === 'string' ? value : String(entry.spec.default ?? '')}
			onValueChange={commit}
		/>
	{:else}
		<TextField {label} value={fallbackValue(value)} disabled />
	{/if}
</ExpressionPropertyField>
