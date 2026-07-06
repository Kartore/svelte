<script lang="ts">
	import { useLayerErrors } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/LayerErrorsContext';

	let {
		group,
		property
	}: {
		/** 'paint' | 'layout' | 'filter' などのプロパティグループ */
		group: string;
		/** 省略時はグループ全体のエラーを表示する */
		property?: string;
	} = $props();

	const context = useLayerErrors();
	const errors = $derived(
		context.errors.filter(
			(error) => error.group === group && (property === undefined || error.property === property)
		)
	);
</script>

{#each errors as error (error.path + error.message)}
	<p class="text-xs text-red-600" role="alert">{error.message}</p>
{/each}
