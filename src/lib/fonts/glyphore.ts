export type Glyphore = typeof import('@kartore/glyphore');

let glyphorePromise: Promise<Glyphore> | undefined;

export const loadGlyphore = (): Promise<Glyphore> => {
	if (glyphorePromise === undefined) {
		glyphorePromise = import('@kartore/glyphore')
			.then(async (glyphore) => {
				await glyphore.init();
				return glyphore;
			})
			.catch((error: unknown) => {
				glyphorePromise = undefined;
				throw error;
			});
	}
	return glyphorePromise;
};
