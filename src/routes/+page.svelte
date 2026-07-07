<script lang="ts">
	import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

	import { isExpression } from '$lib/components/common/FilterInputField/expressions/utils/isExpression.ts';
	import { ControlPanel } from '$lib/components/editor/ControlPanel';
	import { ImportStyleDialog } from '$lib/components/editor/ImportStyleDialog';
	import { MapPanel } from '$lib/components/editor/MapPanel';
	import { NavigationPanel } from '$lib/components/editor/NavigationPanel';
	import { PropertiesPanel } from '$lib/components/editor/PropertiesPanel';
	import { ExpressionFlyoutPanel } from '$lib/components/editor/PropertiesPanel/ExpressionFlyoutPanel';
	import { isExpressionFilter } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/FilterProperties/utils/isExpressionFilter.ts';
	import type { onChangeType } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { replaceLayerData } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';
	import { provideBackgroundMap } from '$lib/contexts/backgroundMap.svelte.ts';
	import { provideExpressionFlyout } from '$lib/contexts/expressionFlyout.svelte.ts';
	import { osmLibertyMigrated } from '$lib/samples/osm-liberty.ts';
	import { localStorageMapStyleStoreAdapter, MapStyleStore } from '$lib/stores/mapStyle';
	import { validateMapStyle } from '$lib/utils/styleValidation.ts';

	const store = new MapStyleStore({
		adapter: localStorageMapStyleStoreAdapter,
		initialStyle: osmLibertyMigrated
	});

	provideBackgroundMap();
	const expressionFlyout = provideExpressionFlyout();

	let selectedLayerId = $state<string>(osmLibertyMigrated.layers[4].id);
	let importDialogOpen = $state(false);
	const selectedLayer = $derived(
		store.mapStyle.layers.find((layer) => layer.id === selectedLayerId) ?? store.mapStyle.layers[0]
	);
	const effectiveSelectedLayerId = $derived(selectedLayer?.id ?? null);

	// StyleSpecification は再帰 union のため Snapshot<T> の型展開を避けて widening する
	const validation = $derived(
		validateMapStyle($state.snapshot(store.mapStyle as object) as StyleSpecification)
	);

	const handleChangeLayerOrder = (layers: LayerSpecification[]) => {
		store.setMapStyle((currentStyle) => ({ ...currentStyle, layers }));
	};

	const handleChangeLayerData: onChangeType = (layer, group, key, value) => {
		store.setMapStyle((currentStyle) => replaceLayerData(currentStyle, layer, group, key, value));
	};

	const handleImport = (style: StyleSpecification) => {
		store.setMapStyle(style);
	};

	// 対象プロパティが expression でなくなったら (Reset された等) フライアウトは意味を失う
	const flyoutValue = $derived.by(() => {
		const target = expressionFlyout.target;
		if (!target || !selectedLayer) return undefined;
		if (target.group === 'filter') {
			return 'filter' in selectedLayer ? selectedLayer.filter : undefined;
		}
		return (
			selectedLayer[target.group as keyof LayerSpecification] as Record<string, unknown> | undefined
		)?.[target.key];
	});
	const flyoutVisible = $derived.by(() => {
		const target = expressionFlyout.target;
		if (target === null) return false;
		if (target.group === 'filter') {
			return flyoutValue !== undefined && isExpressionFilter(flyoutValue);
		}
		return isExpression(flyoutValue);
	});

	// レイヤーを切り替えたら編集中プロパティとの対応が切れるため閉じる
	$effect(() => {
		void effectiveSelectedLayerId;
		expressionFlyout.close();
	});
</script>

<svelte:head>
	<title>Kartore</title>
</svelte:head>

{#if store.isLoading}
	<div class="flex min-h-screen items-center justify-center text-sm text-gray-600">
		Loading map style...
	</div>
{:else}
	<div class="relative flex max-h-screen min-h-screen w-full flex-row overflow-hidden">
		<MapPanel mapStyle={store.mapStyle} />
		<div class="pointer-events-none absolute inset-2 flex gap-2">
			<NavigationPanel
				class="w-1/5"
				mapStyle={store.mapStyle}
				layerErrors={validation.layerErrors}
				onChangeLayerOrder={handleChangeLayerOrder}
				selectedLayerId={effectiveSelectedLayerId}
				onClickImport={() => (importDialogOpen = true)}
				onClickLayer={(layer) => {
					selectedLayerId = layer.id;
				}}
			/>

			<ControlPanel class="flex-1" />

			{#if flyoutVisible && expressionFlyout.target}
				<ExpressionFlyoutPanel
					class="w-1/4"
					layer={selectedLayer}
					target={expressionFlyout.target}
					errors={validation.layerErrors[selectedLayer.id]}
					onChange={handleChangeLayerData}
					onClose={() => expressionFlyout.close()}
				/>
			{/if}

			<PropertiesPanel
				class="w-2/5"
				sprite={store.mapStyle.sprite}
				layer={selectedLayer}
				sources={store.mapStyle.sources}
				errors={validation.layerErrors[selectedLayer.id]}
				onChange={handleChangeLayerData}
			/>
		</div>
		<ImportStyleDialog bind:open={importDialogOpen} onImport={handleImport} />
	</div>
{/if}
