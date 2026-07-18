import { getContext, setContext } from 'svelte';

import type { StyleHistoryProvider } from '$lib/editor/EditorModule.ts';

export class StyleHistoryContext {
	#providers = $state<StyleHistoryProvider[]>([]);

	register(provider: StyleHistoryProvider) {
		this.#providers = [...this.#providers, provider];
	}

	/** available な最初のプロバイダ。無ければ null */
	get provider(): StyleHistoryProvider | null {
		return this.#providers.find((provider) => provider.available) ?? null;
	}
}

const KEY = Symbol('style-history');

export const provideStyleHistory = (): StyleHistoryContext =>
	setContext(KEY, new StyleHistoryContext());

export const useStyleHistory = (): StyleHistoryContext | undefined => getContext(KEY);
