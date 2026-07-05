import { getContext, setContext } from 'svelte';

export type ExpressionSuggestionValue = string | number | boolean;
export type ExpressionSuggestions = {
	/** feature property keys available on the layer's source-layer */
	propertyKeys: { name: string; type?: string }[];
	/** distinct values observed for a property key (from loaded tiles — not exhaustive) */
	getValueSuggestions: (key: string) => ExpressionSuggestionValue[];
};

const KEY = Symbol('expression-suggestions');

// provider 側: リアクティビティを保つため getter を登録する
export const provideExpressionSuggestions = (get: () => ExpressionSuggestions | undefined) => {
	setContext(KEY, get);
};

// consumer 側: getter を受け取り、使う側で $derived(getter()) する
export const useExpressionSuggestions = (): (() => ExpressionSuggestions | undefined) => {
	return (
		getContext<(() => ExpressionSuggestions | undefined) | undefined>(KEY) ?? (() => undefined)
	);
};
