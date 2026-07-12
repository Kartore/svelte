<script lang="ts">
	import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { MonacoEditor } from '$lib/components/common/MonacoEditor';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		layer,
		class: className,
		schema,
		children,
		onChange,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: LayerSpecification;
		schema?: object;
		onChange?: onChangeType;
		children?: Snippet;
	} = $props();
</script>

<div {...props} class={cn('flex flex-col gap-2 px-4', className)}>
	<h3 class="font-montserrat text-sm font-semibold">Raw Data Editor (Advanced)</h3>

	<MonacoEditor
		class={cn('min-h-40', className)}
		value={JSON.stringify(layer, undefined, 2)}
		modelUri={`kartore://layer/${encodeURIComponent(layer.id)}.json`}
		onChange={(value) => {
			if (onChange && value) onChange(layer, 'all', undefined, JSON.parse(value));
		}}
		onMount={(_, monaco) => {
			// monaco-editor 0.55: `monaco.languages.json` is a deprecated type stub — the
			// typed equivalent of `monaco.languages.json.jsonDefaults` is `monaco.json.jsonDefaults`
			monaco.json.jsonDefaults.setDiagnosticsOptions({
				validate: true,
				schemas: [
					{
						fileMatch: ['kartore://layer/*.json'],
						uri: 'kartore://schema.json',
						schema: schema
					}
				]
			});
		}}
	/>
	{@render children?.()}
</div>
