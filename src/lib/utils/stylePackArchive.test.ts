import { describe, expect, it } from 'vitest';

import type { StylePackFiles } from './stylePack.ts';
import { createStylePackArchive, readStylePackArchive } from './stylePackArchive.ts';

describe('stylePackArchive', () => {
	it('round-trips text and binary files deterministically', () => {
		const files: StylePackFiles = {
			'manifest.json': '{"formatVersion":1}\n',
			'assets/fonts/Test.ttf': Uint8Array.from([0, 1, 2, 3]),
			'assets/sprites/marker.svg': '<svg />'
		};

		const first = createStylePackArchive(files);
		const opened = readStylePackArchive(first);
		const second = createStylePackArchive(opened);

		expect(second).toEqual(first);
		expect(new TextDecoder().decode(opened['manifest.json'] as Uint8Array)).toBe(
			'{"formatVersion":1}\n'
		);
		expect(opened['assets/fonts/Test.ttf']).toEqual(Uint8Array.from([0, 1, 2, 3]));
	});

	it('is independent of input insertion order', () => {
		const first: StylePackFiles = { 'b.json': 'b', 'a.json': 'a' };
		const second: StylePackFiles = { 'a.json': 'a', 'b.json': 'b' };

		expect(createStylePackArchive(first)).toEqual(createStylePackArchive(second));
	});
});
