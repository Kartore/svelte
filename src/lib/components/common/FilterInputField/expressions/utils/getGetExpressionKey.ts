/**
 * Returns the property key when the value is a simple `['get', 'key']`
 * expression — used to offer property-value suggestions for the sibling
 * operand of comparisons and match labels.
 */
export const getGetExpressionKey = (value: unknown): string | undefined => {
	if (
		Array.isArray(value) &&
		value.length >= 2 &&
		value[0] === 'get' &&
		typeof value[1] === 'string' &&
		value[1] !== ''
	) {
		return value[1];
	}
	return undefined;
};
