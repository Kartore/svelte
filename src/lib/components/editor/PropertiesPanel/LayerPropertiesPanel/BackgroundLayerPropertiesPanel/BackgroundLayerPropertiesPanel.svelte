<script lang="ts">
	import type {
		BackgroundLayerSpecification,
		SpriteSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { ColorField } from '$lib/components/common/ColorField';
	import { ComboBox } from '$lib/components/common/ComboBox';
	import { NumberField } from '$lib/components/common/NumberField';
	import { RangeSlider } from '$lib/components/common/RangeSlider';
	import { TextField } from '$lib/components/common/TextField';
	import { PropertyErrorMessage } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/PropertyErrorMessage';
	import { RawDataProperties } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/RawDataProperties';
	import { getStyleJSONSchemaDefinition } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/RawDataProperties/schema/StyleJSONSchemaBase.ts';
	import { createSpriteIds } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSpriteIds/useSpriteIds.svelte.ts';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { parseColor, tryParseColor, type Color } from '$lib/utils/color.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		children,
		layer,
		sprite,
		onChange,
		class: className,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: BackgroundLayerSpecification;
		sprite?: SpriteSpecification;
		onChange?: onChangeType;
		children?: Snippet;
	} = $props();

	const spriteIdsState = createSpriteIds(() => sprite);
	const spriteIds = $derived(spriteIdsState.spriteIds);
</script>

<div {...props} class={cn('flex flex-col gap-6', className)}>
	<div class="flex flex-col gap-2 px-4">
		<h3 class="font-montserrat text-sm font-semibold">General</h3>
		<RangeSlider
			label="Zoom Range"
			minValue={0}
			maxValue={24}
			step={1}
			value={[layer.minzoom ?? 0, layer.maxzoom ?? 24]}
			onValueChange={([minzoom, maxzoom]) => {
				if (minzoom !== layer.minzoom) {
					onChange?.(layer, undefined, 'minzoom', minzoom === 0 ? undefined : minzoom);
				}
				if (maxzoom !== layer.maxzoom) {
					onChange?.(layer, undefined, 'maxzoom', maxzoom === 24 ? undefined : maxzoom);
				}
			}}
		/>
	</div>
	<div class="flex flex-col gap-2 px-4">
		<h3 class="font-montserrat text-sm font-semibold">Paint</h3>
		{#if typeof layer.paint?.['background-opacity'] === 'number' || layer.paint?.['background-opacity'] === undefined}
			<NumberField
				label="Opacity"
				onValueChange={(value) => {
					onChange?.(layer, 'paint', 'background-opacity', value === 1 ? undefined : value);
				}}
				value={layer.paint?.['background-opacity'] !== undefined
					? layer.paint['background-opacity']
					: 1}
				minValue={0}
				maxValue={1}
				formatOptions={{
					style: 'percent',
					maximumFractionDigits: 2
				}}
			/>
		{:else}
			<TextField
				label="Opacity"
				value={layer.paint?.['background-opacity']
					? String(layer.paint?.['background-opacity'])
					: undefined}
			/>
		{/if}
		<PropertyErrorMessage group="paint" property="background-opacity" />
		{#if typeof layer.paint?.['background-color'] === 'string' || layer.paint?.['background-color'] === undefined}
			<ColorField
				label="Color"
				value={tryParseColor(layer.paint?.['background-color'] ?? 'rgba(255, 255, 255, 1)') ??
					parseColor('rgba(255, 255, 255, 1)')}
				onChange={(color: Color | null) => {
					onChange?.(layer, 'paint', 'background-color', color?.toString('rgba'));
				}}
			/>
		{:else}
			<TextField
				label="Color"
				value={layer.paint?.['background-color'] ? String(layer.paint?.['background-color']) : '1'}
			/>
		{/if}
		<PropertyErrorMessage group="paint" property="background-color" />
		{#if typeof layer.paint?.['background-pattern'] === 'string' || layer.paint?.['background-pattern'] === undefined}
			<ComboBox
				label="Pattern"
				allowsCustomValue
				items={(spriteIds ?? []).map((spriteId) => ({ value: spriteId, label: spriteId }))}
				inputValue={layer.paint?.['background-pattern']}
				value={layer.paint?.['background-pattern']}
				onInputChange={(value) => {
					if (value === layer.paint?.['background-pattern']) return;
					if (!value) {
						onChange?.(layer, 'paint', 'background-pattern', undefined);
					} else {
						onChange?.(layer, 'paint', 'background-pattern', value);
					}
				}}
				onValueChange={(value) => {
					if (!value || value === layer.paint?.['background-pattern']) return;
					onChange?.(layer, 'paint', 'background-pattern', value);
				}}
			/>
		{:else}
			<TextField
				label="Pattern"
				value={layer.paint?.['background-pattern']
					? String(layer.paint?.['background-pattern'])
					: '1'}
			/>
		{/if}
		<PropertyErrorMessage group="paint" property="background-pattern" />
	</div>
	<RawDataProperties
		{layer}
		{onChange}
		schema={getStyleJSONSchemaDefinition('BackgroundLayerSpecification')}
	/>
	{@render children?.()}
</div>
