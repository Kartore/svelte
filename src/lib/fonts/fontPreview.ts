export type FontPreviewDescriptors = {
	style: string;
	weight: string;
	stretch: string;
};

const normalizeStyleName = (styleName: string): string =>
	styleName
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();

const styleWeight = (styleName: string): number => {
	const normalized = normalizeStyleName(styleName);
	const numericWeight = normalized.match(/\b(100|200|300|400|500|600|700|800|900|1000)\b/);
	if (numericWeight) return Number(numericWeight[1]);

	const weights: readonly [RegExp, number][] = [
		[/\b(?:extra|ultra)\s*(?:black|heavy)\b/, 900],
		[/\b(?:black|heavy)\b/, 900],
		[/\b(?:extra|ultra)\s*bold\b/, 800],
		[/\b(?:semi|demi)\s*bold\b/, 600],
		[/\bbold\b/, 700],
		[/\bmedium\b/, 500],
		[/\b(?:regular|normal|book|roman|plain)\b/, 400],
		[/\b(?:extra|ultra)\s*light\b/, 200],
		[/\blight\b/, 300],
		[/\b(?:thin|hairline)\b/, 100]
	];
	return weights.find(([pattern]) => pattern.test(normalized))?.[1] ?? 400;
};

const styleStyle = (styleName: string): string => {
	const normalized = normalizeStyleName(styleName);
	if (/\boblique\b/.test(normalized)) return 'oblique';
	if (/\bitalic\b/.test(normalized)) return 'italic';
	return 'normal';
};

const styleStretch = (styleName: string): string => {
	const normalized = normalizeStyleName(styleName);
	const stretches: readonly [RegExp, string][] = [
		[/\bultra\s+condensed\b/, 'ultra-condensed'],
		[/\bextra\s+condensed\b/, 'extra-condensed'],
		[/\bsemi\s+condensed\b/, 'semi-condensed'],
		[/\b(?:condensed|narrow|compressed)\b/, 'condensed'],
		[/\bultra\s+expanded\b/, 'ultra-expanded'],
		[/\bextra\s+expanded\b/, 'extra-expanded'],
		[/\bsemi\s+expanded\b/, 'semi-expanded'],
		[/\b(?:expanded|wide)\b/, 'expanded']
	];
	return stretches.find(([pattern]) => pattern.test(normalized))?.[1] ?? 'normal';
};

export const fontPreviewDescriptors = (styleName: string): FontPreviewDescriptors => ({
	style: styleStyle(styleName),
	weight: String(styleWeight(styleName)),
	stretch: styleStretch(styleName)
});

export const fontPreviewFamily = (fontstack: string): string => {
	let hash = 2166136261;
	for (const character of fontstack) {
		hash ^= character.codePointAt(0) ?? 0;
		hash = Math.imul(hash, 16777619);
	}
	return `kartore-preview-${(hash >>> 0).toString(36)}`;
};
