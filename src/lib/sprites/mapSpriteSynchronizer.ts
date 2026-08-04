import type { Map as MaplibreMap } from 'maplibre-gl';
import type { RenderedIcon } from '@kartore/spritore';

import { loadSpritore } from './spritore.ts';
import { spriteDimensionsFromSvg } from './spriteSvg.ts';

export type LocalSpriteDimensions = {
	svg: string;
	width: number;
	height: number;
};

type RenderedLocalSprite = RenderedIcon & {
	svg: string;
};

export type MapSpriteSyncInput = {
	map: MaplibreMap | null;
	icons: Record<string, string>;
};

export class MapSpriteSynchronizer {
	#generation = 0;
	#map: MaplibreMap | null = null;
	#icons: Record<string, string> = {};
	#synchronizedIconSvgs = new Map<string, string>();
	#renderedLocalSprites = new Map<string, RenderedLocalSprite>();
	#onDimensions: (dimensions: Record<string, LocalSpriteDimensions>) => void;

	constructor(onDimensions: (dimensions: Record<string, LocalSpriteDimensions>) => void) {
		this.#onDimensions = onDimensions;
	}

	set input({ map, icons }: MapSpriteSyncInput) {
		this.#icons = icons;
		const entries = Object.entries(icons);
		const iconSvgs = new Map(entries);
		const generation = ++this.#generation;

		if (map !== this.#map) {
			this.#map?.setMissingStyleImageResolver(null);
			this.#map = map;
			this.#synchronizedIconSvgs = new Map();
			map?.setMissingStyleImageResolver(this.#resolveMissingStyleImage);
		}

		if (map) {
			for (const [id, svg] of this.#synchronizedIconSvgs) {
				if (iconSvgs.get(id) === svg) continue;
				this.#removeLocalSprite(map, id);
				this.#synchronizedIconSvgs.delete(id);
			}
		}

		if (entries.length === 0) {
			this.#renderedLocalSprites = new Map();
			this.#onDimensions({});
			return;
		}

		void this.#synchronize(generation, map, entries);
	}

	destroy = () => {
		this.#generation += 1;
		this.#map?.setMissingStyleImageResolver(null);
		this.#map = null;
	};

	#removeLocalSprite(map: MaplibreMap, id: string) {
		if (map.hasImage(id)) map.removeImage(id);
	}

	#addLocalSprite(map: MaplibreMap, sprite: RenderedLocalSprite) {
		this.#removeLocalSprite(map, sprite.id);
		map.addImage(
			sprite.id,
			{ width: sprite.width, height: sprite.height, data: sprite.pixels },
			{ pixelRatio: 2 }
		);
	}

	async #synchronize(generation: number, map: MaplibreMap | null, entries: [string, string][]) {
		try {
			const { renderIcon } = await loadSpritore();
			const nextRenderedSprites = new Map<string, RenderedLocalSprite>();
			const nextDimensions: Record<string, LocalSpriteDimensions> = {};

			for (const [id, svg] of entries) {
				const svgDimensions = spriteDimensionsFromSvg(svg);
				nextDimensions[id] = {
					svg,
					width: svgDimensions.width,
					height: svgDimensions.height
				};
				try {
					const cached = this.#renderedLocalSprites.get(id);
					const rendered =
						cached?.svg === svg ? cached : { ...(await renderIcon(id, svg, 2)), svg };
					nextRenderedSprites.set(id, rendered);

					if (!svgDimensions.hasIntegerSizeAttributes) {
						const oneX = await renderIcon(id, svg, 1);
						nextDimensions[id] = { svg, width: oneX.width, height: oneX.height };
					}
				} catch {
					// SpritesColumn が不正 SVG の詳細を表示する。無効な画像は地図へ加えない。
				}
			}

			if (generation !== this.#generation) return;
			this.#renderedLocalSprites = nextRenderedSprites;
			this.#onDimensions(nextDimensions);

			if (!map || this.#map !== map) return;
			for (const [id, sprite] of nextRenderedSprites) {
				if (this.#synchronizedIconSvgs.get(id) === sprite.svg && map.hasImage(id)) continue;
				try {
					this.#addLocalSprite(map, sprite);
					this.#synchronizedIconSvgs.set(id, sprite.svg);
				} catch {
					this.#synchronizedIconSvgs.delete(id);
				}
			}
		} catch {
			// 初期化エラーはダイアログ側に表示される。ローカル画像なしでも編集を継続する。
		}
	}

	#resolveMissingStyleImage = async (id: string) => {
		const map = this.#map;
		if (!map) return;
		const svg = this.#icons[id];
		if (svg === undefined) return;
		const cached = this.#renderedLocalSprites.get(id);
		if (cached?.svg === svg) {
			try {
				this.#addLocalSprite(map, cached);
				this.#synchronizedIconSvgs.set(id, svg);
			} catch {
				// 次の欠落画像解決時に再試行する。
			}
			return;
		}

		try {
			const { renderIcon } = await loadSpritore();
			if (this.#map !== map || this.#icons[id] !== svg) return;
			const rendered = { ...(await renderIcon(id, svg, 2)), svg };
			if (this.#map !== map || this.#icons[id] !== svg) return;
			this.#renderedLocalSprites.set(id, rendered);
			this.#addLocalSprite(map, rendered);
			this.#synchronizedIconSvgs.set(id, svg);
		} catch {
			// 無効な SVG や初期化エラーは欠落画像のまま扱う。
		}
	};
}
