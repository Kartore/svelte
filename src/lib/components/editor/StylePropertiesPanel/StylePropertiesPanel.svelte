<script lang="ts">
	import type { StyleSpecification } from 'maplibre-gl';

	import { Button } from '$lib/components/common/Button';
	import { NumberField } from '$lib/components/common/NumberField';
	import { Select } from '$lib/components/common/Select';
	import { TextField } from '$lib/components/common/TextField';
	import { RootPropertyField } from '$lib/components/editor/StylePropertiesPanel/RootPropertyField';
	import { getRootProperties, type RootPropertyKind } from '$lib/utils/layerSpec.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		mapStyle,
		styleErrors,
		onChangeRoot,
		onSetRootObject
	}: {
		class?: string;
		mapStyle: StyleSpecification;
		styleErrors: string[];
		onChangeRoot?: (kind: RootPropertyKind, key: string, value: unknown) => void;
		onSetRootObject?: (kind: RootPropertyKind, value: object | undefined) => void;
	} = $props();

	const lightProperties = getRootProperties('light');
	const skyProperties = getRootProperties('sky');
	// Keep this list in sync with MapLibre GL JS projection presets when upgrading maplibre-gl.
	const projectionItems = [
		{ value: 'mercator', label: 'mercator (default)' },
		{ value: 'globe', label: 'globe' },
		{ value: 'vertical-perspective', label: 'vertical-perspective' }
	];

	const projectionType = $derived(mapStyle.projection?.type as unknown);
	const terrainObject = $derived(mapStyle.terrain as Record<string, unknown> | undefined);
	const terrainSource = $derived(
		typeof terrainObject?.source === 'string' ? terrainObject.source : undefined
	);
	const rasterDemSourceIds = $derived(
		Object.entries(mapStyle.sources)
			.filter(([, source]) => source.type === 'raster-dem')
			.map(([sourceId]) => sourceId)
	);
	const terrainSourceItems = $derived.by(() => {
		const items = [
			{ value: '', label: 'None' },
			...rasterDemSourceIds.map((sourceId) => ({
				value: sourceId,
				label: sourceId
			}))
		];
		if (terrainSource && !rasterDemSourceIds.includes(terrainSource)) {
			items.unshift({
				value: terrainSource,
				label: `${terrainSource} (missing)`
			});
		}
		return items;
	});
	const terrainExaggeration = $derived(
		typeof terrainObject?.exaggeration === 'number' ? terrainObject.exaggeration : 1
	);

	let confirmingRemoveSky = $state(false);

	const getRootPropertyValue = (kind: RootPropertyKind, key: string): unknown => {
		return (mapStyle[kind] as Record<string, unknown> | undefined)?.[key];
	};
	const fallbackValue = (value: unknown) => {
		if (value === undefined) return '';
		const json = JSON.stringify(value);
		return json === undefined ? String(value) : json;
	};
</script>

<div
	data-properties-panel=""
	class={cn(
		'pointer-events-auto overflow-y-auto rounded-lg border border-gray-300/80 bg-white py-4 shadow-lg shadow-gray-950/10 backdrop-blur',
		className
	)}
>
	{#if styleErrors.length > 0}
		<div
			class="mx-4 mb-4 flex flex-col gap-1 rounded-md border border-red-300 bg-red-50 px-3 py-2"
			role="alert"
		>
			<h3 class="font-montserrat text-sm font-semibold text-red-600">
				{styleErrors.length} error{styleErrors.length === 1 ? '' : 's'} in this style
			</h3>
			{#each styleErrors as error, index (error + index)}
				<p class="text-xs break-words text-red-600">{error}</p>
			{/each}
		</div>
	{/if}

	<div class="flex flex-col gap-6">
		<section class="flex flex-col gap-2 px-4">
			<h3 class="font-montserrat text-sm font-semibold">Projection</h3>
			{#if projectionType === undefined || typeof projectionType === 'string'}
				<Select
					label="Type"
					items={projectionItems}
					value={projectionType ?? 'mercator'}
					onValueChange={(value) => {
						if (value === 'mercator') {
							onSetRootObject?.('projection', undefined);
						} else {
							onSetRootObject?.('projection', { type: value });
						}
					}}
				/>
			{:else}
				<TextField label="Type" value={fallbackValue(projectionType)} disabled />
			{/if}
		</section>

		<section class="flex flex-col gap-2 px-4">
			<h3 class="font-montserrat text-sm font-semibold">Light</h3>
			{#each lightProperties as entry (entry.key)}
				<RootPropertyField
					{entry}
					value={getRootPropertyValue('light', entry.key)}
					onChange={(value) => onChangeRoot?.('light', entry.key, value)}
				/>
			{/each}
		</section>

		<section class="flex flex-col gap-2 px-4">
			<h3 class="font-montserrat text-sm font-semibold">Sky</h3>
			{#if mapStyle.sky === undefined}
				<div class="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2">
					<p class="text-xs font-medium text-gray-500">Sky is not rendered until added.</p>
					<Button
						class="h-8 shrink-0 rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50"
						onclick={() => onSetRootObject?.('sky', {})}
					>
						Add sky
					</Button>
				</div>
			{:else}
				{#each skyProperties as entry (entry.key)}
					<RootPropertyField
						{entry}
						value={getRootPropertyValue('sky', entry.key)}
						onChange={(value) => onChangeRoot?.('sky', entry.key, value)}
					/>
				{/each}
				{#if confirmingRemoveSky}
					<div class="rounded-md border border-red-200 bg-red-50 px-3 py-2">
						<p class="mb-2 text-xs font-semibold text-red-700">Remove sky permanently?</p>
						<div class="flex justify-end gap-2">
							<Button
								class="h-8 rounded-md px-3 text-xs font-semibold text-gray-600 hover:bg-red-100"
								onclick={() => (confirmingRemoveSky = false)}
							>
								Cancel
							</Button>
							<Button
								class="h-8 rounded-md bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-500"
								onclick={() => {
									confirmingRemoveSky = false;
									onSetRootObject?.('sky', undefined);
								}}
							>
								Remove
							</Button>
						</div>
					</div>
				{:else}
					<div class="flex justify-end rounded-md bg-gray-50 px-3 py-2">
						<Button
							class="h-8 rounded-md px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
							onclick={() => (confirmingRemoveSky = true)}
						>
							Remove sky
						</Button>
					</div>
				{/if}
			{/if}
		</section>

		<section class="flex flex-col gap-2 px-4">
			<h3 class="font-montserrat text-sm font-semibold">Terrain</h3>
			{#if rasterDemSourceIds.length === 0 && terrainObject === undefined}
				<p class="rounded-md bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
					Add a raster-dem source to enable terrain.
				</p>
			{:else}
				<Select
					label="Source"
					items={terrainSourceItems}
					value={terrainSource ?? ''}
					onValueChange={(source) => {
						if (source === '') {
							onSetRootObject?.('terrain', undefined);
						} else {
							onSetRootObject?.('terrain', {
								...terrainObject,
								source
							});
						}
					}}
				/>
			{/if}
			{#if terrainObject !== undefined}
				<NumberField
					label="Exaggeration"
					value={terrainExaggeration}
					minValue={0}
					description="×"
					onValueChange={(value) =>
						onChangeRoot?.('terrain', 'exaggeration', value === 1 ? undefined : value)}
				/>
			{/if}
		</section>
	</div>
</div>
