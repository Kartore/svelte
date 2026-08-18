<script lang="ts">
	import type { LayerSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
	import { ArrowRight, CaretDown, FunctionIcon, Plus, Trash } from 'phosphor-svelte';
	import { onDestroy, onMount, tick } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import type * as maplibregl from 'maplibre-gl';

	import { Button } from '#lib/components/common/Button';
	import { ColorSwatch } from '#lib/components/common/ColorField/ColorSwatch';
	import InterpolationsInputField from '#lib/components/common/FilterInputField/expressions/curves/interpolations/InterpolationsInputField.svelte';
	import { NumberField } from '#lib/components/common/NumberField';
	import { Select } from '#lib/components/common/Select';
	import { TextField } from '#lib/components/common/TextField';
	import { useBackgroundMap } from '#lib/contexts/backgroundMap.svelte.ts';
	import { useStyleVariables } from '#lib/contexts/styleVariables.svelte.ts';
	import {
		COLOR_VISION_MODE_LABELS,
		findColorVisionWarnings,
		type ColorVisionWarning
	} from '#lib/utils/colorVision.ts';
	import {
		COLOR_MERGE_DELTA_E,
		canonicalizeStyleColor,
		extractLiteralColors,
		isColorWithinDeltaE,
		replaceDirectColorUsages,
		variableUsageTargets,
		type LiteralColorEntry
	} from '#lib/utils/palette.ts';
	import {
		bindProperty,
		isLegacyVariableName,
		suggestModernVariableName,
		upsertVariable,
		type StyleVariable,
		type StyleVariableType
	} from '#lib/utils/styleVariables.ts';
	import {
		activateStyleVariableMode,
		duplicateStyleVariableMode,
		getStyleVariableModes
	} from '#lib/utils/variableModes.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	import InlineColorEditor from './InlineColorEditor.svelte';

	type VariableGroupNode = {
		path: string;
		label: string;
		depth: number;
		children: VariableGroupNode[];
		variables: { variable: StyleVariable; label: string }[];
	};
	type VariableTreeRow =
		| { kind: 'group'; node: VariableGroupNode }
		| { kind: 'variable'; variable: StyleVariable; label: string; depth: number };
	type PaletteSelection =
		{ kind: 'variable'; id: string } | { kind: 'literal'; canonicalColor: string };
	const SYMBOL_PAINT_PROPERTIES = [
		'text-color',
		'text-halo-color',
		'text-halo-width',
		'icon-color'
	] as const;
	type SymbolPaintProperty = (typeof SYMBOL_PAINT_PROPERTIES)[number];

	const HIGHLIGHT_PREFIX = 'kartore-palette-highlight-';
	const LITERAL_SWATCH_SIZE = 20;
	const LITERAL_GAP = 6;
	const LITERAL_HORIZONTAL_PADDING = 16;

	let {
		mapStyle,
		readOnly = false,
		onApplyStyle,
		onSelectLayer,
		onSelectionChange
	}: {
		mapStyle: StyleSpecification;
		readOnly?: boolean;
		onApplyStyle: (style: StyleSpecification) => void;
		onSelectLayer: (layerId: string) => void;
		onSelectionChange?: (label: string | null) => void;
	} = $props();

	const context = useStyleVariables();
	const backgroundMap = useBackgroundMap();
	const collapsedGroups = new SvelteSet<string>();
	const highlightLayerIds = new SvelteSet<string>();
	const symbolPaintBackups = new SvelteMap<string, SvelteMap<SymbolPaintProperty, unknown>>();
	let search = $state('');
	let adding = $state(false);
	let addName = $state('color/new');
	let addType = $state<StyleVariableType>('color');
	let selection = $state<PaletteSelection>();
	let colorVisionWarningId = $state<string>();
	let pendingDeleteId = $state<string>();
	let modesOpen = $state(false);
	let selectedDetailElement = $state<HTMLElement>();
	let literalGridWidth = $state(0);
	let colorHighlightEnabled = $state(false);
	let attachedMap: maplibregl.Map | null = null;
	let mapAttachTimer: ReturnType<typeof setTimeout> | undefined;
	let highlightTimer: ReturnType<typeof setTimeout> | undefined;

	const variables = $derived(context?.variables ?? []);
	const editable = $derived(!readOnly && (context?.isEditable ?? false));
	const literals = $derived(extractLiteralColors(mapStyle));
	const colorVisionEntries = $derived.by(() => [
		...variables.flatMap((variable) =>
			variable.type === 'color'
				? [
						{
							id: `variable:${variable.id}`,
							label: variable.name,
							color: variable.value,
							layerIds: [
								...new Set(
									variableUsageTargets(mapStyle, variable.id).map(({ layerId }) => layerId)
								)
							]
						}
					]
				: []
		),
		...literals.map((literal) => ({
			id: `literal:${literal.canonicalColor}`,
			label: literal.canonicalColor,
			color: literal.color,
			layerIds: [...new Set(literal.usages.map(({ layerId }) => layerId))]
		}))
	]);
	const colorVisionWarnings = $derived(findColorVisionWarnings(colorVisionEntries));
	const selectedColorVisionWarning = $derived(
		colorVisionWarnings.find(({ id }) => id === colorVisionWarningId)
	);
	const selectedVariable = $derived.by(() => {
		const current = selection;
		return current?.kind === 'variable' ? variables.find(({ id }) => id === current.id) : undefined;
	});
	const selectedLiteral = $derived.by(() => {
		const current = selection;
		return current?.kind === 'literal'
			? literals.find(({ canonicalColor }) => canonicalColor === current.canonicalColor)
			: undefined;
	});
	const selectedColorVariable = $derived(
		selectedVariable?.type === 'color' ? selectedVariable : undefined
	);
	const hasSelectedColor = $derived(Boolean(selectedColorVariable || selectedLiteral));
	const variableUsages = $derived(
		selectedVariable ? variableUsageTargets(mapStyle, selectedVariable.id) : []
	);
	const selectedLayerIds = $derived(
		(selectedColorVisionWarning
			? [...selectedColorVisionWarning.left.layerIds, ...selectedColorVisionWarning.right.layerIds]
			: selectedVariable
				? variableUsages.map(({ layerId }) => layerId)
				: (selectedLiteral?.usages.map(({ layerId }) => layerId) ?? [])
		).filter((layerId, index, values) => values.indexOf(layerId) === index)
	);
	const selectionHighlightLayerIds = $derived(
		hasSelectedColor && !colorHighlightEnabled ? [] : selectedLayerIds
	);
	const modes = $derived(getStyleVariableModes(mapStyle));

	const variableTreeRows = $derived.by((): VariableTreeRow[] => {
		const roots: VariableGroupNode[] = [];
		const rootVariables: { variable: StyleVariable; label: string }[] = [];
		for (const variable of variables) {
			if (
				search.trim() &&
				!`${variable.name} ${variable.type}`
					.toLocaleLowerCase()
					.includes(search.trim().toLocaleLowerCase())
			) {
				continue;
			}
			const parts = variable.name.split('/').filter(Boolean);
			if (parts.length < 2) {
				rootVariables.push({ variable, label: variable.name });
				continue;
			}
			let siblings = roots;
			let path = '';
			for (const [index, part] of parts.slice(0, -1).entries()) {
				path = path ? `${path}/${part}` : part;
				let node = siblings.find((item) => item.path === path);
				if (!node) {
					node = {
						path,
						label: part,
						depth: index,
						children: [],
						variables: []
					};
					siblings.push(node);
				}
				if (index === parts.length - 2) {
					node.variables.push({ variable, label: parts.at(-1)! });
				}
				siblings = node.children;
			}
		}
		const rows: VariableTreeRow[] = rootVariables
			.sort((left, right) => left.label.localeCompare(right.label))
			.map(({ variable, label }) => ({ kind: 'variable', variable, label, depth: 0 }));
		const flatten = (nodes: VariableGroupNode[]) => {
			for (const node of nodes.sort((left, right) => left.path.localeCompare(right.path))) {
				rows.push({ kind: 'group', node });
				if (collapsedGroups.has(node.path)) continue;
				for (const item of node.variables.sort((left, right) =>
					left.label.localeCompare(right.label)
				)) {
					rows.push({
						kind: 'variable',
						variable: item.variable,
						label: item.label,
						depth: node.depth + 1
					});
				}
				flatten(node.children);
			}
		};
		flatten(roots);
		return rows;
	});
	const visibleLiterals = $derived(
		literals.filter((entry) => {
			const query = search.trim().toLocaleLowerCase();
			return (
				query === '' ||
				`${entry.color} ${entry.usages.map(({ layerId, propertyKey }) => `${layerId} ${propertyKey}`).join(' ')}`
					.toLocaleLowerCase()
					.includes(query)
			);
		})
	);
	const literalColumns = $derived(
		Math.max(
			1,
			Math.floor(
				(Math.max(literalGridWidth - LITERAL_HORIZONTAL_PADDING, LITERAL_SWATCH_SIZE) +
					LITERAL_GAP) /
					(LITERAL_SWATCH_SIZE + LITERAL_GAP)
			)
		)
	);
	const literalRows = $derived.by(() => {
		const rows: LiteralColorEntry[][] = [];
		for (let index = 0; index < visibleLiterals.length; index += literalColumns) {
			rows.push(visibleLiterals.slice(index, index + literalColumns));
		}
		return rows;
	});
	const mergeSuggestions = $derived.by(() => {
		if (selectedLiteral) {
			return variables
				.filter(
					(variable): variable is Extract<StyleVariable, { type: 'color' }> =>
						variable.type === 'color' &&
						isColorWithinDeltaE(selectedLiteral.color, variable.value, COLOR_MERGE_DELTA_E)
				)
				.map((variable) => ({ variable, literal: selectedLiteral }));
		}
		if (selectedVariable?.type === 'color') {
			return literals
				.filter(
					(literal) =>
						literal.directUsages.length > 0 &&
						isColorWithinDeltaE(selectedVariable.value, literal.color, COLOR_MERGE_DELTA_E)
				)
				.map((literal) => ({ variable: selectedVariable, literal }));
		}
		return [];
	});

	const restoreSymbolHighlights = () => {
		const map = attachedMap;
		if (map) {
			for (const [layerId, properties] of symbolPaintBackups) {
				if (!map.getLayer(layerId)) continue;
				for (const [property, value] of properties) {
					try {
						map.setPaintProperty(layerId, property, (value ?? null) as never);
					} catch {
						// Style reloads can remove a layer before its temporary paint is restored.
					}
				}
			}
		}
		symbolPaintBackups.clear();
	};
	const clearHighlights = () => {
		const map = attachedMap;
		restoreSymbolHighlights();
		if (map) {
			for (const id of highlightLayerIds) {
				if (map.getLayer(id)) map.removeLayer(id);
			}
		}
		highlightLayerIds.clear();
	};
	const highlightSymbolLayer = (layerId: string, accent: string) => {
		const map = attachedMap;
		if (!map || !map.getLayer(layerId)) return;
		const values: Record<SymbolPaintProperty, string | number> = {
			'text-color': accent,
			'text-halo-color': 'rgba(255, 255, 255, 1)',
			'text-halo-width': 3,
			'icon-color': accent
		};
		const previous = new SvelteMap<SymbolPaintProperty, unknown>();
		try {
			for (const property of SYMBOL_PAINT_PROPERTIES) {
				previous.set(property, map.getPaintProperty(layerId, property));
			}
			symbolPaintBackups.set(layerId, previous);
			for (const property of SYMBOL_PAINT_PROPERTIES) {
				map.setPaintProperty(layerId, property, values[property] as never);
			}
		} catch {
			restoreSymbolHighlights();
		}
	};
	const highlightedLayer = (
		layer: LayerSpecification,
		id: string,
		accent: string
	): LayerSpecification | undefined => {
		if (layer.type === 'background') return undefined;
		const next = JSON.parse(JSON.stringify(layer)) as LayerSpecification;
		const record = next as unknown as Record<string, unknown>;
		record.id = id;
		switch (next.type) {
			case 'fill':
				record.paint = { ...(next.paint ?? {}), 'fill-color': accent, 'fill-opacity': 0.62 };
				break;
			case 'line':
				record.paint = { ...(next.paint ?? {}), 'line-color': accent, 'line-width': 5 };
				break;
			case 'circle':
				record.paint = {
					...(next.paint ?? {}),
					'circle-color': accent,
					'circle-radius': 7,
					'circle-opacity': 0.88
				};
				break;
			case 'symbol':
				return undefined;
			case 'fill-extrusion':
				record.paint = {
					...(next.paint ?? {}),
					'fill-extrusion-color': accent,
					'fill-extrusion-opacity': 0.72
				};
				break;
			case 'heatmap':
				record.paint = {
					...(next.paint ?? {}),
					'heatmap-color': [
						'interpolate',
						['linear'],
						['heatmap-density'],
						0,
						'transparent',
						1,
						accent
					]
				};
				break;
			case 'raster':
			case 'hillshade':
			case 'color-relief':
				return undefined;
		}
		return next;
	};
	const syncHighlights = (layerIds: string[]) => {
		const map = attachedMap;
		if (!map) return;
		clearHighlights();
		const accent = getComputedStyle(document.documentElement)
			.getPropertyValue('--color-accent')
			.trim();
		for (const [index, layerId] of layerIds.entries()) {
			const layer = mapStyle.layers.find(({ id }) => id === layerId);
			if (!layer || ('source' in layer && !map.getSource(layer.source))) continue;
			if (layer.type === 'symbol') {
				highlightSymbolLayer(layer.id, accent);
				continue;
			}
			const id = `${HIGHLIGHT_PREFIX}${index}`;
			const clone = highlightedLayer(layer, id, accent);
			if (!clone) continue;
			try {
				map.addLayer(clone);
				highlightLayerIds.add(id);
			} catch {
				// Style reloads can temporarily remove a source used by the selected layer.
			}
		}
	};
	const scheduleHighlightSync = (layerIds = selectionHighlightLayerIds) => {
		if (highlightTimer !== undefined) clearTimeout(highlightTimer);
		highlightTimer = setTimeout(() => {
			highlightTimer = undefined;
			syncHighlights(layerIds);
		}, 0);
	};
	const resetHighlightTrackingAfterStyleLoad = () => {
		highlightLayerIds.clear();
		symbolPaintBackups.clear();
	};
	const attachMap = () => {
		const map = backgroundMap.map;
		if (!map) {
			mapAttachTimer = setTimeout(attachMap, 50);
			return;
		}
		attachedMap = map;
		map.on('style.load', handleStyleLoad);
		scheduleHighlightSync();
	};
	const selectionLabelFor = (current: PaletteSelection | undefined): string | null =>
		current?.kind === 'variable'
			? (context?.variables.find(({ id }) => id === current.id)?.name ?? null)
			: (current?.canonicalColor ?? null);
	const isColorSelection = (current: PaletteSelection | undefined) =>
		current?.kind === 'literal' ||
		(current?.kind === 'variable' &&
			variables.find(({ id }) => id === current.id)?.type === 'color');
	const notifySelectionHighlight = (current: PaletteSelection | undefined) => {
		onSelectionChange?.(
			isColorSelection(current) && !colorHighlightEnabled ? null : selectionLabelFor(current)
		);
	};
	const select = (next: PaletteSelection | undefined) => {
		selection = next;
		colorHighlightEnabled = false;
		colorVisionWarningId = undefined;
		pendingDeleteId = undefined;
		notifySelectionHighlight(next);
		scheduleHighlightSync();
		void tick().then(() => selectedDetailElement?.scrollIntoView({ block: 'nearest' }));
	};
	const toggleColorHighlight = () => {
		if (!hasSelectedColor) return;
		colorHighlightEnabled = !colorHighlightEnabled;
		notifySelectionHighlight(selection);
		scheduleHighlightSync();
	};
	const registerSelectedDetail = (element: HTMLElement) => {
		selectedDetailElement = element;
		return () => {
			if (selectedDetailElement === element) selectedDetailElement = undefined;
		};
	};
	const colorVisionWarningLabel = (warning: ColorVisionWarning): string =>
		`${warning.left.label} / ${warning.right.label}（${COLOR_VISION_MODE_LABELS[warning.mode]}）`;
	const selectColorVisionWarning = (warning: ColorVisionWarning) => {
		const selected = colorVisionWarningId === warning.id;
		selection = undefined;
		colorHighlightEnabled = false;
		colorVisionWarningId = selected ? undefined : warning.id;
		pendingDeleteId = undefined;
		onSelectionChange?.(selected ? null : colorVisionWarningLabel(warning));
		scheduleHighlightSync(
			selected ? [] : [...new Set([...warning.left.layerIds, ...warning.right.layerIds])]
		);
	};
	const handleStyleLoad = () => {
		resetHighlightTrackingAfterStyleLoad();
		if (colorVisionWarningId) {
			const warning = colorVisionWarnings.find(({ id }) => id === colorVisionWarningId);
			if (!warning) {
				colorVisionWarningId = undefined;
				onSelectionChange?.(null);
				scheduleHighlightSync([]);
				return;
			}
			onSelectionChange?.(colorVisionWarningLabel(warning));
			scheduleHighlightSync([...new Set([...warning.left.layerIds, ...warning.right.layerIds])]);
			return;
		}
		const current = selection;
		const exists =
			current?.kind === 'variable'
				? context?.variables.some(({ id }) => id === current.id)
				: current?.kind === 'literal'
					? literals.some(({ canonicalColor }) => canonicalColor === current.canonicalColor)
					: true;
		if (!exists) {
			select(undefined);
			return;
		}
		notifySelectionHighlight(current);
		scheduleHighlightSync();
	};
	const renameVariable = (variable: StyleVariable, name: string) => {
		context?.rename(variable.id, name);
		notifySelectionHighlight({ kind: 'variable', id: variable.id });
	};
	const updateLiteralColor = (literal: LiteralColorEntry, value: string) => {
		const canonicalColor = canonicalizeStyleColor(value);
		onApplyStyle(replaceDirectColorUsages(mapStyle, literal.directUsages, value));
		if (canonicalColor) select({ kind: 'literal', canonicalColor });
	};
	const createVariable = () => {
		if (!context || !editable) return;
		const variable =
			addType === 'color'
				? context.create({ name: addName, type: addType, value: '#000000' })
				: addType === 'number'
					? context.create({ name: addName, type: addType, value: 0 })
					: context.create({ name: addName, type: addType, value: ['linear'] });
		adding = false;
		select({ kind: 'variable', id: variable.id });
	};
	const removeVariable = (variable: StyleVariable) => {
		if (!context || !editable) return;
		if (context.countUsages(variable.id) > 0 && pendingDeleteId !== variable.id) {
			pendingDeleteId = variable.id;
			return;
		}
		context.remove(variable.id);
		select(undefined);
	};
	const promoteLiteral = (literal: LiteralColorEntry) => {
		if (!editable || literal.directUsages.length === 0) return;
		const variable: StyleVariable = {
			id: crypto.randomUUID(),
			name: `color/${literal.canonicalColor.slice(1, 7).toLocaleLowerCase()}`,
			type: 'color',
			value: literal.color
		};
		let next = upsertVariable(mapStyle, variable);
		for (const usage of literal.directUsages) {
			next = bindProperty(
				next,
				usage.layerId,
				{ group: usage.group, key: usage.propertyKey },
				variable.id
			);
		}
		onApplyStyle(next);
		select({ kind: 'variable', id: variable.id });
	};
	const mergeLiteral = (
		literal: LiteralColorEntry,
		variable: Extract<StyleVariable, { type: 'color' }>
	) => {
		if (!editable) return;
		let next = mapStyle;
		for (const usage of literal.directUsages) {
			next = bindProperty(
				next,
				usage.layerId,
				{ group: usage.group, key: usage.propertyKey },
				variable.id
			);
		}
		onApplyStyle(next);
		select({ kind: 'variable', id: variable.id });
	};
	const addMode = () => {
		if (!editable) return;
		const name = modes.modes.length === 1 ? 'ダーク' : `モード ${modes.modes.length + 1}`;
		const duplicated = duplicateStyleVariableMode(mapStyle, name);
		onApplyStyle(activateStyleVariableMode(duplicated.style, duplicated.mode.id));
		modesOpen = false;
	};

	onMount(attachMap);
	onDestroy(() => {
		if (attachedMap) attachedMap.off('style.load', handleStyleLoad);
		clearHighlights();
		if (mapAttachTimer !== undefined) clearTimeout(mapAttachTimer);
		if (highlightTimer !== undefined) clearTimeout(highlightTimer);
		onSelectionChange?.(null);
	});
</script>

<aside class="relative flex w-60 shrink-0 flex-col border-r border-hairline bg-white">
	<header class="flex h-10 shrink-0 items-center gap-1.5 px-3">
		<h2 class="text-[12px] font-semibold text-ink-1">パレット</h2>
		<p class="text-[10.5px] text-ink-3">{variables.length}</p>
		<Button
			class="ml-auto flex size-6 items-center justify-center rounded-[5px] text-ink-2 hover:bg-field hover:text-ink-1 disabled:text-ink-4"
			aria-label="変数を追加"
			disabled={!editable}
			onclick={() => (adding = !adding)}
		>
			<Plus size={14} weight="regular" aria-hidden="true" />
		</Button>
	</header>

	<div class="shrink-0 px-2 pb-1.5">
		<TextField
			class="w-full [&>input]:h-[26px] [&>input]:w-full [&>input]:rounded-[6px] [&>input]:text-[11px] [&>input]:font-normal"
			aria-label="パレットを検索"
			placeholder="検索"
			value={search}
			onValueChange={(value) => (search = value)}
		/>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto">
		{#if adding}
			<div class="flex flex-col gap-1.5 border-b border-hairline-soft px-3 py-2">
				<TextField
					class="[&>input]:w-full"
					aria-label="変数名"
					placeholder="road/primary"
					value={addName}
					onValueChange={(value) => (addName = value)}
				/>
				<Select
					class="[&>button]:w-full"
					aria-label="変数の種類"
					items={[
						{ value: 'color', label: 'カラー' },
						{ value: 'number', label: '数値' },
						{ value: 'interpolation', label: '補間' }
					]}
					value={addType}
					onValueChange={(value) => {
						addType = value as StyleVariableType;
						addName = `${value}/new`;
					}}
				/>
				<Button
					class="h-6 rounded-[6px] bg-accent px-2 font-semibold text-white disabled:bg-ink-4"
					disabled={!addName.trim()}
					onclick={createVariable}
				>
					追加
				</Button>
			</div>
		{/if}

		<section class="px-2">
			<div class="flex h-[26px] items-center gap-1.5 px-2 text-[11px] text-ink-3">
				<h3>変数</h3>
				<span class="text-[10px] text-ink-4">{variables.length}</span>
			</div>
			{#if variableTreeRows.length === 0}
				<p class="px-3 py-4 text-center text-[10px] text-ink-3">変数はありません。</p>
			{/if}
			{#each variableTreeRows as row (row.kind === 'group' ? `group:${row.node.path}` : row.variable.id)}
				{#if row.kind === 'group'}
					<button
						type="button"
						class="flex h-[26px] w-full items-center gap-1.5 rounded-[5px] px-2 text-left text-[11px] font-normal text-ink-3 outline-none hover:bg-field focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]"
						style:padding-left={`${8 + row.node.depth * 12}px`}
						onclick={() => {
							if (collapsedGroups.has(row.node.path)) collapsedGroups.delete(row.node.path);
							else collapsedGroups.add(row.node.path);
						}}
					>
						<CaretDown
							size={10}
							weight="regular"
							class={cn('shrink-0', collapsedGroups.has(row.node.path) && '-rotate-90')}
							aria-hidden="true"
						/>
						<span class="truncate">{row.node.label}</span>
						<span class="text-[10px] text-ink-4">{row.node.variables.length}</span>
					</button>
				{:else}
					{@const selected = selection?.kind === 'variable' && selection.id === row.variable.id}
					<button
						type="button"
						class={cn(
							'flex h-8 w-full items-center gap-[9px] rounded-[5px] px-2 text-left text-[11px] outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]',
							selected ? 'bg-accent-soft text-ink-1' : 'text-ink-2 hover:bg-field'
						)}
						style:padding-left={`${8 + row.depth * 12}px`}
						onclick={() => select(selected ? undefined : { kind: 'variable', id: row.variable.id })}
					>
						{#if row.variable.type === 'color'}
							<ColorSwatch
								class="size-[18px] shrink-0 rounded-[4px] border border-black/5"
								color={row.variable.value}
							/>
						{/if}
						<span class="min-w-0 flex-1 truncate font-mono">{row.label}</span>
						<span class="text-[10px] text-ink-3">
							{context?.countUsages(row.variable.id) ?? 0}
						</span>
					</button>
					{#if selected}
						<div
							{@attach registerSelectedDetail}
							class="mx-2 mb-1.5 flex flex-col border-b border-hairline-soft pt-2.5 pb-0.5"
						>
							<TextField
								class="mb-2 [&>input]:w-full"
								label="名前"
								value={row.variable.name}
								disabled={!editable}
								onCommit={(name) => renameVariable(row.variable, name)}
							/>
							{#if isLegacyVariableName(row.variable.name)}
								<Button
									class="mb-2 h-5 px-0 text-left text-[10px] text-accent hover:bg-transparent"
									disabled={!editable}
									onclick={() =>
										renameVariable(row.variable, suggestModernVariableName(row.variable.name))}
								>
									{suggestModernVariableName(row.variable.name)} にリネーム
								</Button>
							{/if}
							{#if row.variable.type === 'color'}
								<InlineColorEditor
									value={row.variable.value}
									disabled={!editable}
									onChange={(value) => context?.updateValue(row.variable.id, value)}
								/>
								{#if variableUsages.length > 0}
									<Button
										class="h-6 self-start rounded-[5px] bg-field px-2 text-[10px] font-semibold text-ink-2 hover:text-ink-1"
										aria-pressed={colorHighlightEnabled}
										onclick={toggleColorHighlight}
									>
										{colorHighlightEnabled ? 'ハイライトを解除' : '使用箇所をハイライト'}
									</Button>
								{/if}
							{:else if row.variable.type === 'number'}
								<NumberField
									label="値"
									value={row.variable.value}
									disabled={!editable}
									onValueChange={(value) => context?.updateValue(row.variable.id, value)}
								/>
							{:else}
								<InterpolationsInputField
									class="w-full min-w-0 font-mono text-[10px]"
									value={row.variable.value}
									onChange={(value) => context?.updateValue(row.variable.id, value)}
								/>
							{/if}
							<div>
								<p class="mt-1.5 mb-0.5 text-[9.5px] text-ink-3">使用箇所</p>
								{#if variableUsages.length === 0}
									<p class="text-[10px] text-ink-3">使用なし</p>
								{:else}
									{#each variableUsages as usage (`${usage.layerId}:${usage.group}:${usage.propertyKey}`)}
										<button
											type="button"
											class="flex h-[22px] w-full items-center rounded-[4px] px-1 text-left font-mono text-[10px] text-ink-2 outline-none hover:bg-field hover:text-ink-1 focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]"
											onclick={() => onSelectLayer(usage.layerId)}
										>
											<span class="min-w-0 flex-1 truncate">
												{usage.layerId} ・ {usage.propertyKey}
											</span>
											<ArrowRight
												size={10}
												weight="regular"
												class="text-ink-4"
												aria-hidden="true"
											/>
										</button>
									{/each}
								{/if}
							</div>
							<div class="flex justify-end">
								<Button
									class="flex h-5 items-center gap-1 px-1 text-[9.5px] text-ink-3 hover:bg-field disabled:text-ink-4"
									disabled={!editable}
									onclick={() => removeVariable(row.variable)}
								>
									<Trash size={12} weight="regular" aria-hidden="true" />
									{pendingDeleteId === row.variable.id ? '使用箇所を外して削除' : '削除'}
								</Button>
							</div>
						</div>
					{/if}
				{/if}
			{/each}
		</section>

		<section class="px-2">
			<div class="flex h-[26px] items-center gap-1.5 px-2 text-[11px] text-ink-3">
				<h3>リテラル</h3>
				<span class="text-[10px] text-ink-4">{visibleLiterals.length}</span>
			</div>
			<div
				bind:clientWidth={literalGridWidth}
				class="grid gap-1.5 px-2 pt-1 pb-2"
				style:grid-template-columns={`repeat(${literalColumns}, minmax(0, 1fr))`}
			>
				{#each literalRows as row (row[0].canonicalColor)}
					{#each row as literal (literal.canonicalColor)}
						{@const selected =
							selection?.kind === 'literal' && selection.canonicalColor === literal.canonicalColor}
						<button
							type="button"
							class={cn(
								'relative size-5 rounded-[4px] border border-black/5 outline-none focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-accent',
								selected && 'outline-1 outline-offset-1 outline-accent'
							)}
							aria-label={`${literal.canonicalColor}、使用 ${literal.usages.length} 箇所`}
							title={`${literal.canonicalColor} · ${literal.usages.length} 箇所`}
							onclick={() =>
								select(
									selected ? undefined : { kind: 'literal', canonicalColor: literal.canonicalColor }
								)}
						>
							<ColorSwatch class="block size-full rounded-[3px]" color={literal.color} />
							{#if literal.expressionUsages.length > 0}
								<span
									class="absolute right-0 bottom-0 flex size-3 items-center justify-center rounded-tl-[5px] bg-white text-ink-2"
									title="式内にも存在"
								>
									<FunctionIcon size={9} weight="regular" aria-hidden="true" />
								</span>
							{/if}
						</button>
					{/each}
					{@const rowSelected = row.some(
						({ canonicalColor }) =>
							selection?.kind === 'literal' && canonicalColor === selection.canonicalColor
					)}
					{#if rowSelected && selectedLiteral}
						<div
							{@attach registerSelectedDetail}
							class="col-span-full flex flex-col gap-1.5 border-b border-hairline-soft pt-2 pb-2"
						>
							<p class="font-mono text-[11px] font-semibold text-ink-1">
								{selectedLiteral.canonicalColor}
							</p>
							{#if selectedLiteral.directUsages.length > 0}
								<InlineColorEditor
									value={selectedLiteral.color}
									disabled={!editable}
									onChange={(value) => updateLiteralColor(selectedLiteral, value)}
								/>
								<Button
									class="h-6 rounded-[5px] bg-field px-2 text-[10px] font-semibold text-ink-2 hover:text-ink-1 disabled:text-ink-4"
									disabled={!editable}
									onclick={() => promoteLiteral(selectedLiteral)}
								>
									変数に昇格 ({selectedLiteral.directUsages.length} 箇所)
								</Button>
							{/if}
							{#if selectedLiteral.usages.length > 0}
								<Button
									class="h-6 self-start rounded-[5px] bg-field px-2 text-[10px] font-semibold text-ink-2 hover:text-ink-1"
									aria-pressed={colorHighlightEnabled}
									onclick={toggleColorHighlight}
								>
									{colorHighlightEnabled ? 'ハイライトを解除' : '使用箇所をハイライト'}
								</Button>
							{/if}
							{#if selectedLiteral.expressionUsages.length > 0}
								<p class="text-[10px] text-ink-3">
									式内 {selectedLiteral.expressionUsages.length} 箇所は初期版では編集対象外です。
								</p>
							{/if}
							<div>
								<p class="mb-1 text-[10px] font-semibold text-ink-2">使用箇所</p>
								{#each selectedLiteral.usages as usage (`${usage.layerId}:${usage.group}:${usage.propertyKey}:${usage.inExpression}`)}
									<button
										type="button"
										class="flex h-5 w-full items-center gap-1 text-left font-mono text-[10px] text-ink-2 outline-none hover:text-ink-1 focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]"
										onclick={() => onSelectLayer(usage.layerId)}
									>
										<span class="min-w-0 flex-1 truncate">
											{usage.layerId} · {usage.propertyKey}
										</span>
										{#if usage.inExpression}<span class="shrink-0 text-ink-3">式内</span>{/if}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</section>

		<section class="px-2">
			<div class="flex h-[26px] items-center gap-1.5 px-2 text-[11px] text-ink-3">
				<h3>色覚チェック</h3>
				<span class="text-[10px] text-ink-4">{colorVisionWarnings.length}</span>
			</div>
			{#if colorVisionWarnings.length === 0}
				<p class="px-3 py-3 text-[10px] text-ink-3">識別性が失われる色ペアはありません。</p>
			{:else}
				<div class="px-1 pb-2">
					{#each colorVisionWarnings as warning (warning.id)}
						{@const selected = colorVisionWarningId === warning.id}
						<button
							type="button"
							class={cn(
								'flex min-h-8 w-full items-center gap-2 rounded-[5px] px-1.5 text-left outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]',
								selected ? 'bg-accent-soft' : 'hover:bg-field'
							)}
							aria-pressed={selected}
							title={`${warning.left.label} / ${warning.right.label} · ${COLOR_VISION_MODE_LABELS[warning.mode]} · ΔE ${warning.simulatedDeltaE.toFixed(1)}`}
							onclick={() => selectColorVisionWarning(warning)}
						>
							<span class="flex shrink-0 -space-x-1">
								<ColorSwatch
									class="size-4 rounded-[4px] border border-white"
									color={warning.left.color}
								/>
								<ColorSwatch
									class="size-4 rounded-[4px] border border-white"
									color={warning.right.color}
								/>
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate font-mono text-[9.5px] text-ink-2">
									{warning.left.label} / {warning.right.label}
								</span>
								<span class="block text-[9px] text-ink-3">
									{COLOR_VISION_MODE_LABELS[warning.mode]} · ΔE {warning.simulatedDeltaE.toFixed(1)}
								</span>
							</span>
						</button>
					{/each}
				</div>
			{/if}
		</section>

		{#if selection && mergeSuggestions.length > 0}
			<section class="mx-4 mt-2.5 rounded-[6px] border border-hairline px-2.5 py-2">
				<p class="mb-1 text-[10px] text-ink-3">近似色を統合</p>
				{#each mergeSuggestions as suggestion (`${suggestion.variable.id}:${suggestion.literal.canonicalColor}`)}
					<Button
						class="flex min-h-7 w-full items-center gap-2 rounded-[5px] px-1 text-left text-[10px] text-ink-2 hover:bg-field disabled:text-ink-4"
						disabled={!editable}
						onclick={() => mergeLiteral(suggestion.literal, suggestion.variable)}
					>
						<ColorSwatch
							class="size-4 shrink-0 rounded-[5px] border border-hairline"
							color={suggestion.variable.value}
						/>
						<span class="min-w-0 flex-1 truncate font-mono">
							{suggestion.literal.canonicalColor} → {suggestion.variable.name}
						</span>
						<span class="shrink-0">{suggestion.literal.directUsages.length} 箇所</span>
					</Button>
				{/each}
			</section>
		{/if}
	</div>

	{#if modesOpen}
		<div class="shrink-0 border-t border-hairline-soft bg-white p-1">
			{#each modes.modes as mode (mode.id)}
				<Button
					class={cn(
						'flex h-7 w-full items-center rounded-[6px] px-2 text-left text-[10px] text-ink-2 hover:bg-field',
						mode.id === modes.activeModeId && 'bg-accent-soft text-ink-1'
					)}
					onclick={() => {
						onApplyStyle(activateStyleVariableMode(mapStyle, mode.id));
						modesOpen = false;
					}}
				>
					{mode.name}
				</Button>
			{/each}
			<Button
				class="flex h-7 w-full items-center gap-1 rounded-[6px] px-2 text-left text-[10px] text-ink-2 hover:bg-field disabled:text-ink-4"
				disabled={!editable}
				onclick={addMode}
			>
				<Plus size={12} weight="regular" aria-hidden="true" />
				{modes.modes.length === 1 ? 'ダークモードを追加…' : 'モードを複製…'}
			</Button>
		</div>
	{/if}
	<footer
		class="flex h-8 shrink-0 items-center justify-between border-t border-hairline-soft px-3 text-[10px] text-ink-3"
	>
		<button
			type="button"
			class="h-6 cursor-pointer text-ink-2 outline-none hover:text-ink-1 focus-visible:text-accent"
			onclick={() => (modesOpen = !modesOpen)}
		>
			モード: {modes.modes.find(({ id }) => id === modes.activeModeId)?.name ?? 'ライト'}
		</button>
		<button
			type="button"
			class="h-6 cursor-pointer text-ink-3 outline-none hover:text-accent focus-visible:text-accent disabled:text-ink-4"
			disabled={!editable}
			onclick={addMode}
		>
			{modes.modes.length === 1 ? 'ダークモードを追加…' : 'モードを複製…'}
		</button>
	</footer>
</aside>
