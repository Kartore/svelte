import { getContext, setContext } from 'svelte';

import type { SpriteImage } from '#lib/components/editor/PropertiesPanel/LayerPropertiesPanel/hooks/useSpriteIds/useSpriteIds.svelte.ts';

const KEY = Symbol('expression-sprite-images');

export const provideSpriteImages = (get: () => SpriteImage[] | undefined) => {
	setContext(KEY, get);
};

/** Returns a getter so asynchronously loaded sprite metadata remains reactive for consumers. */
export const useSpriteImages = (): (() => SpriteImage[] | undefined) =>
	getContext<(() => SpriteImage[] | undefined) | undefined>(KEY) ?? (() => undefined);
