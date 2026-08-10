import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it, vi } from 'vitest';

import type { EditorProjectTarget } from './projectLoad.ts';
import { applyProjectLoad } from './projectLoad.ts';

const style: StyleSpecification = { version: 8, sources: {}, layers: [] };

const createTarget = () => {
	const events: string[] = [];
	const target: EditorProjectTarget = {
		replaceStyle: vi.fn(() => events.push('style')),
		replaceSpriteIcons: vi.fn(async () => {
			events.push('icons');
		}),
		replaceStoredFonts: vi.fn(async () => {
			events.push('fonts');
		})
	};
	return { events, target };
};

describe('applyProjectLoad', () => {
	it('replaces supplied assets before switching the style', async () => {
		const { events, target } = createTarget();
		const font = {
			bytes: Uint8Array.from([1, 2, 3]).buffer,
			familyName: 'Inter',
			styleName: 'Regular',
			addedAt: 1
		};

		await applyProjectLoad(target, {
			style,
			assets: { icons: { marker: '<svg />' }, fonts: { 'Inter Regular': font } }
		});

		expect(events).toEqual(['icons', 'fonts', 'style']);
		expect(target.replaceSpriteIcons).toHaveBeenCalledWith({ marker: '<svg />' });
		expect(target.replaceStoredFonts).toHaveBeenCalledWith({ 'Inter Regular': font });
	});

	it('keeps omitted assets when loading a style-only project', async () => {
		const { events, target } = createTarget();

		await applyProjectLoad(target, { style });

		expect(events).toEqual(['style']);
		expect(target.replaceSpriteIcons).not.toHaveBeenCalled();
		expect(target.replaceStoredFonts).not.toHaveBeenCalled();
	});

	it('does not switch the style when asset persistence fails', async () => {
		const { target } = createTarget();
		vi.mocked(target.replaceSpriteIcons).mockRejectedValueOnce(new Error('quota exceeded'));

		await expect(
			applyProjectLoad(target, { style, assets: { icons: { marker: '<svg />' }, fonts: {} } })
		).rejects.toThrow('quota exceeded');

		expect(target.replaceStoredFonts).not.toHaveBeenCalled();
		expect(target.replaceStyle).not.toHaveBeenCalled();
	});
});
