<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type {
		SourceSpecification,
		SourceSpecification as MapLibreSourceSpecification,
		StyleSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import { SvelteSet } from 'svelte/reactivity';

	import { Button } from '$lib/components/common/Button';
	import { CodeEditor } from '$lib/components/common/CodeEditor';
	import { Select } from '$lib/components/common/Select';
	import { TextField } from '$lib/components/common/TextField';
	import { validateMapStyle } from '$lib/utils/styleValidation.ts';

	type AddableSourceType = 'vector' | 'raster' | 'raster-dem' | 'geojson';
	type EditableSourceType = SourceSpecification['type'];

	const editableSourceTypes: EditableSourceType[] = [
		'vector',
		'raster',
		'raster-dem',
		'geojson',
		'video',
		'image'
	];
	const addableSourceTypes: AddableSourceType[] = ['vector', 'raster', 'raster-dem', 'geojson'];
	const sourceTemplates: Record<AddableSourceType, SourceSpecification> = {
		vector: { type: 'vector', tiles: ['https://example.com/tiles/{z}/{x}/{y}.pbf'] },
		raster: {
			type: 'raster',
			tiles: ['https://example.com/tiles/{z}/{x}/{y}.png'],
			tileSize: 256
		},
		'raster-dem': {
			type: 'raster-dem',
			tiles: ['https://example.com/dem/{z}/{x}/{y}.png'],
			tileSize: 256
		},
		geojson: {
			type: 'geojson',
			data: { type: 'FeatureCollection', features: [] }
		}
	};

	let {
		open = $bindable(false),
		mapStyle,
		onApply
	}: {
		open?: boolean;
		mapStyle: StyleSpecification;
		onApply: (next: StyleSpecification) => void;
	} = $props();

	const editingSourceIds = new SvelteSet<string>();
	let editValues = $state<Record<string, string>>({});
	let editErrors = $state<Record<string, string | undefined>>({});
	let editWarnings = $state<Record<string, string[]>>({});
	let addSourceId = $state('');
	let addSourceType = $state<AddableSourceType>('vector');
	let addSourceTouched = $state(false);
	let attemptedSubmit = $state(false);

	const sourceEntries = $derived(Object.entries(mapStyle.sources));
	const sourceIds = $derived(new Set(Object.keys(mapStyle.sources)));
	const trimmedAddSourceId = $derived(addSourceId.trim());
	const addSourceError = $derived.by(() => {
		if (trimmedAddSourceId === '') return 'Source ID is required.';
		if (sourceIds.has(trimmedAddSourceId)) return 'Source ID must be unique.';
		return undefined;
	});
	const showAddSourceError = $derived(
		addSourceError !== undefined && (addSourceTouched || attemptedSubmit)
	);

	const sourceLayerIds = (sourceId: string): string[] =>
		mapStyle.layers
			.filter((layer) => 'source' in layer && layer.source === sourceId)
			.map((layer) => layer.id);

	const reset = () => {
		editingSourceIds.clear();
		editValues = {};
		editErrors = {};
		editWarnings = {};
		addSourceId = '';
		addSourceType = 'vector';
		addSourceTouched = false;
		attemptedSubmit = false;
	};

	const sourceJSON = (source: SourceSpecification): string => JSON.stringify(source, null, '\t');
	const sourceSummary = (source: SourceSpecification): string | undefined => {
		switch (source.type) {
			case 'vector':
			case 'raster':
			case 'raster-dem':
				return source.url ?? source.tiles?.[0];
			case 'geojson':
				return typeof source.data === 'string' ? source.data : undefined;
			default:
				return undefined;
		}
	};

	const toggleEdit = (sourceId: string, source: SourceSpecification) => {
		if (editingSourceIds.has(sourceId)) {
			editingSourceIds.delete(sourceId);
			return;
		}
		editingSourceIds.add(sourceId);
		editValues[sourceId] = sourceJSON(source);
		editErrors[sourceId] = undefined;
		editWarnings[sourceId] = [];
	};

	const candidateWithSource = (
		sourceId: string,
		source: MapLibreSourceSpecification
	): StyleSpecification => {
		const current = $state.snapshot(mapStyle as object) as StyleSpecification;
		return {
			...current,
			sources: {
				...current.sources,
				[sourceId]: source
			}
		};
	};

	const parseSource = (sourceId: string): SourceSpecification | undefined => {
		let parsed: unknown;
		try {
			parsed = JSON.parse(editValues[sourceId] ?? '');
		} catch (error) {
			editErrors[sourceId] =
				`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`;
			return undefined;
		}

		if (
			typeof parsed !== 'object' ||
			parsed === null ||
			!('type' in parsed) ||
			typeof parsed.type !== 'string' ||
			!editableSourceTypes.includes(parsed.type as EditableSourceType)
		) {
			editErrors[sourceId] = 'Source JSON must be an object with a valid type.';
			return undefined;
		}

		editErrors[sourceId] = undefined;
		return parsed as SourceSpecification;
	};

	const applySourceEdit = (sourceId: string) => {
		const parsed = parseSource(sourceId);
		if (!parsed) return;
		const candidate = candidateWithSource(sourceId, parsed);
		editWarnings[sourceId] = validateMapStyle(candidate).styleErrors.filter((error) =>
			error.startsWith('sources.')
		);
		onApply(candidate);
	};

	const deleteSource = (sourceId: string) => {
		const current = $state.snapshot(mapStyle as object) as StyleSpecification;
		const sources = { ...current.sources };
		delete sources[sourceId];
		editingSourceIds.delete(sourceId);
		delete editValues[sourceId];
		delete editErrors[sourceId];
		delete editWarnings[sourceId];
		onApply({ ...current, sources });
	};

	const addSource = () => {
		attemptedSubmit = true;
		if (addSourceError) return;
		const source = structuredClone(sourceTemplates[addSourceType]);
		const candidate = candidateWithSource(trimmedAddSourceId, source);
		onApply(candidate);
		editingSourceIds.add(trimmedAddSourceId);
		editValues[trimmedAddSourceId] = sourceJSON(source);
		editErrors[trimmedAddSourceId] = undefined;
		editWarnings[trimmedAddSourceId] = [];
		addSourceId = '';
		addSourceType = 'vector';
		addSourceTouched = false;
		attemptedSubmit = false;
	};

	const cancel = () => {
		open = false;
		reset();
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-40 bg-gray-950/35 backdrop-blur-[1px]" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[min(94vw,52rem)] -translate-1/2 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xl shadow-gray-950/20"
		>
			<div class="border-b border-gray-200 px-4 py-3">
				<div class="flex flex-col gap-1">
					<Dialog.Title class="font-montserrat text-base font-semibold text-gray-950">
						Sources
					</Dialog.Title>
					<p class="text-xs font-medium text-gray-500">
						Manage source JSON. Rename is not supported.
					</p>
				</div>
			</div>

			<div class="flex flex-1 flex-col gap-3 overflow-auto px-4 py-4">
				{#each sourceEntries as [sourceId, source] (sourceId)}
					{@const usedBy = sourceLayerIds(sourceId)}
					{@const summary = sourceSummary(source)}
					<div class="overflow-hidden rounded-md border border-gray-200 bg-white">
						<div class="flex items-center gap-3 bg-gray-50/70 px-3 py-2">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<p class="truncate text-sm font-semibold text-gray-800">{sourceId}</p>
									<span
										class="rounded-sm border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-gray-500"
									>
										{source.type}
									</span>
								</div>
								<p class="flex min-w-0 items-center gap-1 text-xs text-gray-500">
									<span class="shrink-0">
										{usedBy.length} referencing layer{usedBy.length === 1 ? '' : 's'}
									</span>
									{#if summary}
										<span aria-hidden="true">·</span>
										<span class="truncate" title={summary}>{summary}</span>
									{/if}
								</p>
							</div>
							<Button
								class="h-7 rounded-md border border-gray-200 bg-white px-2 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50"
								onclick={() => toggleEdit(sourceId, source)}
							>
								{editingSourceIds.has(sourceId) ? 'Hide' : 'Edit'}
							</Button>
							<Button
								class="h-7 rounded-md px-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent"
								disabled={usedBy.length > 0}
								title={usedBy.length > 0
									? `Used by ${usedBy.length} layers: ${usedBy.join(', ')}`
									: undefined}
								onclick={() => deleteSource(sourceId)}
							>
								Delete
							</Button>
						</div>

						{#if editingSourceIds.has(sourceId)}
							<div class="flex flex-col gap-3 border-t border-gray-200 p-3">
								<CodeEditor
									class="min-h-56 rounded-md border border-gray-200"
									value={editValues[sourceId] ?? sourceJSON(source)}
									onChange={(value) => {
										editValues[sourceId] = value;
										editErrors[sourceId] = undefined;
									}}
								/>
								{#if editErrors[sourceId]}
									<p class="text-xs text-red-600" role="alert">{editErrors[sourceId]}</p>
								{/if}
								{#if editWarnings[sourceId]?.length}
									<div
										class="flex flex-col gap-1 rounded border border-yellow-300 bg-yellow-50 px-3 py-2"
									>
										<p class="text-xs font-semibold text-yellow-700">
											{editWarnings[sourceId].length} source validation error{editWarnings[sourceId]
												.length === 1
												? ''
												: 's'} found
										</p>
										{#each editWarnings[sourceId].slice(0, 10) as warning, index (warning + index)}
											<p class="text-xs break-words text-yellow-700">{warning}</p>
										{/each}
									</div>
								{/if}
								<div class="flex justify-end">
									<Button
										class="h-8 rounded-md bg-gray-900 px-3 text-xs font-semibold text-white hover:bg-gray-700"
										onclick={() => applySourceEdit(sourceId)}
									>
										Apply Source
									</Button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<div class="border-t border-gray-200 bg-gray-50 px-4 py-3">
				<div class="flex flex-col gap-2">
					<h3 class="font-montserrat text-sm font-semibold text-gray-800">Add Source</h3>
					<div class="flex items-start gap-2">
						<div class="flex min-w-0 flex-1 flex-col gap-1">
							<TextField
								class="[&>input]:w-[70%]"
								label="ID"
								bind:value={addSourceId}
								onValueChange={() => {
									addSourceTouched = true;
								}}
								onCommit={() => {
									addSourceTouched = true;
								}}
							/>
							{#if showAddSourceError}
								<p class="self-end text-xs text-red-600" role="alert">{addSourceError}</p>
							{/if}
						</div>
						<Select
							class="w-52 [&>button]:w-32"
							label="Type"
							items={addableSourceTypes.map((type) => ({ value: type, label: type }))}
							bind:value={addSourceType}
							onValueChange={(value) => (addSourceType = value as AddableSourceType)}
						/>
						<Button
							class="h-8 rounded-md bg-gray-900 px-3 text-xs font-semibold whitespace-nowrap text-white hover:bg-gray-700 disabled:cursor-default disabled:bg-gray-300"
							disabled={addSourceError !== undefined}
							onclick={addSource}
						>
							Add
						</Button>
					</div>
				</div>
			</div>

			<div class="flex justify-end border-t border-gray-200 bg-white px-4 py-3">
				<Button
					class="h-8 rounded-md px-3 text-xs font-semibold text-gray-600 hover:bg-gray-100"
					onclick={cancel}
				>
					Close
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
