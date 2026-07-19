import { describe, expect, it } from 'vitest';

import {
	createIndexedDbFontsStoreAdapter,
	FONTS_DATABASE_NAME,
	FONTS_OBJECT_STORE_NAME
} from './indexedDbFontsStoreAdapter.ts';

type RequestHandler = ((event: Event) => void) | null;

class FakeRequest<T> {
	result!: T;
	error: DOMException | null = null;
	onsuccess: RequestHandler = null;
	onerror: RequestHandler = null;

	succeed(value: T) {
		this.result = value;
		queueMicrotask(() => this.onsuccess?.(new Event('success')));
	}
}

class FakeTransaction {
	error: DOMException | null = null;
	oncomplete: RequestHandler = null;
	onerror: RequestHandler = null;
	onabort: RequestHandler = null;

	constructor(private records: Map<IDBValidKey, unknown>) {}

	objectStore(name: string): IDBObjectStore {
		expectStoreName(name);
		return new FakeObjectStore(this.records, this) as unknown as IDBObjectStore;
	}

	complete() {
		queueMicrotask(() => this.oncomplete?.(new Event('complete')));
	}
}

class FakeObjectStore {
	constructor(
		private records: Map<IDBValidKey, unknown>,
		private transaction: FakeTransaction
	) {}

	getAllKeys(): IDBRequest<IDBValidKey[]> {
		const request = new FakeRequest<IDBValidKey[]>();
		request.succeed([...this.records.keys()]);
		return request as unknown as IDBRequest<IDBValidKey[]>;
	}

	getAll(): IDBRequest<unknown[]> {
		const request = new FakeRequest<unknown[]>();
		request.succeed([...this.records.values()].map((value) => structuredClone(value)));
		return request as unknown as IDBRequest<unknown[]>;
	}

	get(key: IDBValidKey): IDBRequest<unknown> {
		const request = new FakeRequest<unknown>();
		request.succeed(structuredClone(this.records.get(key)));
		return request as unknown as IDBRequest<unknown>;
	}

	put(value: unknown, key: IDBValidKey): IDBRequest<IDBValidKey> {
		this.records.set(key, structuredClone(value));
		const request = new FakeRequest<IDBValidKey>();
		request.succeed(key);
		this.transaction.complete();
		return request as unknown as IDBRequest<IDBValidKey>;
	}

	delete(key: IDBValidKey): IDBRequest<undefined> {
		this.records.delete(key);
		const request = new FakeRequest<undefined>();
		request.succeed(undefined);
		this.transaction.complete();
		return request as unknown as IDBRequest<undefined>;
	}
}

class FakeDatabase {
	records = new Map<IDBValidKey, unknown>();
	createdStoreName: string | undefined;
	onversionchange: RequestHandler = null;
	objectStoreNames = {
		contains: (name: string) => this.createdStoreName === name
	};

	createObjectStore(name: string): IDBObjectStore {
		this.createdStoreName = name;
		return {} as IDBObjectStore;
	}

	transaction(name: string): IDBTransaction {
		expectStoreName(name);
		return new FakeTransaction(this.records) as unknown as IDBTransaction;
	}

	close() {}
}

class FakeOpenRequest extends FakeRequest<IDBDatabase> {
	onupgradeneeded: RequestHandler = null;
	onblocked: RequestHandler = null;
}

class FakeIndexedDbFactory {
	database = new FakeDatabase();
	openCalls: [string, number | undefined][] = [];

	open(name: string, version?: number): IDBOpenDBRequest {
		this.openCalls.push([name, version]);
		const request = new FakeOpenRequest();
		request.result = this.database as unknown as IDBDatabase;
		queueMicrotask(() => {
			if (!this.database.createdStoreName) {
				request.onupgradeneeded?.(new Event('upgradeneeded'));
			}
			request.onsuccess?.(new Event('success'));
		});
		return request as unknown as IDBOpenDBRequest;
	}
}

const expectStoreName = (name: string) => {
	if (name !== FONTS_OBJECT_STORE_NAME) throw new Error(`Unexpected object store: ${name}`);
};

describe('indexedDbFontsStoreAdapter', () => {
	it('stores bytes under the fontstack key and loads metadata without bytes', async () => {
		const factory = new FakeIndexedDbFactory();
		const adapter = createIndexedDbFontsStoreAdapter(() => factory as unknown as IDBFactory);
		const font = {
			bytes: Uint8Array.from([1, 2, 3]).buffer,
			familyName: 'Noto Sans JP',
			styleName: 'Regular',
			addedAt: 1234
		};

		await adapter.save('Noto Sans JP Regular', font);
		expect(factory.openCalls).toEqual([[FONTS_DATABASE_NAME, 1]]);
		expect(factory.database.createdStoreName).toBe(FONTS_OBJECT_STORE_NAME);
		await expect(adapter.get('Noto Sans JP Regular')).resolves.toEqual(font);
		await expect(adapter.load()).resolves.toEqual({
			'Noto Sans JP Regular': {
				familyName: 'Noto Sans JP',
				styleName: 'Regular',
				addedAt: 1234
			}
		});

		await adapter.remove('Noto Sans JP Regular');
		await expect(adapter.get('Noto Sans JP Regular')).resolves.toBeNull();
	});

	it('ignores malformed records while loading metadata', async () => {
		const factory = new FakeIndexedDbFactory();
		factory.database.createdStoreName = FONTS_OBJECT_STORE_NAME;
		factory.database.records.set('broken', { bytes: 'not-an-array-buffer' });
		const adapter = createIndexedDbFontsStoreAdapter(() => factory as unknown as IDBFactory);

		await expect(adapter.load()).resolves.toEqual({});
	});
});
