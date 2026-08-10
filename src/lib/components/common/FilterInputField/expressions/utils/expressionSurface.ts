export type ExpressionSurface = {
	className: string;
	surfaceBackground: string;
	controlBackground: string;
};

/** Returns the alternating expression surface and its inverse control color. */
export const expressionSurface = (depth: number): ExpressionSurface =>
	depth % 2 === 0
		? {
				className: 'bg-field',
				surfaceBackground: 'var(--color-field)',
				controlBackground: '#fff'
			}
		: {
				className: 'border border-hairline-soft bg-white',
				surfaceBackground: '#fff',
				controlBackground: 'var(--color-field)'
			};
