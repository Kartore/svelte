<script lang="ts">
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

	import { Button } from '$lib/components/common/Button';
	import { CodeEditor } from '$lib/components/common/CodeEditor';
	import { parseExpressionJson } from '$lib/components/common/FilterInputField/expressions/utils/expressionJson.ts';
	import type { StylePropertySpec } from '$lib/utils/layerSpec.ts';

	let {
		value,
		propertySpec,
		onChange
	}: {
		value: ExpressionSpecification;
		propertySpec?: StylePropertySpec;
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const serializedValue = $derived(JSON.stringify(value, undefined, 2));
	let draft = $derived(serializedValue);
	const validation = $derived(parseExpressionJson(draft, propertySpec));
	const isDirty = $derived(draft !== serializedValue);

	const revert = () => {
		draft = serializedValue;
	};

	const apply = () => {
		if (!validation.ok || !isDirty) return;
		draft = JSON.stringify(validation.value, undefined, 2);
		onChange?.(validation.value);
	};
</script>

<div class="flex min-h-0 flex-1 flex-col gap-2">
	<div class="flex min-h-72 flex-1 overflow-hidden rounded-md border border-gray-200 bg-white">
		<CodeEditor
			class="min-h-72"
			value={draft}
			onChange={(next) => (draft = next)}
			onSubmit={apply}
		/>
	</div>

	<div class="flex min-h-8 flex-wrap items-start gap-x-3 gap-y-1">
		<div class="min-w-0 flex-1 basis-48">
			{#if validation.ok}
				<p class="text-xs text-emerald-600">
					{isDirty ? 'Valid expression — ready to apply.' : 'Expression is valid.'}
				</p>
			{:else}
				<p class="text-xs break-words text-red-600" role="alert">{validation.error}</p>
			{/if}
		</div>
		<div class="ml-auto flex shrink-0 items-center gap-1">
			<Button
				class="h-7 rounded px-2 text-xs font-semibold text-gray-500 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent"
				disabled={!isDirty}
				onclick={revert}
			>
				Revert
			</Button>
			<Button
				class="h-7 rounded bg-gray-700 px-2.5 text-xs font-semibold text-white hover:bg-gray-600 disabled:cursor-default disabled:bg-gray-200 disabled:text-gray-400"
				disabled={!isDirty || !validation.ok}
				title="Apply JSON (⌘/Ctrl+Enter)"
				onclick={apply}
			>
				Apply JSON
			</Button>
		</div>
	</div>
</div>
