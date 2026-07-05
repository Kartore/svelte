import type { SpriteSpecification } from '@maplibre/maplibre-gl-style-spec';

const fetchSpriteIds = async (url: SpriteSpecification | undefined): Promise<string[]> => {
	if (!url) return [];
	if (typeof url === 'string') {
		const response = await fetch(`${url}.json`);
		const data = (await response.json()) as Record<string, unknown>;

		return Object.keys(data);
	}
	if (Array.isArray(url)) {
		const ids = await Promise.all(
			url.map(async (sprite) => {
				const response = await fetch(`${sprite.url}.json`);
				const data = (await response.json()) as Record<string, unknown>;

				return Object.keys(data).map((id) => `${sprite.id}:${id}`);
			})
		);
		return ids.flat();
	}
	return [];
};

export const createSpriteIds = (getSprite: () => SpriteSpecification | undefined) => {
	let data = $state<string[] | undefined>(undefined);

	$effect(() => {
		const url = getSprite();
		data = undefined;
		let cancelled = false;
		void (async () => {
			try {
				const ids = await fetchSpriteIds(url);
				if (!cancelled) data = ids;
			} catch {
				// fetch/parse failure — keep data undefined
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	return {
		get spriteIds(): string[] | undefined {
			return data;
		}
	};
};
