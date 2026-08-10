import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

import { isExpression } from './isExpression.ts';

export const COMPACT_EXPRESSION_OPERATORS = [
	'accumulated',
	'e',
	'geometry-type',
	'get',
	'heatmap-density',
	'id',
	'line-progress',
	'ln2',
	'pi',
	'var',
	'zoom'
] as const;

const compactExpressionOperators = new Set<string>(COMPACT_EXPRESSION_OPERATORS);

export const isCompactExpression = (value: unknown): value is ExpressionSpecification =>
	isExpression(value) && typeof value[0] === 'string' && compactExpressionOperators.has(value[0]);
