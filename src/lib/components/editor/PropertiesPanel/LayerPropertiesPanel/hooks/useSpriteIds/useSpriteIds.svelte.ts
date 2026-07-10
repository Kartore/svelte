import type { SpriteSpecification } from '@maplibre/maplibre-gl-style-spec';
import { createQuery } from '@tanstack/svelte-query';

export type SpriteImage = {
	id: string;
	src: string;
	x: number;
	y: number;
	width: number;
	height: number;
	pixelRatio: number;
};

type SpriteJSONEntry = {
	x?: unknown;
	y?: unknown;
	width?: unknown;
	height?: unknown;
	pixelRatio?: unknown;
};

const toSpriteImage = (
	id: string,
	src: string,
	entry: SpriteJSONEntry
): SpriteImage | undefined => {
	if (
		typeof entry.x !== 'number' ||
		typeof entry.y !== 'number' ||
		typeof entry.width !== 'number' ||
		typeof entry.height !== 'number'
	) {
		return undefined;
	}
	return {
		id,
		src,
		x: entry.x,
		y: entry.y,
		width: entry.width,
		height: entry.height,
		pixelRatio: typeof entry.pixelRatio === 'number' && entry.pixelRatio > 0 ? entry.pixelRatio : 1
	};
};

const fetchSpriteImages = async (url: SpriteSpecification | undefined): Promise<SpriteImage[]> => {
	if (!url) return [];
	if (typeof url === 'string') {
		const response = await fetch(`${url}.json`);
		const data = (await response.json()) as Record<string, SpriteJSONEntry>;

		return Object.entries(data)
			.map(([id, entry]) => toSpriteImage(id, `${url}.png`, entry))
			.filter((entry): entry is SpriteImage => entry !== undefined);
	}
	if (Array.isArray(url)) {
		const images = await Promise.all(
			url.map(async (sprite) => {
				const response = await fetch(`${sprite.url}.json`);
				const data = (await response.json()) as Record<string, SpriteJSONEntry>;

				return Object.entries(data)
					.map(([id, entry]) => toSpriteImage(`${sprite.id}:${id}`, `${sprite.url}.png`, entry))
					.filter((entry): entry is SpriteImage => entry !== undefined);
			})
		);
		return images.flat();
	}
	return [];
};

export const createSpriteIds = (getSprite: () => SpriteSpecification | undefined) => {
	const spriteKey = $derived.by(() => {
		const sprite = getSprite();
		if (!sprite) return [];
		return typeof sprite === 'string'
			? [{ id: 'default', url: sprite }]
			: sprite.map(({ id, url }) => ({ id, url }));
	});
	const query = createQuery(() => ({
		queryKey: ['sprite', spriteKey],
		queryFn: () => {
			const sprite = getSprite();
			return fetchSpriteImages(
				sprite == null ? undefined : ($state.snapshot(sprite as object) as SpriteSpecification)
			);
		}
	}));

	return {
		get spriteIds(): string[] | undefined {
			return query.data?.map((image) => image.id);
		},
		get spriteImages(): SpriteImage[] | undefined {
			return query.data;
		}
	};
};
