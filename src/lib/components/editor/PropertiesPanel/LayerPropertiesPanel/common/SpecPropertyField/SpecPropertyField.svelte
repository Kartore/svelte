<script lang="ts">
	import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';

	import { BoxRadioGroup } from '$lib/components/common/BoxRadioGroup';
	import { Button } from '$lib/components/common/Button';
	import { ComboBox } from '$lib/components/common/ComboBox';
	import { EnumSetField } from '$lib/components/common/EnumSetField';
	import { NumberField } from '$lib/components/common/NumberField';
	import { Select } from '$lib/components/common/Select';
	import {
		SpecLiteralField,
		getSpecLiteralFieldKind
	} from '$lib/components/common/SpecLiteralField';
	import { Switch } from '$lib/components/common/Switch';
	import { TextField } from '$lib/components/common/TextField';
	import { ExpressionPropertyField } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/ExpressionPropertyField';
	import type { SpriteImage } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSpriteIds/useSpriteIds.svelte.ts';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { useExpressionFlyout } from '$lib/contexts/expressionFlyout.svelte.ts';
	import {
		getLayerZoomRange,
		labelFromPropertyKey,
		type LayerPropertyEntry
	} from '$lib/utils/layerSpec.ts';

	let {
		layer,
		group,
		entry,
		labelPrefix,
		spriteIds,
		spriteImages,
		onChange
	}: {
		layer: LayerSpecification;
		group: 'paint' | 'layout';
		entry: LayerPropertyEntry;
		labelPrefix?: string;
		spriteIds?: string[];
		spriteImages?: SpriteImage[];
		onChange?: onChangeType;
	} = $props();

	const flyout = useExpressionFlyout();
	let { key, spec } = $derived(entry);
	const label = $derived(labelFromPropertyKey(key, layer.type, labelPrefix));
	const rawValue = $derived((layer[group] as Record<string, unknown> | undefined)?.[key]);
	const isColorRamp = $derived(spec['property-type'] === 'color-ramp');
	const specLiteralFieldKind = $derived(getSpecLiteralFieldKind(spec, rawValue));
	const transitionKey = $derived(`${key}-transition`);
	const rawTransitionValue = $derived(
		group === 'paint'
			? (layer.paint as Record<string, unknown> | undefined)?.[transitionKey]
			: undefined
	);
	const canEditTransition = $derived(
		group === 'paint' && spec.transition === true && rawValue !== undefined
	);
	const enumItems = $derived(
		Object.keys(spec.values ?? {}).map((value) => ({
			value,
			label: value
		}))
	);
	const spriteImageItems = $derived(
		spriteImages?.map((image) => ({
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
		})) ?? (spriteIds ?? []).map((spriteId) => ({ value: spriteId, label: spriteId }))
	);

	const layerZoomRange = $derived(getLayerZoomRange(layer));

	const isDefault = (value: unknown) => JSON.stringify(value) === JSON.stringify(spec.default);
	const commit = (value: unknown) => {
		onChange?.(
			layer,
			group,
			key as never,
			(value !== undefined && isDefault(value) ? undefined : value) as never
		);
	};
	const expressionChange = (value: unknown | undefined) => {
		onChange?.(layer, group, key as never, value as never);
	};
	const fallbackValue = (value: unknown) => {
		if (value === undefined) return '';
		const json = JSON.stringify(value);
		return json === undefined ? String(value) : json;
	};
	const stringListValue = (value: unknown): string[] | undefined =>
		Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : undefined;
	const isRecord = (value: unknown): value is Record<string, unknown> => {
		return typeof value === 'object' && value !== null && !Array.isArray(value);
	};
	const transitionValue = (value: unknown): { duration: number; delay: number } => ({
		duration: isRecord(value) && typeof value.duration === 'number' ? value.duration : 300,
		delay: isRecord(value) && typeof value.delay === 'number' ? value.delay : 0
	});
	const formatStringList = (value: unknown) => stringListValue(value)?.join(', ') ?? '';
	const parseStringList = (value: string): string[] | undefined => {
		const list = value
			.split(',')
			.map((item) => item.trim())
			.filter((item) => item !== '');
		return list.length === 0 ? undefined : list;
	};
	const commitTransition = (duration: number, delay: number) => {
		onChange?.(
			layer,
			'paint',
			transitionKey as never,
			(duration === 300 && delay === 0 ? undefined : { duration, delay }) as never
		);
	};

	let showTransition = $state(false);
</script>

