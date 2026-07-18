import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import type { StyleHistoryProvider } from '$lib/editor/EditorModule.ts';

import { StyleHistoryContext } from './styleHistory.svelte.ts';

class FakeStyleHistoryProvider implements StyleHistoryProvider {
	available = $state(false);
	label = 'example/style@main';

	listRevisions = async () => ({ revisions: [], hasNext: false });
	loadStyleAtRevision = async () => ({ version: 8, sources: {}, layers: [] }) as StyleSpecification;
}

describe('StyleHistoryContext', () => {
	it('has no provider before one is registered', () => {
		const context = new StyleHistoryContext();

		expect(context.provider).toBeNull();
	});

	it('ignores unavailable providers', () => {
		const context = new StyleHistoryContext();
		context.register(new FakeStyleHistoryProvider());

		expect(context.provider).toBeNull();
	});

	it('reacts when a registered provider becomes available', () => {
		const context = new StyleHistoryContext();
		const first = new FakeStyleHistoryProvider();
		const second = new FakeStyleHistoryProvider();
		context.register(first);
		context.register(second);

		second.available = true;
		expect(context.provider).toBe(second);

		first.available = true;
		expect(context.provider).toBe(first);
	});
});
