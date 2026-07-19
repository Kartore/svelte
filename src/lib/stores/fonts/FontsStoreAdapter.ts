export type FontMeta = {
	familyName: string;
	styleName: string;
	addedAt: number;
};

export type Fonts = Record<string, FontMeta>;

export type StoredFont = FontMeta & {
	bytes: ArrayBuffer;
};

export type FontsStoreAdapter = {
	id: string;
	load: () => Promise<Fonts | null>;
	get: (name: string) => Promise<StoredFont | null>;
	save: (name: string, font: StoredFont) => Promise<void>;
	remove: (name: string) => Promise<void>;
};
