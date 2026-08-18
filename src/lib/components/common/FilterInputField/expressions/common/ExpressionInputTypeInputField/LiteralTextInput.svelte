<script lang="ts" module>
	export const literalInputClassName =
		'h-6 min-w-0 max-w-full text-ellipsis rounded-[5px] border-none bg-[var(--expression-control-background,var(--color-field))] px-1 text-center font-mono text-[11px] font-normal text-ink-1 transition-colors focus-visible:outline-0';
</script>

<script lang="ts">
	import type { ExpressionInputType } from '@maplibre/maplibre-gl-style-spec';

	import type { ExpressionSuggestionValue } from '#lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';
	import { SuggestionTextInput } from '#lib/components/common/SuggestionTextInput';

	let {
		value,
		parse,
		onCommit,
		suggestions,
		'aria-label': ariaLabel
	}: {
		value: string;
		parse: (text: string) => ExpressionInputType | undefined;
		onCommit: (value: ExpressionInputType) => void;
		suggestions?: ExpressionSuggestionValue[];
		'aria-label'?: string;
	} = $props();

	// resets to the incoming value whenever the prop changes (React: useEffect + setDraft)
	let draft = $derived(value);
	const commit = (text = draft) => {
		const parsed = parse(text);
		if (parsed === undefined || parsed === value) {
			draft = value;
			return;
		}
		onCommit(parsed);
	};
	const handleKeyDown = (event: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
		if (event.key === 'Enter' && !event.isComposing) {
			event.currentTarget.blur();
		}
		if (event.key === 'Escape' && !event.isComposing) {
			draft = value;
		}
	};

	const hasSuggestions = $derived(suggestions !== undefined && suggestions.length > 0);
</script>

{#if hasSuggestions && suggestions}
	<SuggestionTextInput
		aria-label={ariaLabel ?? 'リテラル値'}
		value={draft}
		{suggestions}
		autoWidth
		inputClass={literalInputClassName}
		onValueChange={(text) => (draft = text)}
		onCommit={commit}
	/>
{:else}
	<input
		aria-label={ariaLabel ?? 'リテラル値'}
		class={literalInputClassName}
		style:width={`${Math.max(draft.length, 1) + 2}ch`}
		value={draft}
		oninput={(event) => (draft = event.currentTarget.value)}
		onblur={() => commit()}
		onkeydown={handleKeyDown}
	/>
{/if}
