import type { SpriteIcons, SpriteIconsStoreAdapter } from './SpriteIconsStoreAdapter.ts';

export type SpriteIconsStoreOptions = {
	adapter: SpriteIconsStoreAdapter;
};

export class SpriteIconsStore {
	#adapter: SpriteIconsStoreAdapter;

	icons = $state<SpriteIcons>({});
	isLoading = $state(true);
	isSaving = $state(false);
	loadError = $state<Error | null>(null);
	saveError = $state<Error | null>(null);

	constructor({ adapter }: SpriteIconsStoreOptions) {
		this.#adapter = adapter;
		void this.#load();
	}

	setIcon = (id: string, svg: string) => {
		this.icons = { ...this.icons, [id]: svg };
		void this.#save({ ...this.icons });
	};

	removeIcon = (id: string) => {
		if (!(id in this.icons)) return;
		const icons = { ...this.icons };
		delete icons[id];
		this.icons = icons;
		void this.#save(icons);
	};

	async #load() {
		try {
			this.icons = (await this.#adapter.load()) ?? {};
		} catch (error) {
			this.loadError = error instanceof Error ? error : new Error(String(error));
		} finally {
			this.isLoading = false;
		}
	}

	async #save(icons: SpriteIcons) {
		this.isSaving = true;
		this.saveError = null;
		try {
			await this.#adapter.save(icons);
		} catch (error) {
			this.saveError = error instanceof Error ? error : new Error(String(error));
		} finally {
			this.isSaving = false;
		}
	}
}
