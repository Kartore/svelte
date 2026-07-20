import { describe, expect, it, vi } from 'vitest';

import type { SaveProvider } from './EditorModule.ts';
import { dispatchSave } from './saveProvider.ts';

describe('save provider dispatch', () => {
	it('uses the first available provider in registration order', async () => {
		const unavailableSave = vi.fn();
		const firstAvailableSave = vi.fn();
		const secondAvailableSave = vi.fn();
		const fallback = vi.fn();
		const providers: SaveProvider[] = [
			{ available: false, save: unavailableSave },
			{ available: true, save: firstAvailableSave },
			{ available: true, save: secondAvailableSave }
		];

		await dispatchSave(providers, fallback);

		expect(unavailableSave).not.toHaveBeenCalled();
		expect(firstAvailableSave).toHaveBeenCalledOnce();
		expect(secondAvailableSave).not.toHaveBeenCalled();
		expect(fallback).not.toHaveBeenCalled();
	});

	it('falls back when no provider is available', async () => {
		const providerSave = vi.fn();
		const fallback = vi.fn();

		await dispatchSave([{ available: false, save: providerSave }], fallback);

		expect(providerSave).not.toHaveBeenCalled();
		expect(fallback).toHaveBeenCalledOnce();
	});
});
