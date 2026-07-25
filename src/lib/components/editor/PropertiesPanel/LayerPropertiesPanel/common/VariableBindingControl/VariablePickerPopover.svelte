<script lang="ts">
	import { Button } from '$lib/components/common/Button';
	import { ColorSwatch } from '$lib/components/common/ColorField/ColorSwatch';
	import { Popover } from '$lib/components/common/Popover';
	import { useStyleVariables } from '$lib/contexts/styleVariables.svelte.ts';
	import type { StyleVariableType } from '$lib/utils/styleVariables.ts';

	let {
		type,
		currentValue,
		onPick,
		onCreateFromValue
	}: {
		type: StyleVariableType;
		currentValue: unknown;
		onPick: (variableId: string) => void;
		onCreateFromValue?: () => void;
	} = $props();

	const context = useStyleVariables();
	const matchingVariables = $derived(
		(context?.variables ?? []).filter((variable) => variable.type === type)
	);
	let open = $state(false);

	const pick = (variableId: string) => {
		onPick(variableId);
		open = false;
	};

	const createFromValue = () => {
		onCreateFromValue?.();
		open = false;
	};

	const formatValue = (value: unknown): string => {
		if (value === undefined) return '(unset)';
		const serialized = JSON.stringify(value);
		return serialized === undefined ? String(value) : serialized;
	};
</script>

<Popover
	bind:open
	aria-label={`Bind ${type} style variable`}
	triggerClass="flex items-center justify-center rounded px-1 py-0.5 font-mono text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 aria-expanded:bg-blue-50 aria-expanded:text-blue-600"
	contentClass="w-64 max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl shadow-gray-950/15"
>
	{#snippet trigger()}
		<span aria-hidden="true">◇</span>
	{/snippet}

	<div class="border-b border-gray-200 bg-gray-50 px-3 py-2">
		<p class="text-xs font-semibold text-gray-700">Style variables</p>
		<p class="mt-0.5 text-[10px] text-gray-500">{type}</p>
	</div>

	<div class="max-h-56 overflow-y-auto p-1">
		{#if matchingVariables.length === 0}
			<p class="px-2 py-4 text-center text-xs text-gray-400">No {type} variables.</p>
		{:else}
			{#each matchingVariables as variable (variable.id)}
				<Button
					class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-gray-100"
					onclick={() => pick(variable.id)}
				>
					{#if variable.type === 'color'}
						<ColorSwatch
							class="h-4 w-4 shrink-0 rounded-sm border border-gray-200"
							color={variable.value}
						/>
					{:else}
						<span
							class="max-w-20 shrink-0 truncate rounded bg-gray-100 px-1 py-0.5 font-mono text-[9px] text-gray-500"
							title={formatValue(variable.value)}
						>
							{formatValue(variable.value)}
						</span>
					{/if}
					<span class="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700">
						{variable.name}
					</span>
				</Button>
			{/each}
		{/if}
	</div>

	{#if onCreateFromValue}
		<div class="border-t border-gray-200 p-1">
			<Button
				class="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50"
				onclick={createFromValue}
			>
				<span>+ Create from current value</span>
				<span class="max-w-20 truncate font-mono text-[9px] text-gray-400">
					{formatValue(currentValue)}
				</span>
			</Button>
		</div>
	{/if}
</Popover>
