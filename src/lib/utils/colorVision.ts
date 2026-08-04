import { tryParseColor } from '#lib/utils/color.ts';
import { oklchDeltaE } from '#lib/utils/palette.ts';

export type ColorVisionMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'grayscale';

export type ColorVisionCheckMode = Exclude<ColorVisionMode, 'none' | 'grayscale'>;

export type ColorVisionEntry = {
	id: string;
	label: string;
	color: string;
	layerIds: string[];
};

export type ColorVisionWarning = {
	id: string;
	mode: ColorVisionCheckMode;
	left: ColorVisionEntry;
	right: ColorVisionEntry;
	originalDeltaE: number;
	simulatedDeltaE: number;
};

export const COLOR_VISION_ORIGINAL_DELTA_E = 6;
export const COLOR_VISION_SIMULATED_DELTA_E = 2.5;

export const COLOR_VISION_MODE_LABELS: Record<ColorVisionMode, string> = {
	none: 'なし',
	protanopia: '1型',
	deuteranopia: '2型',
	tritanopia: '3型',
	grayscale: 'グレースケール'
};

const CHECK_MODES: ColorVisionCheckMode[] = ['protanopia', 'deuteranopia', 'tritanopia'];

export const COLOR_VISION_MATRICES: Record<Exclude<ColorVisionMode, 'none'>, number[]> = {
	protanopia: [
		0.152286, 1.052583, -0.204868, 0, 0, 0.114503, 0.786281, 0.099216, 0, 0, -0.003882, -0.048116,
		1.051998, 0, 0, 0, 0, 0, 1, 0
	],
	deuteranopia: [
		0.367322, 0.860646, -0.227968, 0, 0, 0.280085, 0.672501, 0.047413, 0, 0, -0.01182, 0.04294,
		0.968881, 0, 0, 0, 0, 0, 1, 0
	],
	tritanopia: [
		1.255528, -0.076749, -0.178779, 0, 0, -0.078411, 0.930809, 0.147602, 0, 0, 0.004733, 0.691367,
		0.3039, 0, 0, 0, 0, 0, 1, 0
	],
	grayscale: [
		0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0, 0,
		0, 1, 0
	]
};

const clampChannel = (value: number): number => Math.min(1, Math.max(0, value));

export const colorVisionMatrixValues = (mode: Exclude<ColorVisionMode, 'none'>): string =>
	COLOR_VISION_MATRICES[mode].join(' ');

export const simulateColorVision = (
	color: string,
	mode: Exclude<ColorVisionMode, 'none'>
): string | undefined => {
	const parsed = tryParseColor(color)?.toFormat('rgb');
	if (!parsed) return undefined;
	const input = [
		parsed.getChannelValue('red') / 255,
		parsed.getChannelValue('green') / 255,
		parsed.getChannelValue('blue') / 255
	];
	const matrix = COLOR_VISION_MATRICES[mode];
	const output = [0, 5, 10].map((offset) =>
		clampChannel(
			matrix[offset] * input[0] +
				matrix[offset + 1] * input[1] +
				matrix[offset + 2] * input[2] +
				matrix[offset + 4]
		)
	);
	return `rgb(${output.map((channel) => Math.round(channel * 255)).join(', ')})`;
};

export const isColorVisionWarningDelta = (
	originalDeltaE: number,
	simulatedDeltaE: number
): boolean =>
	originalDeltaE >= COLOR_VISION_ORIGINAL_DELTA_E &&
	simulatedDeltaE < COLOR_VISION_SIMULATED_DELTA_E;

export const findColorVisionWarnings = (entries: ColorVisionEntry[]): ColorVisionWarning[] => {
	const warnings: ColorVisionWarning[] = [];
	for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
		for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
			const left = entries[leftIndex];
			const right = entries[rightIndex];
			const originalDeltaE = oklchDeltaE(left.color, right.color);
			if (originalDeltaE < COLOR_VISION_ORIGINAL_DELTA_E) continue;
			for (const mode of CHECK_MODES) {
				const simulatedLeft = simulateColorVision(left.color, mode);
				const simulatedRight = simulateColorVision(right.color, mode);
				if (!simulatedLeft || !simulatedRight) continue;
				const simulatedDeltaE = oklchDeltaE(simulatedLeft, simulatedRight);
				if (!isColorVisionWarningDelta(originalDeltaE, simulatedDeltaE)) continue;
				warnings.push({
					id: `${mode}:${left.id}:${right.id}`,
					mode,
					left,
					right,
					originalDeltaE,
					simulatedDeltaE
				});
			}
		}
	}
	return warnings;
};
