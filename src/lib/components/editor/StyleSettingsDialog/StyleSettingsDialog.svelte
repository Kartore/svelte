<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { StyleSpecification } from 'maplibre-gl';
	import { untrack } from 'svelte';

	import { Button } from '$lib/components/common/Button';
	import { NumberField } from '$lib/components/common/NumberField';
	import { TextField } from '$lib/components/common/TextField';
	import { validateMapStyle } from '$lib/utils/styleValidation.ts';

	let {
		open = $bindable(false),
		mapStyle,
		onApply
	}: {
		open?: boolean;
		mapStyle: StyleSpecification;
		onApply: (next: StyleSpecification) => void;
	} = $props();

	const initialStyle = untrack(() => $state.snapshot(mapStyle as object) as StyleSpecification);
	let draftName = $state(initialStyle.name ?? '');
	let draftSprite = $state(typeof initialStyle.sprite === 'string' ? initialStyle.sprite : '');
	let draftGlyphs = $state(initialStyle.glyphs ?? '');
	let draftCenterLng = $state<number | undefined>(initialStyle.center?.[0]);
	let draftCenterLat = $state<number | undefined>(initialStyle.center?.[1]);
	let draftZoom = $state<number | undefined>(initialStyle.zoom);
	let draftBearing = $state<number | undefined>(initialStyle.bearing);
	let draftPitch = $state<number | undefined>(initialStyle.pitch);

	const spriteEditable = $derived(
		mapStyle.sprite === undefined || typeof mapStyle.sprite === 'string'
	);
	const spriteJSON = $derived(JSON.stringify(mapStyle.sprite, null, '\t'));

	const candidateStyle = (): StyleSpecification => {
		const current = $state.snapshot(mapStyle as object) as StyleSpecification;
		const next: StyleSpecification = { ...current };
		const trimmedName = draftName.trim();
		const trimmedGlyphs = draftGlyphs.trim();

		if (trimmedName === '') delete next.name;
		else next.name = trimmedName;

		if (spriteEditable) {
			const trimmedSprite = draftSprite.trim();
			if (trimmedSprite === '') delete next.sprite;
			else next.sprite = trimmedSprite;
		}

		if (trimmedGlyphs === '') delete next.glyphs;
		else next.glyphs = trimmedGlyphs;

		if (draftCenterLng !== undefined && draftCenterLat !== undefined) {
			next.center = [draftCenterLng, draftCenterLat];
		}
		if (draftZoom !== undefined) next.zoom = draftZoom;
		if (draftBearing !== undefined) next.bearing = draftBearing;
		if (draftPitch !== undefined) next.pitch = draftPitch;

		return next;
	};

	const styleErrors = $derived(validateMapStyle(candidateStyle()).styleErrors);

	const apply = () => {
		onApply(candidateStyle());
		open = false;
	};

	const cancel = () => {
		open = false;
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-40 bg-gray-950/35 backdrop-blur-[1px]" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[min(92vw,42rem)] -translate-1/2 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xl shadow-gray-950/20"
		>
			<div class="border-b border-gray-200 px-4 py-3">
				<div class="flex flex-col gap-1">
					<Dialog.Title class="font-montserrat text-base font-semibold text-gray-950">
						Style Settings
					</Dialog.Title>
					<p class="text-xs font-medium text-gray-500">Edit style metadata and default view.</p>
				</div>
			</div>

			<div class="flex flex-1 flex-col gap-5 overflow-auto px-4 py-4">
				<section class="flex flex-col gap-3">
					<div>
						<h3 class="font-montserrat text-sm font-semibold text-gray-800">Identity</h3>
						<p class="text-xs text-gray-500">Name and shared asset endpoints for this style.</p>
					</div>
					<div class="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50/60 p-3">
						<TextField class="[&>input]:w-[70%]" label="Name" bind:value={draftName} />
						{#if spriteEditable}
							<TextField class="[&>input]:w-[70%]" label="Sprite" bind:value={draftSprite} />
						{:else}
							<div class="flex flex-col gap-1">
								<div class="flex items-center justify-between gap-3">
									<p class="text-sm font-semibold text-gray-600">Sprite</p>
									<pre
										class="max-h-28 w-[70%] overflow-auto rounded border border-gray-200 bg-white px-2 py-1 text-xs whitespace-pre-wrap text-gray-600">{spriteJSON}</pre>
								</div>
								<p class="self-end text-xs text-gray-500">
									Multiple sprites are not editable here.
								</p>
							</div>
						{/if}
						<TextField
							class="[&>input]:w-[70%]"
							label="Glyphs"
							placeholder={'https://.../{fontstack}/{range}.pbf'}
							bind:value={draftGlyphs}
						/>
					</div>
				</section>

				<section class="flex flex-col gap-3">
					<div>
						<h3 class="font-montserrat text-sm font-semibold text-gray-800">Default View</h3>
						<p class="text-xs text-gray-500">Initial camera values used when the style opens.</p>
					</div>
					<div
						class="grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-gray-200 bg-gray-50/60 p-3"
					>
						<NumberField
							class="[&>div]:w-[52%]"
							label="Center Lng"
							value={draftCenterLng}
							minValue={-180}
							maxValue={180}
							onValueChange={(value) => (draftCenterLng = value)}
						/>
						<NumberField
							class="[&>div]:w-[52%]"
							label="Center Lat"
							value={draftCenterLat}
							minValue={-90}
							maxValue={90}
							onValueChange={(value) => (draftCenterLat = value)}
						/>
						<NumberField
							class="[&>div]:w-[52%]"
							label="Zoom"
							value={draftZoom}
							minValue={0}
							maxValue={24}
							onValueChange={(value) => (draftZoom = value)}
						/>
						<NumberField
							class="[&>div]:w-[52%]"
							label="Bearing"
							value={draftBearing}
							onValueChange={(value) => (draftBearing = value)}
						/>
						<NumberField
							class="[&>div]:w-[52%]"
							label="Pitch"
							value={draftPitch}
							onValueChange={(value) => (draftPitch = value)}
						/>
					</div>
				</section>

				{#if styleErrors.length > 0}
					<div class="flex flex-col gap-1 rounded border border-yellow-300 bg-yellow-50 px-3 py-2">
						<p class="text-xs font-semibold text-yellow-700">
							{styleErrors.length} validation error{styleErrors.length === 1 ? '' : 's'} found
						</p>
						{#each styleErrors.slice(0, 10) as error, index (error + index)}
							<p class="text-xs break-words text-yellow-700">{error}</p>
						{/each}
						{#if styleErrors.length > 10}
							<p class="text-xs text-yellow-700">+{styleErrors.length - 10} more</p>
						{/if}
					</div>
				{/if}
			</div>

			<div class="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
				<Button
					class="h-8 rounded-md px-3 text-xs font-semibold text-gray-600 hover:bg-gray-200"
					onclick={cancel}
				>
					Cancel
				</Button>
				<Button
					class="h-8 rounded-md bg-gray-900 px-3 text-xs font-semibold text-white hover:bg-gray-700"
					onclick={apply}
				>
					Apply
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
