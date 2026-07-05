<script lang="ts" module>
	export const literalInputClassName =
		'rounded border-none bg-gray-100 px-1 py-0.5 text-center font-semibold transition-colors hover:bg-gray-200 focus-visible:bg-gray-200 focus-visible:outline-0';
</script>

<script lang="ts">
	import type { ExpressionInputType } from '@maplibre/maplibre-gl-style-spec';

	import type { ExpressionSuggestionValue } from '$lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';

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
	const listId = $props.id();

	const commit = () => {
		const parsed = parse(draft);
		if (parsed === undefined || parsed === value) {
			draft = value;
			return;
		}
		onCommit(parsed);
	};
	const handleKeyDown = (event: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
		if (event.key === 'Enter') {
			event.currentTarget.blur();
		}
		if (event.key === 'Escape') {
			draft = value;
		}
	};

	const hasSuggestions = $derived(suggestions !== undefined && suggestions.length > 0);
</script>

<input
	aria-label={ariaLabel ?? 'literal value'}
	class={literalInputClassName}
	style:width={`${Math.max(draft.length, 1) + 2}ch`}
	value={draft}
	list={hasSuggestions ? listId : undefined}
	oninput={(event) => (draft = event.currentTarget.value)}
	onblur={commit}
	onkeydown={handleKeyDown}
/>
{#if suggestions !== undefined && suggestions.length > 0}
	<datalist id={listId}>
		{#each suggestions as suggestion (String(suggestion))}
			<option value={String(suggestion)}>{String(suggestion)}</option>
		{/each}
	</datalist>
{/if}
