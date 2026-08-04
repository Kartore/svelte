<script lang="ts">
	import { useLayerErrors } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/LayerErrorsContext';

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
	<div class="flex items-start gap-1.5 rounded-[6px] bg-field px-2 py-1.5" role="alert">
		<span class="mt-1 size-1.5 shrink-0 rounded-full bg-danger"></span>
		<div class="min-w-0">
			<p class="text-[10px] leading-4 break-words text-ink-2">{error.message}</p>
			<p class="text-[10px] leading-4 text-ink-3">
				値を修正するか、行の − で未設定に戻してください。
			</p>
		</div>
	</div>
{/each}
