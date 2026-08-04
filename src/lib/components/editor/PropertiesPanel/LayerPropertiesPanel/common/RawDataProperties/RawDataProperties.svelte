<script lang="ts">
	import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { CodeEditor } from '#lib/components/common/CodeEditor';
	import type { onChangeType } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		layer,
		class: className,
		children,
		onChange,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: LayerSpecification;
		onChange?: onChangeType;
		children?: Snippet;
	} = $props();
</script>

<div {...props} class={cn('flex flex-col px-3', className)}>
	<div class="flex h-7 items-center border-b border-hairline-soft">
		<h3 class="text-[11px] font-semibold text-ink-1">生データ編集(詳細)</h3>
	</div>

	<CodeEditor
		class={cn('my-2 min-h-40', className)}
		value={JSON.stringify(layer, undefined, 2)}
		onChange={(value) => {
			if (!onChange || !value) return;
			try {
				onChange(layer, 'all', undefined, JSON.parse(value));
			} catch {
				// Keep incomplete JSON as an editor-local draft until it parses again.
			}
		}}
	/>
	{@render children?.()}
</div>
