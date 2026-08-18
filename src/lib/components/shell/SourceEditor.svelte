<script lang="ts">
	import type { SourceSpecification } from '@maplibre/maplibre-gl-style-spec';

	import { NumberField } from '#lib/components/common/NumberField';
	import { NumberListField } from '#lib/components/common/NumberListField';
	import { Select } from '#lib/components/common/Select';
	import { Switch } from '#lib/components/common/Switch';
	import { TextField } from '#lib/components/common/TextField';

	type SourceRecord = Record<string, unknown>;
	type SourceType = SourceSpecification['type'];
	type Coordinates = [[number, number], [number, number], [number, number], [number, number]];

	const sourceTypeItems = [
		{ value: 'vector', label: 'vector' },
		{ value: 'raster', label: 'raster' },
		{ value: 'raster-dem', label: 'raster-dem' },
		{ value: 'geojson', label: 'geojson' },
		{ value: 'video', label: 'video' },
		{ value: 'image', label: 'image' }
	];
	const schemeItems = [
		{ value: 'xyz', label: 'xyz' },
		{ value: 'tms', label: 'tms' }
	];
	const vectorEncodingItems = [
		{ value: 'mvt', label: 'mvt' },
		{ value: 'mlt', label: 'mlt' }
	];
	const demEncodingItems = [
		{ value: 'mapbox', label: 'mapbox' },
		{ value: 'terrarium', label: 'terrarium' },
		{ value: 'custom', label: 'custom' }
	];
	const defaultCoordinates: Coordinates = [
		[0, 0],
		[1, 0],
		[1, 1],
		[0, 1]
	];

	let {
		source,
		readOnly = false,
		onChange
	}: {
		source: SourceSpecification;
		readOnly?: boolean;
		onChange: (source: SourceSpecification) => void;
	} = $props();

	const id = $props.id();
	const sourceDataText = $derived(
		source.type === 'geojson'
			? typeof source.data === 'string'
				? source.data
				: JSON.stringify(source.data, undefined, 2)
			: ''
	);
	const coordinateValues = $derived.by(() => {
		if (source.type !== 'video' && source.type !== 'image') return [];
		return source.coordinates.flatMap(([longitude, latitude]) => [longitude, latitude]);
	});

	const patch = (values: SourceRecord, remove: string[] = []) => {
		const next = structuredClone(source) as unknown as SourceRecord;
		for (const key of remove) Reflect.deleteProperty(next, key);
		Object.assign(next, values);
		onChange(next as SourceSpecification);
	};
	const commitOptionalString = (key: string, value: string) => {
		const trimmed = value.trim();
		patch(trimmed === '' ? {} : { [key]: trimmed }, trimmed === '' ? [key] : []);
	};
	const commitTileJsonUrl = (value: string) => {
		const trimmed = value.trim();
		patch(trimmed === '' ? {} : { url: trimmed }, trimmed === '' ? ['url'] : ['tiles']);
	};
	const commitTiles = (value: string) => {
		const tiles = value
			.split(/\r?\n/)
			.map((tile) => tile.trim())
			.filter(Boolean);
		patch(tiles.length > 0 ? { tiles } : {}, tiles.length > 0 ? ['url'] : ['tiles']);
	};
	const commitData = (value: string) => {
		const trimmed = value.trim();
		if (trimmed === '') return;
		try {
			const parsed = JSON.parse(trimmed) as unknown;
			if (typeof parsed === 'object' && parsed !== null) {
				patch({ data: parsed });
				return;
			}
		} catch {
			// GeoJSON URLs are plain strings, so invalid JSON is valid input here.
		}
		patch({ data: trimmed });
	};
	const commitBounds = (values: number[] | undefined) => {
		if (values === undefined) {
			patch({}, ['bounds']);
			return;
		}
		if (values.length !== 4) return;
		patch({ bounds: values });
	};
	const commitCoordinates = (values: number[] | undefined) => {
		if (values === undefined || values.length !== 8) return;
		const coordinates: Coordinates = [
			[values[0], values[1]],
			[values[2], values[3]],
			[values[4], values[5]],
			[values[6], values[7]]
		];
		patch({ coordinates });
	};
	const changeType = (value: string) => {
		const nextType = value as SourceType;
		if (nextType === source.type) return;
		const current = source as unknown as SourceRecord;
		const next: SourceRecord = { type: nextType };
		const copy = (key: string) => {
			if (current[key] !== undefined) next[key] = structuredClone(current[key]);
		};

		if (nextType === 'vector' || nextType === 'raster' || nextType === 'raster-dem') {
			for (const key of [
				'url',
				'tiles',
				'bounds',
				'minzoom',
				'maxzoom',
				'attribution',
				'volatile'
			]) {
				copy(key);
			}
			if (nextType === 'vector' || nextType === 'raster') copy('scheme');
			if (nextType === 'raster' || nextType === 'raster-dem') copy('tileSize');
			if (nextType === 'vector' && (current.encoding === 'mvt' || current.encoding === 'mlt')) {
				copy('encoding');
			}
			if (
				nextType === 'raster-dem' &&
				(current.encoding === 'terrarium' ||
					current.encoding === 'mapbox' ||
					current.encoding === 'custom')
			) {
				copy('encoding');
			}
			if (nextType === 'raster-dem') {
				for (const key of ['redFactor', 'blueFactor', 'greenFactor', 'baseShift']) copy(key);
			}
		} else if (nextType === 'geojson') {
			next.data =
				current.data !== undefined
					? structuredClone(current.data)
					: { type: 'FeatureCollection', features: [] };
			copy('maxzoom');
			copy('attribution');
		} else if (nextType === 'video') {
			next.urls = current.urls ? structuredClone(current.urls) : [''];
			next.coordinates = current.coordinates
				? structuredClone(current.coordinates)
				: structuredClone(defaultCoordinates);
		} else {
			next.url = typeof current.url === 'string' ? current.url : '';
			next.coordinates = current.coordinates
				? structuredClone(current.coordinates)
				: structuredClone(defaultCoordinates);
		}
		onChange(next as SourceSpecification);
	};
