import { describe, expect, it } from 'vitest';

import { fontPreviewDescriptors, fontPreviewFamily } from './fontPreview.ts';

describe('fontPreviewDescriptors', () => {
	it('maps common weight and style names to CSS descriptors', () => {
		expect(fontPreviewDescriptors('Bold Italic')).toEqual({
			style: 'italic',
			weight: '700',
			stretch: 'normal'
		});
		expect(fontPreviewDescriptors('SemiBold')).toMatchObject({ weight: '600' });
		expect(fontPreviewDescriptors('ExtraLight')).toMatchObject({ weight: '200' });
	});

	it('maps condensed and numeric style names', () => {
		expect(fontPreviewDescriptors('Roboto Condensed 500')).toEqual({
			style: 'normal',
			weight: '500',
			stretch: 'condensed'
		});
	});
});

describe('fontPreviewFamily', () => {
	it('returns a stable CSS-safe family alias', () => {
		expect(fontPreviewFamily('Noto Sans JP Bold')).toMatch(/^kartore-preview-[a-z0-9]+$/);
		expect(fontPreviewFamily('Noto Sans JP Bold')).toBe(fontPreviewFamily('Noto Sans JP Bold'));
		expect(fontPreviewFamily('Noto Sans JP Bold')).not.toBe(
			fontPreviewFamily('Noto Sans JP Regular')
		);
	});
});
