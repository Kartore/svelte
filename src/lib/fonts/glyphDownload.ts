import { zip, type AsyncZippable } from 'fflate';

export type GlyphDownloadProgress = {
	phase: 'generating' | 'zipping';
	completed: number;
	total: number;
};

export type BuildGlyphArchiveOptions = {
	fontstack: string;
	ranges: readonly number[];
	generateRange: (start: number) => Uint8Array;
	onProgress?: (progress: GlyphDownloadProgress) => void;
	yieldToMain?: () => Promise<void>;
};

export const glyphRangeFileName = (start: number): string => `${start}-${start + 255}.pbf`;

export const yieldToAnimationFrame = (): Promise<void> =>
	new Promise((resolve) => requestAnimationFrame(() => resolve()));

const zipAsync = (files: AsyncZippable): Promise<Uint8Array> =>
	new Promise((resolve, reject) => {
		zip(files, (error, archive) => {
			if (error) reject(error);
			else resolve(archive);
		});
	});

export const buildGlyphArchive = async ({
	fontstack,
	ranges,
	generateRange,
	onProgress,
	yieldToMain = yieldToAnimationFrame
}: BuildGlyphArchiveOptions): Promise<Uint8Array> => {
	const files: AsyncZippable = {};
	for (let index = 0; index < ranges.length; index += 1) {
		const start = ranges[index];
		files[`${fontstack}/${glyphRangeFileName(start)}`] = generateRange(start);
		const completed = index + 1;
		onProgress?.({ phase: 'generating', completed, total: ranges.length });
		if (completed % 16 === 0 && completed < ranges.length) await yieldToMain();
	}

	onProgress?.({ phase: 'zipping', completed: ranges.length, total: ranges.length });
	return zipAsync(files);
};
