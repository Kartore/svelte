<script lang="ts">
	import type {
		FillLayerSpecification,
		SourceSpecification,
		SpriteSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { BoxRadioGroup } from '$lib/components/common/BoxRadioGroup';
	import { ColorField } from '$lib/components/common/ColorField';
	import { ComboBox } from '$lib/components/common/ComboBox';
	import { NumberArrayField } from '$lib/components/common/NumberArrayField';
	import { NumberField } from '$lib/components/common/NumberField';
	import { Switch } from '$lib/components/common/Switch';
	import { ExpressionPropertyField } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/ExpressionPropertyField';
	import { FilterProperties } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/FilterProperties';
	import { GeneralProperties } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/GeneralProperties';
	import { RawDataProperties } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/RawDataProperties';
	import { getStyleJSONSchemaDefinition } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/RawDataProperties/schema/StyleJSONSchemaBase.ts';
	import { createSpriteIds } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSpriteIds/useSpriteIds.svelte.ts';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { parseColor, tryParseColor, type Color } from '$lib/utils/color.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		layer,
		sources,
		sprite,
		onChange,
		children,
		class: className,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: FillLayerSpecification;
		sprite?: SpriteSpecification;
		sources: { [key: string]: SourceSpecification };
		onChange?: onChangeType;
		children?: Snippet;
	} = $props();

	const spriteIdsState = createSpriteIds(() => sprite);
	const spriteIds = $derived(spriteIdsState.spriteIds);
	const paint = $derived(layer.paint);
	const handlePaintChange = (key: string) => (value: unknown) => {
		onChange?.(layer, 'paint', key as never, value as never);
	};
</script>

<div {...props} class={cn('flex flex-col gap-6', className)}>
	<GeneralProperties {layer} {sources} {onChange} />
	<FilterProperties {layer} {onChange} />
	<div class="flex flex-col gap-2 px-4">
		<h3 class="font-montserrat text-sm font-semibold">Paint</h3>
		<ExpressionPropertyField
			label="Opacity"
			value={paint?.['fill-opacity']}
			propertyKey="fill-opacity"
			defaultLiteral={1}
			rampable
			onChange={handlePaintChange('fill-opacity')}
		>
			<NumberField
				label="Opacity"
				onValueChange={(value) => {
					onChange?.(layer, 'paint', 'fill-opacity', value === 1 ? undefined : value);
				}}
				value={typeof paint?.['fill-opacity'] === 'number' ? paint['fill-opacity'] : 1}
				minValue={0}
				maxValue={1}
				formatOptions={{
					style: 'percent',
					maximumFractionDigits: 2
				}}
			/>
		</ExpressionPropertyField>
		<ExpressionPropertyField
			label="Fill Color"
			value={paint?.['fill-color']}
			propertyKey="fill-color"
			defaultLiteral="rgba(255, 255, 255, 1)"
			rampable
			onChange={handlePaintChange('fill-color')}
		>
			<ColorField
				label="Fill Color"
				value={(typeof paint?.['fill-color'] === 'string'
					? tryParseColor(paint['fill-color'])
					: undefined) ?? parseColor('rgba(255, 255, 255, 1)')}
				onChange={(color: Color | null) => {
					onChange?.(layer, 'paint', 'fill-color', color?.toString('rgba'));
				}}
			/>
		</ExpressionPropertyField>
		<ExpressionPropertyField
			label="Antialias"
			value={paint?.['fill-antialias']}
			propertyKey="fill-antialias"
			defaultLiteral={true}
			onChange={handlePaintChange('fill-antialias')}
		>
			<Switch
				label="Antialias"
				checked={paint?.['fill-antialias'] === true}
				onCheckedChange={(checked) => {
					onChange?.(layer, 'paint', 'fill-antialias', checked ? true : undefined);
				}}
			/>
		</ExpressionPropertyField>
		<ExpressionPropertyField
			label="Outline Color"
			value={paint?.['fill-outline-color']}
			propertyKey="fill-outline-color"
			defaultLiteral="rgba(255, 255, 255, 1)"
			rampable
			onChange={handlePaintChange('fill-outline-color')}
		>
			<ColorField
				label="Outline Color"
				value={(typeof paint?.['fill-outline-color'] === 'string'
					? tryParseColor(paint['fill-outline-color'])
					: undefined) ?? parseColor('rgba(255, 255, 255, 1)')}
				onChange={(color: Color | null) => {
					onChange?.(layer, 'paint', 'fill-outline-color', color?.toString('rgba'));
				}}
			/>
		</ExpressionPropertyField>
		<ExpressionPropertyField
			label="Pattern"
			value={paint?.['fill-pattern']}
			propertyKey="fill-pattern"
			defaultLiteral=""
			onChange={handlePaintChange('fill-pattern')}
		>
			<ComboBox
				label="Pattern"
				allowsCustomValue
				items={(spriteIds ?? []).map((spriteId) => ({ value: spriteId, label: spriteId }))}
				inputValue={typeof paint?.['fill-pattern'] === 'string' ? paint['fill-pattern'] : undefined}
				value={typeof paint?.['fill-pattern'] === 'string' ? paint['fill-pattern'] : undefined}
				onInputChange={(value) => {
					if (value === paint?.['fill-pattern']) return;
					if (!value) {
						onChange?.(layer, 'paint', 'fill-pattern', undefined);
					} else {
						onChange?.(layer, 'paint', 'fill-pattern', value);
					}
				}}
				onValueChange={(value) => {
					if (!value || value === paint?.['fill-pattern']) return;
					onChange?.(layer, 'paint', 'fill-pattern', value);
				}}
			/>
		</ExpressionPropertyField>
		<ExpressionPropertyField
			label="Translate"
			value={paint?.['fill-translate']}
			propertyKey="fill-translate"
			defaultLiteral={[0, 0]}
			onChange={handlePaintChange('fill-translate')}
		>
			<NumberArrayField
				label="Translate"
				arrayLabels={['X', 'Y']}
				values={Array.isArray(paint?.['fill-translate']) &&
				typeof paint['fill-translate'][0] === 'number' &&
				typeof paint['fill-translate'][1] === 'number'
					? (paint['fill-translate'] as [number, number])
					: [0, 0]}
				onChange={(values) => {
					onChange?.(layer, 'paint', 'fill-translate', values);
				}}
			/>
		</ExpressionPropertyField>
		<ExpressionPropertyField
			label="Translate Anchor"
			value={paint?.['fill-translate-anchor']}
			propertyKey="fill-translate-anchor"
			defaultLiteral="map"
			onChange={handlePaintChange('fill-translate-anchor')}
		>
			<BoxRadioGroup
				label="Translate Anchor"
				items={[
					{
						value: 'map',
						label: 'Map'
					},
					{
						value: 'viewport',
						label: 'Viewport'
					}
				]}
				value={typeof paint?.['fill-translate-anchor'] === 'string'
					? paint['fill-translate-anchor']
					: 'map'}
				onValueChange={(value) => {
					onChange?.(
						layer,
						'paint',
						'fill-translate-anchor',
						value === 'map' ? undefined : 'viewport'
					);
				}}
			/>
		</ExpressionPropertyField>
	</div>
	<RawDataProperties
		{layer}
		{onChange}
		schema={getStyleJSONSchemaDefinition('FillLayerSpecification')}
	/>
	{@render children?.()}
</div>
