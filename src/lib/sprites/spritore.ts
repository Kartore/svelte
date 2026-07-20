export type Spritore = typeof import('@kartore/spritore');

let spritorePromise: Promise<Spritore> | undefined;

export const loadSpritore = (): Promise<Spritore> => {
	if (spritorePromise === undefined) {
		spritorePromise = import('@kartore/spritore').catch((error: unknown) => {
			spritorePromise = undefined;
			throw error;
		});
	}
	return spritorePromise;
};
