import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

import { getExpressionOperatorMeta } from '$lib/components/common/FilterInputField/expressions/utils/expressionRegistry.ts';
import { isExpression } from '$lib/components/common/FilterInputField/expressions/utils/isExpression.ts';

export const replaceArgAt = (
	expression: ExpressionSpecification,
	index: number,
	newArg: unknown
): ExpressionSpecification => {
	return expression.map((current, i) =>
		i === index ? newArg : current
	) as ExpressionSpecification;
};

export const insertArgsAt = (
	expression: ExpressionSpecification,
	index: number,
	args: unknown[]
): ExpressionSpecification => {
	return [
		...expression.slice(0, index),
		...args,
		...expression.slice(index)
	] as ExpressionSpecification;
};

export const removeArgsAt = (
	expression: ExpressionSpecification,
	index: number,
	count = 1
): ExpressionSpecification => {
	return [
		...expression.slice(0, index),
		...expression.slice(index + count)
	] as ExpressionSpecification;
};

/**
 * Wraps a literal into the value-preserving expression handled by the existing
 * assertion/literal input fields, so converting never changes the resolved value.
 */
export const literalToExpression = (value: unknown): ExpressionSpecification => {
	if (typeof value === 'number') {
		return ['number', value];
	}
	if (typeof value === 'boolean') {
		return ['boolean', value];
	}
	if (typeof value === 'string') {
		return ['string', value];
	}
	return ['literal', value === undefined ? '' : value] as ExpressionSpecification;
};

export const valueToExpression = (value: unknown): ExpressionSpecification => {
	return isExpression(value) ? value : literalToExpression(value);
};

/**
 * Removes arguments while the operator remains valid. If the removal would
 * cross the operator's minimum arity, unwraps the supplied value instead of
 * leaving an invalid expression that the editor can no longer operate on.
 */
export const removeArgsOrCollapse = (
	expression: ExpressionSpecification,
	index: number,
	count: number,
	collapseValue: unknown,
	minimumArgs?: number
): ExpressionSpecification => {
	const next = removeArgsAt(expression, index, count);
	const minArgs = minimumArgs ?? getExpressionOperatorMeta(expression[0])?.minArgs;
	if (minArgs === undefined || next.length - 1 >= minArgs) return next;
	if (isExpression(collapseValue)) return collapseValue;
	const collapsed = literalToExpression(collapseValue);
	return collapsed[0] === expression[0]
		? (['literal', collapseValue === undefined ? '' : collapseValue] as ExpressionSpecification)
		: collapsed;
};

/**
 * Wraps a literal into a zoom-driven interpolate whose two stops both resolve
 * to the current value, so converting never changes the rendered result — the
 * user then edits the stops to shape the ramp.
 */
export const literalToZoomInterpolate = (value: unknown): ExpressionSpecification => {
	const output = typeof value === 'number' || typeof value === 'string' ? value : 0;
	return ['interpolate', ['linear'], ['zoom'], 0, output, 22, output] as ExpressionSpecification;
};

/**
 * Switches the operator of an expression. Operators sharing a compatGroup keep
 * their arguments; any other switch resets to the target operator's template.
 */
export const changeOperator = (
	expression: ExpressionSpecification,
	newOperator: string
): ExpressionSpecification => {
	if (expression[0] === newOperator) {
		return expression;
	}
	const currentMeta = getExpressionOperatorMeta(expression[0]);
	const newMeta = getExpressionOperatorMeta(newOperator);
	if (!newMeta) {
		return expression;
	}
	if (currentMeta?.compatGroup !== undefined && currentMeta.compatGroup === newMeta.compatGroup) {
		return replaceArgAt(expression, 0, newOperator);
	}
	return newMeta.defaultExpression();
};
