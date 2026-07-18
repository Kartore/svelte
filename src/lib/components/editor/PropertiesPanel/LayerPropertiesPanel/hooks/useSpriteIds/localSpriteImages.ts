import { getContext, setContext } from 'svelte';

import type { SpriteImage } from './useSpriteIds.svelte.ts';

const KEY = Symbol('local-sprite-images');

export const provideLocalSpriteImages = (get: () => SpriteImage[]) => {
	setContext(KEY, get);
};

export const useLocalSpriteImages = (): (() => SpriteImage[]) => {
	return getContext<(() => SpriteImage[]) | undefined>(KEY) ?? (() => []);
};

export const mergeLocalSpriteImages = (
	localImages: SpriteImage[],
	fetchedImages: SpriteImage[]
): SpriteImage[] => {
	const localIds = new Set(localImages.map((image) => image.id));
	return [...localImages, ...fetchedImages.filter((image) => !localIds.has(image.id))];
};
