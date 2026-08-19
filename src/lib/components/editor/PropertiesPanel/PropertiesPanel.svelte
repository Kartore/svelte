<script lang="ts">
	import type {
		LayerSpecification,
		SourceSpecification,
		SpriteSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import { tick, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';

	import { LayerPropertiesPanel } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel';
	import { PropertyCatalogPopover } from '#lib/components/editor/PropertiesPanel/PropertyCatalogPopover';
	import { provideRowPopover } from '#lib/contexts/rowPopover.svelte.ts';
	import { getLayerRawPropertyValue } from '#lib/utils/layerSpec.ts';
	import { getLayerPropertyCatalog, type PropertyCatalogItem } from '#lib/utils/propertyCatalog.ts';
	import type { onChangeType } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import type { LayerValidationError } from '#lib/utils/styleValidation.ts';
	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		class: className,
		sources,
		sprite,
		fontSuggestions,
		layer,
		errors,
		onChange,
		onTransientChange,
		onCommitChange,
		onCancelTransient,
		children,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		layer: LayerSpecification;
		sprite?: SpriteSpecification;
		fontSuggestions?: string[];
		sources: { [key: string]: SourceSpecification };
		errors?: LayerValidationError[];
		onChange?: onChangeType;
		onTransientChange?: onChangeType;
		onCommitChange?: onChangeType;
		onCancelTransient?: () => void;
		children?: Snippet;
	} = $props();

	let panelElement: HTMLDivElement | null = null;
	const setPanelElement: Attachment<HTMLDivElement> = (element) => {
		panelElement = element;
		return () => {
			if (panelElement === element) panelElement = null;
		};
	};
	provideRowPopover();
	const propertyCatalog = $derived(getLayerPropertyCatalog(layer.type));
	const configuredPropertyKeys = $derived(
		propertyCatalog
			.filter((item) => getLayerRawPropertyValue(layer, item.group, item.key) !== undefined)
			.map((item) => item.key)
	);
	const unsetPropertyCount = $derived(propertyCatalog.length - configuredPropertyKeys.length);
	const addProperty = async (item: PropertyCatalogItem, initialValue: unknown) => {
		onChange?.(layer, item.group, item.key as never, initialValue as never);
		await tick();
		const row = panelElement?.querySelector<HTMLElement>(
			`[data-property-row="${CSS.escape(`${item.group}:${item.key}`)}"]`
		);
		row?.scrollIntoView({ block: 'nearest' });
		row?.querySelector<HTMLElement>('input, button, [tabindex]')?.focus();
	};
</script>

<div
	{@attach setPanelElement}
	{...props}
	data-properties-panel=""
	class={cn('h-full overflow-y-auto bg-white', className)}
>
	{#if errors && errors.length > 0}
		<div class="mx-3 mb-2 flex flex-col gap-1 rounded-[6px] bg-field px-3 py-2" role="alert">
			<h3 class="flex items-center gap-1.5 text-[11px] font-semibold text-ink-1">
				<span class="size-1.5 shrink-0 rounded-full bg-danger"></span>
				{errors.length} 件の検証エラー
			</h3>
			{#each errors as error (error.path + error.message)}
				<div class="border-t border-hairline-soft pt-1 first:border-0 first:pt-0">
					<p class="text-[10px] break-words text-ink-2">
						{#if error.path}
							<span class="font-mono font-semibold text-ink-1">{error.path}:</span>
						{/if}
						{error.message}
					</p>
					<p class="mt-0.5 text-[10px] text-ink-3">
						値を有効な範囲へ修正するか、行の − で未設定に戻してください。
					</p>
				</div>
			{/each}
		</div>
	{/if}
	<LayerPropertiesPanel
		{layer}
		{sprite}
		{fontSuggestions}
		{sources}
		{errors}
		{onChange}
		{onTransientChange}
		{onCommitChange}
		{onCancelTransient}
	/>
	<div class="px-4 py-[3px]">
		<PropertyCatalogPopover
			{layer}
			exclude={configuredPropertyKeys}
			label="すべてのプロパティ"
			triggerText={`すべてのプロパティ(未設定 ${unsetPropertyCount})…`}
			triggerClass="h-6 justify-start px-0 text-[10.5px] font-normal hover:bg-transparent hover:text-accent"
			onSelect={addProperty}
		/>
	</div>
	{@render children?.()}
</div>
