<script lang="ts">
	import { Dialog } from 'bits-ui';

	import { BoxRadioGroup } from '$lib/components/common/BoxRadioGroup';
	import { Button } from '$lib/components/common/Button';
	import { ColorField } from '$lib/components/common/ColorField';
	import { ColorSwatch } from '$lib/components/common/ColorField/ColorSwatch';
	import { ConfirmDialog } from '$lib/components/common/ConfirmDialog';
	import InterpolationsInputField from '$lib/components/common/FilterInputField/expressions/curves/interpolations/InterpolationsInputField.svelte';
	import { NumberField } from '$lib/components/common/NumberField';
	import { TextField } from '$lib/components/common/TextField';
	import { useStyleVariables } from '$lib/contexts/styleVariables.svelte.ts';
	import type { StyleVariable, StyleVariableType } from '$lib/utils/styleVariables.ts';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const context = useStyleVariables();
	const typeGroups: { type: StyleVariableType; label: string }[] = [
		{ type: 'color', label: 'Colors' },
		{ type: 'number', label: 'Numbers' },
		{ type: 'interpolation', label: 'Interpolations' }
	];
	const addTypeItems = typeGroups.map(({ type, label }) => ({
		value: type,
		label: label.replace(/s$/, '')
	}));
	const variables = $derived(context?.variables ?? []);
	const editable = $derived(context?.isEditable ?? false);

	let addType = $state<StyleVariableType>('color');
	let pendingDelete = $state<StyleVariable | null>(null);
	let deleteConfirmOpen = $state(false);

	const variablesOfType = (type: StyleVariableType): StyleVariable[] =>
		variables.filter((variable) => variable.type === type);

	const addVariable = () => {
		if (!context) return;
		if (addType === 'color') {
			context.create({ name: 'Color', type: addType, value: '#000000' });
		} else if (addType === 'number') {
			context.create({ name: 'Number', type: addType, value: 0 });
		} else {
			context.create({ name: 'Interpolation', type: addType, value: ['linear'] });
		}
	};

	const requestDelete = (variable: StyleVariable) => {
		if (!context) return;
		if (context.countUsages(variable.id) === 0) {
			context.remove(variable.id);
			return;
		}
		pendingDelete = variable;
		deleteConfirmOpen = true;
	};

	const confirmDelete = () => {
		if (pendingDelete) context?.remove(pendingDelete.id);
		pendingDelete = null;
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-40 bg-gray-950/35 backdrop-blur-[1px]" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[min(94vw,58rem)] -translate-1/2 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xl shadow-gray-950/20"
		>
			<div class="border-b border-gray-200 px-4 py-3">
				<div class="flex flex-col gap-1">
					<Dialog.Title class="font-montserrat text-base font-semibold text-gray-950">
						Variables
					</Dialog.Title>
					<p class="text-xs font-medium text-gray-500">
						Reuse colors, numbers, and interpolation curves across layer properties.
					</p>
				</div>
			</div>

			{#if !context}
				<p class="px-4 py-8 text-center text-sm text-gray-500">Style variables are unavailable.</p>
			{:else}
				<div class="flex flex-1 flex-col gap-5 overflow-auto px-4 py-4">
					{#if !editable}
						<p
							class="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800"
						>
							Editing is disabled while previewing a revision.
						</p>
					{/if}

					{#each typeGroups as group (group.type)}
						{@const groupVariables = variablesOfType(group.type)}
						<section class="flex flex-col gap-2">
							<div class="flex items-center justify-between">
								<h2 class="font-montserrat text-sm font-semibold text-gray-800">
									{group.label}
								</h2>
								<span class="text-[11px] font-semibold text-gray-400">
									{groupVariables.length}
								</span>
							</div>

							{#if groupVariables.length === 0}
								<p
									class="rounded-md border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400"
								>
									No {group.label.toLowerCase()} yet.
								</p>
							{:else}
								<div class="flex flex-col gap-2">
									{#each groupVariables as variable (variable.id)}
										<fieldset
											disabled={!editable}
											class="grid grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)_auto] items-center gap-3 rounded-md border border-gray-200 bg-white p-3 disabled:opacity-60"
										>
											<div class="flex min-w-0 items-center gap-2">
												{#if variable.type === 'color'}
													<ColorSwatch
														class="h-6 w-6 shrink-0 rounded border border-gray-200"
														color={variable.value}
													/>
												{:else if variable.type === 'number'}
													<span
														class="min-w-10 rounded bg-gray-100 px-1.5 py-1 text-center font-mono text-xs text-gray-600"
													>
														{variable.value}
													</span>
												{:else}
													<span
														class="max-w-32 truncate rounded bg-gray-100 px-1.5 py-1 font-mono text-[11px] text-gray-600"
														title={JSON.stringify(variable.value)}
													>
														{JSON.stringify(variable.value)}
													</span>
												{/if}
												<TextField
													class="min-w-0 flex-1 [&>input]:w-full"
													aria-label={`${variable.type} variable name`}
													value={variable.name}
													onCommit={(name) => context.rename(variable.id, name)}
												/>
											</div>

											<div class="min-w-0">
												{#if variable.type === 'color'}
													<ColorField
														class="w-full [&>div]:w-full"
														value={variable.value}
														onChange={(color) => {
															if (color) context.updateValue(variable.id, color.toString('rgba'));
														}}
													/>
												{:else if variable.type === 'number'}
													<NumberField
														class="w-full [&>div]:w-full"
														value={variable.value}
														onValueChange={(value) => context.updateValue(variable.id, value)}
													/>
												{:else}
													<InterpolationsInputField
														class="w-full min-w-0 font-mono text-xs"
														value={variable.value}
														onChange={(value) => context.updateValue(variable.id, value)}
													/>
												{/if}
											</div>

											<div class="flex items-center justify-end gap-2">
												<span
													class="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold whitespace-nowrap text-gray-500"
													title="Bound properties"
												>
													{context.countUsages(variable.id)} used
												</span>
												<Button
													class="h-7 rounded-md px-2 text-xs font-semibold text-red-600 hover:bg-red-50"
													onclick={() => requestDelete(variable)}
												>
													Delete
												</Button>
											</div>
										</fieldset>
									{/each}
								</div>
							{/if}
						</section>
					{/each}
				</div>

				<fieldset
					disabled={!editable}
					class="flex items-center gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 disabled:opacity-60"
				>
					<BoxRadioGroup
						class="min-w-0 flex-1 [&_[role=radiogroup]]:w-auto"
						label="New variable"
						items={addTypeItems}
						value={addType}
						onValueChange={(value) => (addType = value as StyleVariableType)}
					/>
					<Button
						class="h-8 rounded-md bg-gray-900 px-3 text-xs font-semibold whitespace-nowrap text-white hover:bg-gray-700 disabled:cursor-default disabled:bg-gray-300"
						onclick={addVariable}
					>
						+ Add variable
					</Button>
				</fieldset>
			{/if}

			<div class="flex justify-end border-t border-gray-200 bg-white px-4 py-3">
				<Button
					class="h-8 rounded-md px-3 text-xs font-semibold text-gray-600 hover:bg-gray-100"
					onclick={() => (open = false)}
				>
					Close
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

{#if pendingDelete}
	<ConfirmDialog
		bind:open={deleteConfirmOpen}
		title={`Delete “${pendingDelete.name}”?`}
		description={`Detach ${context?.countUsages(pendingDelete.id) ?? 0} bound properties and delete this variable? Current property values will remain unchanged.`}
		confirmLabel="Delete variable"
		danger
		onConfirm={confirmDelete}
	/>
{/if}
