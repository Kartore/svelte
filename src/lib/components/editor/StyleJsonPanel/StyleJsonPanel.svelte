<script lang="ts">
	import type { StyleSpecification } from 'maplibre-gl';
	import { onDestroy } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { Button } from '$lib/components/common/Button';
	import { CodeEditor } from '$lib/components/common/CodeEditor';
	import {
		createStyleJsonDiagnostics,
		styleJsonCompletionSource,
		styleJsonHoverSource,
		type StyleJsonDiagnostic
	} from '$lib/utils/styleJsonLanguage.ts';
	import { findStyleLayerIdPosition } from '$lib/utils/styleJsonPosition.ts';
	import { parseStyleJSON, type StyleImportResult } from '$lib/utils/styleImport.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		mapStyle,
		selectedLayerId = null,
		layerSelectionRequest = 0,
		readOnly = false,
		onApply,
		...props
	}: HTMLAttributes<HTMLDivElement> & {
		class?: string;
		mapStyle: StyleSpecification;
		selectedLayerId?: string | null;
		layerSelectionRequest?: number;
		readOnly?: boolean;
		onApply: (style: StyleSpecification) => void;
	} = $props();

	// StyleSpecification is a recursive union, so widen before taking a snapshot.
	const serialized = $derived(JSON.stringify($state.snapshot(mapStyle as object), undefined, 2));
	let draft = $derived(serialized);
	let appliedDraft = $derived(serialized);
	const isDirty = $derived(draft !== appliedDraft);

	type DraftValidation = {
		draft: string;
		result: StyleImportResult;
		diagnostics: StyleJsonDiagnostic[];
	};
	let validation = $state<DraftValidation | null>(null);
	let validationTimer: ReturnType<typeof setTimeout> | undefined;
	const currentValidation = $derived(validation?.draft === draft ? validation : null);
	const validated = $derived(currentValidation?.result ?? null);
	const selectedLayerScrollTarget = $derived.by(() => {
		const layerId = selectedLayerId;
		if (!layerId) return undefined;
		return {
			request: `${layerSelectionRequest}:${layerId}`,
			findPosition: (value: string) => findStyleLayerIdPosition(value, layerId)
		};
	});

	const updateDraft = (next: string) => {
		draft = next;
		if (validationTimer !== undefined) clearTimeout(validationTimer);
		validationTimer = setTimeout(() => {
			const result = parseStyleJSON(next);
			let diagnostics: StyleJsonDiagnostic[] = [];
			if (result.ok) {
				diagnostics = createStyleJsonDiagnostics(next, result.warnings);
			} else if (!result.error.startsWith('Invalid JSON:')) {
				diagnostics = [
					{
						from: 0,
						to: Math.min(1, next.length),
						severity: 'error',
						message: result.error,
						source: 'MapLibre style'
					}
				];
			}
			validation = { draft: next, result, diagnostics };
			validationTimer = undefined;
			if (readOnly || draft !== next || !result.ok) return;

			const nextSerialized = JSON.stringify(result.style, undefined, 2);
			if (nextSerialized !== serialized) onApply(result.style);
			// onApply synchronously invalidates serialized. Override both derived values
			// afterwards so CodeMirror keeps the user's formatting and cursor position.
			draft = next;
			appliedDraft = next;
		}, 200);
	};

	const lintDraft = (value: string): StyleJsonDiagnostic[] =>
		validation?.draft === value ? validation.diagnostics : [];

	const revert = () => {
		if (readOnly) return;
		if (validationTimer !== undefined) clearTimeout(validationTimer);
		validationTimer = undefined;
		validation = null;
		draft = serialized;
		appliedDraft = serialized;
	};

	onDestroy(() => {
		if (validationTimer !== undefined) clearTimeout(validationTimer);
	});
</script>

<div
	{...props}
	data-style-json-panel=""
	class={cn(
		'pointer-events-auto flex min-h-0 flex-col overflow-hidden rounded-lg border border-gray-300/80 bg-white shadow-lg shadow-gray-950/10 backdrop-blur',
		className
	)}
>
	<div class="shrink-0 border-b border-gray-200 px-4 py-3">
		<div class="flex items-center justify-between gap-3">
			<div class="min-w-0">
				<h2 class="font-montserrat text-sm font-semibold text-gray-900">Style JSON</h2>
				<p class="truncate text-xs text-gray-500">Valid edits update the map automatically.</p>
			</div>
			{#if isDirty}
				<span
					class="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
				>
					Unapplied changes
				</span>
			{/if}
		</div>
	</div>

	<div class="min-h-0 flex-1">
		<CodeEditor
			value={draft}
			{readOnly}
			lint={lintDraft}
			lintVersion={validation}
			completionSource={styleJsonCompletionSource}
			hoverSource={styleJsonHoverSource}
			scrollTarget={selectedLayerScrollTarget}
			onChange={updateDraft}
		/>
	</div>

	<div
		class="max-h-[45%] shrink-0 overflow-y-auto border-t border-gray-200 bg-gray-50/70 px-4 py-3"
	>
		<div class="flex min-h-8 flex-wrap items-start gap-x-3 gap-y-2">
			<div class="min-w-0 flex-1 basis-64" aria-live="polite">
				{#if readOnly}
					<p class="text-xs text-blue-700">Preview mode — JSON editing is disabled.</p>
				{:else if isDirty && validated === null}
					<p class="text-xs text-gray-500">Validating style…</p>
				{:else if isDirty && validated?.ok === false}
					<p class="text-xs break-words text-red-600" role="alert">{validated.error}</p>
				{:else if validated?.ok === true && validated.warnings.length > 0}
					<p class="text-xs font-semibold text-amber-700">
						Applied with {validated.warnings.length} validation warning{validated.warnings
							.length === 1
							? ''
							: 's'}.
					</p>
				{:else}
					<p class="text-xs text-emerald-600">Valid changes are applied automatically.</p>
				{/if}

				{#if validated?.ok === true && validated.warnings.length > 0}
					<div
						class="mt-2 flex flex-col gap-1 rounded border border-amber-300 bg-amber-50 px-3 py-2"
					>
						{#each validated.warnings.slice(0, 10) as warning, index (warning + index)}
							<p class="text-xs break-words text-amber-700">{warning}</p>
						{/each}
						{#if validated.warnings.length > 10}
							<p class="text-xs font-semibold text-amber-700">
								+{validated.warnings.length - 10} more
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<div class="ml-auto flex shrink-0 items-center gap-1">
				<Button
					class="h-8 rounded px-2.5 text-xs font-semibold text-gray-500 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent"
					disabled={readOnly || !isDirty}
					onclick={revert}
				>
					Revert
				</Button>
			</div>
		</div>
	</div>
</div>
