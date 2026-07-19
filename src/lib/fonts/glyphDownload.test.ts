import { unzipSync } from 'fflate';
import { describe, expect, it, vi } from 'vitest';

import { buildGlyphArchive } from './glyphDownload.ts';

describe('buildGlyphArchive', () => {
	it('writes every covered range under the fontstack directory and yields every 16 ranges', async () => {
		const ranges = Array.from({ length: 17 }, (_, index) => index * 256);
		const yieldToMain = vi.fn(async () => undefined);
		const onProgress = vi.fn();
		const archive = await buildGlyphArchive({
			fontstack: 'Test Sans Regular',
			ranges,
			generateRange: (start) => Uint8Array.from([start / 256]),
			yieldToMain,
			onProgress
		});
		const files = unzipSync(archive);

		expect(Object.keys(files)).toHaveLength(17);
		expect(files['Test Sans Regular/0-255.pbf']).toEqual(Uint8Array.from([0]));
		expect(files['Test Sans Regular/4096-4351.pbf']).toEqual(Uint8Array.from([16]));
		expect(yieldToMain).toHaveBeenCalledTimes(1);
		expect(onProgress).toHaveBeenLastCalledWith({
			phase: 'zipping',
			completed: 17,
			total: 17
		});
	});
});