<div class="flex flex-col gap-1">
	<ExpressionPropertyField
		{label}
		layerId={layer.id}
		value={rawValue}
		propertyKey={key}
		propertyGroup={group}
		propertySpec={spec}
		zoomRange={layerZoomRange}
		defaultLiteral={isColorRamp ? '' : (spec.default ?? '')}
		styleDefaultValue={spec.default}
		rampable={spec.expression?.interpolated === true && spec['property-type'] !== 'color-ramp'}
		showExpressionButton={!isColorRamp && key !== 'visibility'}
		onChange={expressionChange}
	>
		{#if key === 'visibility'}
			<Switch
				{label}
				checked={rawValue !== 'none'}
				onCheckedChange={(checked) => commit(checked ? undefined : 'none')}
			/>
		{:else if isColorRamp}
			<div class="flex flex-row items-center justify-between">
				<span class="text-sm font-semibold text-gray-600">{label}</span>
				<Button
					aria-label={`Add ${label} expression`}
					class="rounded bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-200"
					onclick={(event) => {
						expressionChange(spec.default);
						flyout?.open({ group, key, label }, event.currentTarget);
					}}
				>
					+ Add
				</Button>
			</div>
		{:else if specLiteralFieldKind !== undefined}
			<SpecLiteralField {label} {spec} value={rawValue} onChange={commit} />
		{:else if spec.type === 'enum'}
			{#if enumItems.length <= 3}
				<BoxRadioGroup
					{label}
					items={enumItems}
					value={typeof rawValue === 'string' ? rawValue : String(spec.default ?? '')}
					onValueChange={(value) => commit(value)}
				/>
			{:else}
				<Select
					{label}
					items={enumItems}
					value={typeof rawValue === 'string' ? rawValue : String(spec.default ?? '')}
					onValueChange={(value) => commit(value)}
				/>
			{/if}
		{:else if spec.type === 'boolean'}
			<Switch
				{label}
				checked={typeof rawValue === 'boolean' ? rawValue : spec.default === true}
				onCheckedChange={(checked) => commit(checked)}
			/>
		{:else if spec.type === 'array' && spec.value === 'enum'}
			<EnumSetField
				{label}
				items={enumItems}
				values={stringListValue(rawValue ?? spec.default)}
				onChange={(values) => commit(values)}
			/>
		{:else if spec.type === 'array' && spec.value === 'string'}
			<TextField
				{label}
				value={formatStringList(rawValue ?? spec.default)}
				onCommit={(value) => commit(parseStringList(value))}
			/>
		{:else if spec.type === 'resolvedImage'}
			<ComboBox
				{label}
				allowsCustomValue
				items={spriteImageItems}
				inputValue={typeof rawValue === 'string' ? rawValue : undefined}
				value={typeof rawValue === 'string' ? rawValue : undefined}
				onInputChange={(value) => {
					if (value === rawValue) return;
					commit(value || undefined);
				}}
				onValueChange={(value) => {
					if (!value || value === rawValue) return;
					commit(value);
				}}
			/>
		{:else if spec.type === 'formatted' || spec.type === 'string'}
			<!-- onCommit (blur/Enter) で確定する。キーストロークごとに commit すると IME 変換中の
			テキストがスタイルに書き込まれてしまうため onValueChange は使わない -->
			<TextField
				{label}
				value={typeof rawValue === 'string' ? rawValue : undefined}
				onCommit={(value) => commit(value || undefined)}
			/>
		{:else}
			<TextField {label} value={fallbackValue(rawValue)} disabled />
		{/if}
	</ExpressionPropertyField>
	{#if canEditTransition}
		<div class="flex flex-col gap-1">
			<Button
				class="self-end rounded px-2 py-0.5 text-xs font-semibold text-gray-400 hover:bg-gray-100 hover:text-gray-600"
				aria-expanded={showTransition}
				onclick={() => (showTransition = !showTransition)}
			>
				transition…
			</Button>
			{#if showTransition}
				<div class="flex flex-col gap-1 border-l-2 border-gray-200 pl-3">
					<NumberField
						label="Duration"
						value={transitionValue(rawTransitionValue).duration}
						minValue={0}
						description="ms"
						onValueChange={(duration) => {
							commitTransition(duration, transitionValue(rawTransitionValue).delay);
						}}
					/>
					<NumberField
						label="Delay"
						value={transitionValue(rawTransitionValue).delay}
						minValue={0}
						description="ms"
						onValueChange={(delay) => {
							commitTransition(transitionValue(rawTransitionValue).duration, delay);
						}}
					/>
				</div>
			{/if}
		</div>
	{/if}
</div>
