export type SpriteDimensions = {
	width: number;
	height: number;
	hasIntegerSizeAttributes: boolean;
};

const DEFAULT_ICON_SIZE = 24;

const svgAttribute = (svg: string, name: string): string | undefined => {
	const openingTag = svg.match(/<svg\b[^>]*>/i)?.[0];
	if (!openingTag) return undefined;
	const match = openingTag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
	return match?.[2]?.trim();
};

const positiveNumber = (value: string | undefined): number | undefined => {
	if (value === undefined) return undefined;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const viewBoxSize = (svg: string): { width: number; height: number } | undefined => {
	const values = svgAttribute(svg, 'viewBox')
		?.split(/[\s,]+/)
		.map(Number);
	if (values?.length !== 4 || !values.every(Number.isFinite) || values[2] <= 0 || values[3] <= 0) {
		return undefined;
	}
	return { width: values[2], height: values[3] };
};

export const spriteDimensionsFromSvg = (svg: string): SpriteDimensions => {
	const widthAttribute = svgAttribute(svg, 'width');
	const heightAttribute = svgAttribute(svg, 'height');
	const integerAttribute = (value: string | undefined): boolean =>
		value !== undefined && /^\d+$/.test(value) && Number(value) > 0;
	const hasIntegerSizeAttributes =
		integerAttribute(widthAttribute) && integerAttribute(heightAttribute);

	let width = positiveNumber(widthAttribute);
	let height = positiveNumber(heightAttribute);
	const viewBox = viewBoxSize(svg);

	if (width === undefined && height !== undefined && viewBox) {
		width = height * (viewBox.width / viewBox.height);
	}
	if (height === undefined && width !== undefined && viewBox) {
		height = width * (viewBox.height / viewBox.width);
	}
	width ??= viewBox?.width ?? DEFAULT_ICON_SIZE;
	height ??= viewBox?.height ?? DEFAULT_ICON_SIZE;

	return { width, height, hasIntegerSizeAttributes };
};

export const svgDataUrl = (svg: string): string => `data:image/svg+xml,${encodeURIComponent(svg)}`;

export const spriteIdFromFileName = (fileName: string): string => {
	const stem = fileName.replace(/\.svg$/i, '');
	return stem.replace(/[^a-zA-Z0-9_-]/g, '-') || 'icon';
};
