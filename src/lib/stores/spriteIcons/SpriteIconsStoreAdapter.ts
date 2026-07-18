export type SpriteIcons = Record<string, string>;

export type SpriteIconsStoreAdapter = {
	id: string;
	load: () => Promise<SpriteIcons | null>;
	save: (icons: SpriteIcons) => Promise<void>;
};
