import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';

import { referencedFontStacks } from '#lib/utils/assetUsage.ts';
import { buildLayerTreeRows, getLayerGroup } from '#lib/utils/layerGroup.ts';
import { readStylePack } from '#lib/utils/stylePack.ts';
import { readStylePackArchive } from '#lib/utils/stylePackArchive.ts';

import { loadInitialProject } from './initialProject.ts';

const readInitialProject = async () => {
	const bytes = await readFile(new URL('./initial.kartore', import.meta.url));
	return readStylePack(readStylePackArchive(Uint8Array.from(bytes)));
};

describe('initial.kartore', () => {
	it('contains grouped OSM Liberty with its editable sprites and fonts', async () => {
		const opened = await readInitialProject();

		expect(opened.warnings).toEqual([]);
		expect(opened.style.name).toBe('OSM Liberty');
		expect(opened.style.layers.some((layer) => getLayerGroup(layer) !== undefined)).toBe(true);
		expect(buildLayerTreeRows(opened.style.layers).some((row) => row.kind === 'group')).toBe(true);
		expect(Object.keys(opened.assets.icons)).toHaveLength(244);
		expect(opened.assets.icons.airport_11).toContain('<svg');
		expect(Object.keys(opened.assets.fonts).sort()).toEqual(
			referencedFontStacks(opened.style).sort()
		);
		expect(new Uint8Array(opened.assets.fonts['Roboto Regular'].bytes).byteLength).toBeGreaterThan(
			100_000
		);
	});

	it('loads through the same archive reader used by external projects', async () => {
		const bytes = Uint8Array.from(await readFile(new URL('./initial.kartore', import.meta.url)));
		const request = vi.fn(async () => new Response(bytes)) as unknown as typeof fetch;

		const project = await loadInitialProject(request);

		expect(request).toHaveBeenCalledOnce();
		expect(project.style.name).toBe('OSM Liberty');
		expect(Object.keys(project.assets?.icons ?? {})).toHaveLength(244);
		expect(Object.keys(project.assets?.fonts ?? {})).toHaveLength(3);
	});
});
