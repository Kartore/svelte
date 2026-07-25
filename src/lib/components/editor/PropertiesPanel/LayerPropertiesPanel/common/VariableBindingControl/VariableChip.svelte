<script lang="ts">
	import { Button } from '$lib/components/common/Button';
	import { ColorSwatch } from '$lib/components/common/ColorField/ColorSwatch';
	import type { StyleVariable } from '$lib/utils/styleVariables.ts';

	let {
		variable,
		stale,
		onDetach,
		onReapply
	}: {
		variable: StyleVariable;
		stale: boolean;
		onDetach: () => void;
		onReapply?: () => void;
	} = $props();
</script>

<div
	class="flex min-w-0 items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-1.5 py-1 text-xs text-blue-700"
	title={`Bound to style variable “${variable.name}”`}
>
	<span class="shrink-0 font-mono" aria-hidden="true">◇</span>
	{#if variable.type === 'color'}
		<ColorSwatch
			class="h-3.5 w-3.5 shrink-0 rounded-sm border border-blue-200"
			color={variable.value}
		/>
	{/if}
	<span class="min-w-0 flex-1 truncate font-semibold">{variable.name}</span>
	{#if stale}
		<span
			class="shrink-0 font-bold text-amber-600"
			title="The property value differs from the variable"
			aria-label="Binding is out of sync"
		>
			!
		</span>
		{#if onReapply}
			<Button
				class="shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-100"
				onclick={onReapply}
			>
				Reapply
			</Button>
		{/if}
	{/if}
	<Button
		class="shrink-0 rounded px-1 py-0.5 font-semibold text-blue-400 hover:bg-blue-100 hover:text-blue-700"
		aria-label={`Detach style variable ${variable.name}`}
		title="Detach variable"
		onclick={onDetach}
	>
		×
	</Button>
</div>
