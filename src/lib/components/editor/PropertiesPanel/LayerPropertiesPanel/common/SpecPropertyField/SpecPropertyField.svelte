<script lang="ts">
	import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
	import { Plus } from 'phosphor-svelte';

	import { BoxRadioGroup } from '#lib/components/common/BoxRadioGroup';
	import { Button } from '#lib/components/common/Button';
	import { ComboBox } from '#lib/components/common/ComboBox';
	import { EnumSetField } from '#lib/components/common/EnumSetField';
	import { NumberField } from '#lib/components/common/NumberField';
	import { Select } from '#lib/components/common/Select';
	import {
		SpecLiteralField,
		getSpecLiteralFieldKind
	} from '#lib/components/common/SpecLiteralField';
	import { Switch } from '#lib/components/common/Switch';
	import { TextField } from '#lib/components/common/TextField';
	import { ExpressionPropertyField } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/ExpressionPropertyField';
	import type { SpriteImage } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSpriteIds/useSpriteIds.svelte.ts';
	import type { onChangeType } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { useExpressionFlyout } from '#lib/contexts/expressionFlyout.svelte.ts';
	import { usePropertyCommit } from '#lib/contexts/propertyCommit.ts';
	import { useStyleVariables } from '#lib/contexts/styleVariables.svelte.ts';
	import { getLayerZoomRange, type LayerPropertyEntry } from '#lib/utils/layerSpec.ts';

	let {
		layer,
		group,
		entry,
		spriteIds,
		spriteImages,
		onReset,
		onChange
	}: {
		layer: LayerSpecification;
		group: 'paint' | 'layout';
		entry: LayerPropertyEntry;
		spriteIds?: string[];
		spriteImages?: SpriteImage[];
		onReset?: () => void;
		onChange?: onChangeType;
	} = $props();

	const flyout = useExpressionFlyout();
	const propertyCommit = usePropertyCommit();
	const variables = useStyleVariables();
	let { key, spec } = $derived(entry);
	const label = $derived(key);
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
	const normalizedValue = (value: unknown) =>
		value !== undefined && isDefault(value) ? undefined : value;
	const transientChange = (value: unknown) => {
		const next = normalizedValue(value);
		if (propertyCommit?.onTransientChange) {
			propertyCommit.onTransientChange(layer, group, key as never, next as never);
		} else {
			commit(next);
		}
	};
	const commitTransient = (value: unknown) => {
		const next = normalizedValue(value);
		if (propertyCommit?.onCommitChange) {
			propertyCommit.onCommitChange(layer, group, key as never, next as never);
		} else {
			commit(next);
		}
	};
	const pickColorVariable = (variableId: string) => {
		variables?.bind(layer.id, { group, key }, variableId);
	};
	const promoteColor = () => {
		const seed = rawValue ?? spec.default;
		if (typeof seed !== 'string') return;
		variables?.createAndBind({ name: key, type: 'color', value: seed }, layer.id, { group, key });
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

<div class="group/property flex flex-col">
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
		{onReset}
	>
		{#if key === 'visibility'}
			<Switch
				{label}
				checked={rawValue !== 'none'}
				onCheckedChange={(checked) => commit(checked ? undefined : 'none')}
			/>
		{:else if isColorRamp}
			<div
				class="flex h-[30px] min-w-0 flex-row items-center"
				style="column-gap: var(--field-column-gap, 0px)"
			>
				<span
					class="shrink-0 truncate font-mono text-[10px] font-normal text-ink-2"
					style="width: var(--field-label-width, 84px)"
					title={label}>{label}</span
				>
				<Button
					aria-label={`${label} の式を追加`}
					class="flex h-6 min-w-24 flex-1 items-center justify-center gap-1 rounded-[6px] bg-field px-2 text-[10px] font-semibold text-ink-2 hover:shadow-[inset_0_0_0_1px_var(--color-accent)]"
					onclick={(event) => {
						expressionChange(spec.default);
						flyout?.open({ group, key, label }, event.currentTarget);
					}}
				>
					<Plus size={14} weight="regular" aria-hidden="true" />
					追加
				</Button>
			</div>
		{:else if specLiteralFieldKind !== undefined}
			<SpecLiteralField
				{label}
				{spec}
				value={rawValue}
				onChange={commit}
				onTransientChange={transientChange}
				onCommit={commitTransient}
				onTransientCancel={propertyCommit?.onCancelTransient}
				onPickVariable={spec.type === 'color' ? pickColorVariable : undefined}
				onPromoteColor={spec.type === 'color' && variables !== undefined ? promoteColor : undefined}
			/>
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
				class="h-6 self-end rounded-[5px] px-2 text-[10px] font-semibold text-ink-3 opacity-0 group-hover/property:opacity-100 hover:bg-field hover:text-ink-1 focus-visible:opacity-100"
				aria-expanded={showTransition}
				onclick={() => (showTransition = !showTransition)}
			>
				トランジション…
			</Button>
			{#if showTransition}
				<div class="flex flex-col gap-1 border-l-2 border-hairline-soft pl-3">
					<NumberField
						label="継続時間"
						value={transitionValue(rawTransitionValue).duration}
						minValue={0}
						description="ms"
						onValueChange={(duration) => {
							commitTransition(duration, transitionValue(rawTransitionValue).delay);
						}}
					/>
					<NumberField
						label="遅延"
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
