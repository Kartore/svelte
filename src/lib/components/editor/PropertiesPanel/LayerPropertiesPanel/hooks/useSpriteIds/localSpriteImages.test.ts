import { describe, expect, it } from 'vitest';

import type { SpriteImage } from './useSpriteIds.svelte.ts';
import { mergeLocalSpriteImages } from './localSpriteImages.ts';

const image = (id: string, src: string): SpriteImage => ({
	id,
	src,
	x: 0,
	y: 0,
	width: 16,
	height: 16,
	pixelRatio: 1
});

describe('mergeLocalSpriteImages', () => {
	it('keeps local images first and preserves non-conflicting external sprites', () => {
		const local = [image('marker', 'local-marker'), image('local-only', 'local-only')];
		const fetched = [image('marker', 'external-marker'), image('external-only', 'external-only')];

		expect(mergeLocalSpriteImages(local, fetched)).toEqual([
			image('marker', 'local-marker'),
			image('local-only', 'local-only'),
			image('external-only', 'external-only')
		]);
	});
});