</script>

<div class="flex flex-col gap-1">
	<Select
		label="type"
		items={sourceTypeItems}
		value={source.type}
		disabled={readOnly}
		onValueChange={changeType}
	/>

	{#if source.type === 'vector' || source.type === 'raster' || source.type === 'raster-dem'}
		<TextField
			label="url"
			placeholder="TileJSON URL"
			value={source.url ?? ''}
			disabled={readOnly}
			onCommit={commitTileJsonUrl}
		/>
		<div class="flex flex-col gap-1">
			<label for={`${id}-tiles`} class="font-mono text-[10px] text-ink-2">tiles</label>
			<textarea
				id={`${id}-tiles`}
				class="min-h-10 w-full resize-y rounded-[5px] border-0 bg-field px-2 py-1 font-mono text-[10px] leading-4 text-ink-1 outline-none focus:shadow-[inset_0_0_0_1px_var(--color-accent)] disabled:text-ink-4"
				placeholder="1行に1つのタイル URL"
				spellcheck="false"
				disabled={readOnly}
				value={source.tiles?.join('\n') ?? ''}
				onblur={(event) => commitTiles(event.currentTarget.value)}></textarea>
		</div>
		<NumberListField
			label="bounds"
			values={source.bounds}
			minLength={4}
			maxLength={4}
			disabled={readOnly}
			aria-label="bounds（西, 南, 東, 北）"
			onChange={commitBounds}
		/>
		<div class="flex gap-1">
			<NumberField
				class="min-w-0 flex-1"
				label="minzoom"
				value={source.minzoom}
				minValue={0}
				maxValue={24}
				step={0.1}
				disabled={readOnly}
				onValueChange={(value) => patch({ minzoom: value })}
			/>
			<NumberField
				class="min-w-0 flex-1"
				label="maxzoom"
				value={source.maxzoom}
				minValue={0}
				maxValue={24}
				step={0.1}
				disabled={readOnly}
				onValueChange={(value) => patch({ maxzoom: value })}
			/>
		</div>
		{#if source.type === 'raster' || source.type === 'raster-dem'}
			<NumberField
				label="tileSize"
				value={source.tileSize}
				minValue={1}
				disabled={readOnly}
				onValueChange={(value) => patch({ tileSize: value })}
			/>
		{/if}
		{#if source.type === 'vector' || source.type === 'raster'}
			<Select
				label="scheme"
				items={schemeItems}
				value={source.scheme ?? 'xyz'}
				disabled={readOnly}
				onValueChange={(value) => patch({ scheme: value })}
			/>
		{/if}
		{#if source.type === 'vector'}
			<Select
				label="encoding"
				items={vectorEncodingItems}
				value={source.encoding ?? 'mvt'}
				disabled={readOnly}
				onValueChange={(value) => patch({ encoding: value })}
			/>
		{:else if source.type === 'raster-dem'}
			<Select
				label="encoding"
				items={demEncodingItems}
				value={source.encoding ?? 'mapbox'}
				disabled={readOnly}
				onValueChange={(value) => patch({ encoding: value })}
			/>
			{#if source.encoding === 'custom'}
				<NumberField
					label="redFactor"
					value={source.redFactor}
					disabled={readOnly}
					onValueChange={(value) => patch({ redFactor: value })}
				/>
				<NumberField
					label="greenFactor"
					value={source.greenFactor}
					disabled={readOnly}
					onValueChange={(value) => patch({ greenFactor: value })}
				/>
				<NumberField
					label="blueFactor"
					value={source.blueFactor}
					disabled={readOnly}
					onValueChange={(value) => patch({ blueFactor: value })}
				/>
				<NumberField
					label="baseShift"
					value={source.baseShift}
					disabled={readOnly}
					onValueChange={(value) => patch({ baseShift: value })}
				/>
			{/if}
		{/if}
		<TextField
			label="attribution"
			value={source.attribution ?? ''}
			disabled={readOnly}
			onCommit={(value) => commitOptionalString('attribution', value)}
		/>
		<Switch
			label="volatile"
			checked={source.volatile ?? false}
			disabled={readOnly}
			onCheckedChange={(checked) => patch({ volatile: checked })}
		/>
	{:else if source.type === 'geojson'}
		<div class="flex flex-col gap-1">
			<label for={`${id}-data`} class="font-mono text-[10px] text-ink-2">data</label>
			<textarea
				id={`${id}-data`}
				class="min-h-16 w-full resize-y rounded-[5px] border-0 bg-field px-2 py-1 font-mono text-[10px] leading-4 text-ink-1 outline-none focus:shadow-[inset_0_0_0_1px_var(--color-accent)] disabled:text-ink-4"
				placeholder="GeoJSON URL または GeoJSON オブジェクト"
				spellcheck="false"
				disabled={readOnly}
				value={sourceDataText}
				onblur={(event) => commitData(event.currentTarget.value)}></textarea>
		</div>
		<NumberField
			label="maxzoom"
			value={source.maxzoom}
			minValue={0}
			maxValue={24}
			step={0.1}
			disabled={readOnly}
			onValueChange={(value) => patch({ maxzoom: value })}
		/>
		<NumberField
			label="buffer"
			value={source.buffer}
			minValue={0}
			disabled={readOnly}
			onValueChange={(value) => patch({ buffer: value })}
		/>
		<NumberField
			label="tolerance"
			value={source.tolerance}
			minValue={0}
			disabled={readOnly}
			onValueChange={(value) => patch({ tolerance: value })}
		/>
		<Switch
			label="cluster"
			checked={source.cluster ?? false}
			disabled={readOnly}
			onCheckedChange={(checked) => patch({ cluster: checked })}
		/>
		{#if source.cluster}
			<NumberField
				label="clusterRadius"
				value={source.clusterRadius}
				minValue={1}
				disabled={readOnly}
				onValueChange={(value) => patch({ clusterRadius: value })}
			/>
			<NumberField
				label="clusterMaxZoom"
				value={source.clusterMaxZoom}
				minValue={0}
				maxValue={24}
				disabled={readOnly}
				onValueChange={(value) => patch({ clusterMaxZoom: value })}
			/>
			<NumberField
				label="clusterMinPoints"
				value={source.clusterMinPoints}
				minValue={2}
				disabled={readOnly}
				onValueChange={(value) => patch({ clusterMinPoints: value })}
			/>
		{/if}
		<Switch
			label="lineMetrics"
			checked={source.lineMetrics ?? false}
			disabled={readOnly}
			onCheckedChange={(checked) => patch({ lineMetrics: checked })}
		/>
		<Switch
			label="generateId"
			checked={source.generateId ?? false}
			disabled={readOnly}
			onCheckedChange={(checked) => patch({ generateId: checked })}
		/>
		<TextField
			label="attribution"
			value={source.attribution ?? ''}
			disabled={readOnly}
			onCommit={(value) => commitOptionalString('attribution', value)}
		/>
	{:else if source.type === 'video'}
		<div class="flex flex-col gap-1">
			<label for={`${id}-urls`} class="font-mono text-[10px] text-ink-2">urls</label>
			<textarea
				id={`${id}-urls`}
				class="min-h-10 w-full resize-y rounded-[5px] border-0 bg-field px-2 py-1 font-mono text-[10px] leading-4 text-ink-1 outline-none focus:shadow-[inset_0_0_0_1px_var(--color-accent)] disabled:text-ink-4"
				placeholder="1行に1つの動画 URL"
				spellcheck="false"
				disabled={readOnly}
				value={source.urls.join('\n')}
				onblur={(event) => {
					const urls = event.currentTarget.value
						.split(/\r?\n/)
						.map((url) => url.trim())
						.filter(Boolean);
					if (urls.length > 0) patch({ urls });
				}}></textarea>
		</div>
		<NumberListField
			label="coordinates"
			values={coordinateValues}
			minLength={8}
			maxLength={8}
			disabled={readOnly}
			onChange={commitCoordinates}
		/>
	{:else}
		<TextField
			label="url"
			value={source.url}
			disabled={readOnly}
			onCommit={(value) => commitOptionalString('url', value)}
		/>
		<NumberListField
			label="coordinates"
			values={coordinateValues}
			minLength={8}
			maxLength={8}
			disabled={readOnly}
			onChange={commitCoordinates}
		/>
	{/if}
</div>
