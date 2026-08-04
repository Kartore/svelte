import { getContext, setContext } from 'svelte';

import type { onChangeType } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/utils/LayerUtil/LayerUtil.ts';

export type PropertyCommitContext = {
	onTransientChange?: onChangeType;
	onCommitChange?: onChangeType;
	onCancelTransient?: () => void;
};

const KEY = Symbol('property-commit');

export const providePropertyCommit = (context: PropertyCommitContext): PropertyCommitContext =>
	setContext(KEY, context);

export const usePropertyCommit = (): PropertyCommitContext | undefined => getContext(KEY);
