import type { FontMeta, Fonts, FontsStoreAdapter, StoredFont } from './FontsStoreAdapter.ts';

export const FONTS_DATABASE_NAME = 'kartore-fonts';
export const FONTS_OBJECT_STORE_NAME = 'fonts';

type IndexedDbFactoryProvider = () => IDBFactory | undefined;

const requestError = (request: IDBRequest, fallback: string): Error =>
	request.error ?? new Error(fallback);

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
	new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(requestError(request, 'IndexedDB request failed.'));
	});

const transactionComplete = (transaction: IDBTransaction): Promise<void> =>
	new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () =>
			reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
		transaction.onabort = () =>
			reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'));
	});

const isStoredFont = (value: unknown): value is StoredFont => {
	if (typeof value !== 'object' || value === null) return false;
	const font = value as Partial<StoredFont>;
	return (
		font.bytes instanceof ArrayBuffer &&
		typeof font.familyName === 'string' &&
		typeof font.styleName === 'string' &&
		typeof font.addedAt === 'number' &&
		Number.isFinite(font.addedAt)
	);
};

const fontMeta = ({ familyName, styleName, addedAt }: StoredFont): FontMeta => ({
	familyName,
	styleName,
	addedAt
});

export const createIndexedDbFontsStoreAdapter = (
	getFactory: IndexedDbFactoryProvider = () => globalThis.indexedDB
): FontsStoreAdapter => {
	let databasePromise: Promise<IDBDatabase> | undefined;

	const openDatabase = (): Promise<IDBDatabase> => {
		if (databasePromise) return databasePromise;
		const opening = new Promise<IDBDatabase>((resolve, reject) => {
			const factory = getFactory();
			if (!factory) {
				reject(new Error('IndexedDB is not available.'));
				return;
			}

			const request = factory.open(FONTS_DATABASE_NAME, 1);
			request.onupgradeneeded = () => {
				if (!request.result.objectStoreNames.contains(FONTS_OBJECT_STORE_NAME)) {
					request.result.createObjectStore(FONTS_OBJECT_STORE_NAME);
				}
			};
			request.onsuccess = () => {
				const database = request.result;
				database.onversionchange = () => database.close();
				resolve(database);
			};
			request.onerror = () => reject(requestError(request, 'Could not open the font database.'));
			request.onblocked = () => reject(new Error('Opening the font database was blocked.'));
		});
		databasePromise = opening.catch((error: unknown) => {
			databasePromise = undefined;
			throw error;
		});
		return databasePromise;
	};

	return {
		id: 'indexed-db',
		load: async (): Promise<Fonts> => {
			const database = await openDatabase();
			const transaction = database.transaction(FONTS_OBJECT_STORE_NAME, 'readonly');
			const store = transaction.objectStore(FONTS_OBJECT_STORE_NAME);
			const [keys, values] = await Promise.all([
				requestResult(store.getAllKeys()),
				requestResult(store.getAll())
			]);
			const fonts: Fonts = {};
			for (let index = 0; index < keys.length; index += 1) {
				const key = keys[index];
				const value = values[index];
				if (typeof key === 'string' && isStoredFont(value)) {
					fonts[key] = fontMeta(value);
				}
			}
			return fonts;
		},
		get: async (name): Promise<StoredFont | null> => {
			const database = await openDatabase();
			const transaction = database.transaction(FONTS_OBJECT_STORE_NAME, 'readonly');
			const value: unknown = await requestResult(
				transaction.objectStore(FONTS_OBJECT_STORE_NAME).get(name)
			);
			return isStoredFont(value) ? value : null;
		},
		save: async (name, font) => {
			const database = await openDatabase();
			const transaction = database.transaction(FONTS_OBJECT_STORE_NAME, 'readwrite');
			const completed = transactionComplete(transaction);
			transaction.objectStore(FONTS_OBJECT_STORE_NAME).put(font, name);
			await completed;
		},
		remove: async (name) => {
			const database = await openDatabase();
			const transaction = database.transaction(FONTS_OBJECT_STORE_NAME, 'readwrite');
			const completed = transactionComplete(transaction);
			transaction.objectStore(FONTS_OBJECT_STORE_NAME).delete(name);
			await completed;
		}
	};
};

export const indexedDbFontsStoreAdapter = createIndexedDbFontsStoreAdapter();
