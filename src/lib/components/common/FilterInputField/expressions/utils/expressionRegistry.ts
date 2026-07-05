import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export type ExpressionOperatorCategory =
	| 'decision'
	| 'comparison'
	| 'curves'
	| 'lookup'
	| 'math'
	| 'string'
	| 'types'
	| 'variables'
	| 'zoom'
	| 'feature-data'
	| 'heatmap'
	| 'color';

export type ExpressionOperatorMeta = {
	operator: string;
	label?: string;
	category: ExpressionOperatorCategory;
	/** operators sharing an argument signature can swap the operator token in place */
	compatGroup?: string;
	/** minimum argument count, excluding the operator token */
	minArgs: number;
	variadic?: {
		/** 1 = single argument slots, 2 = paired slots (stops, branches, bindings) */
		unit: 1 | 2;
		/** trailing fixed args that must stay last (match/case fallback, let result) */
		tailCount: 0 | 1;
		/** args to append — receives the current expression to derive sensible values */
		newArgsTemplate: (expression: ExpressionSpecification) => unknown[];
	};
	defaultExpression: () => ExpressionSpecification;
};

/**
 * New curve stops must be strictly ascending and keep the output type, so the
 * appended pair continues from the current last stop instead of a fixed 0.
 */
const nextStopTemplate =
	(defaultOutput: unknown) =>
	(expression: ExpressionSpecification): unknown[] => {
		const lastInput = expression[expression.length - 2];
		const lastOutput = expression[expression.length - 1];
		return [typeof lastInput === 'number' ? lastInput + 1 : 0, lastOutput ?? defaultOutput];
	};

const entries: ExpressionOperatorMeta[] = [
	// decision
	{
		operator: '!',
		category: 'decision',
		minArgs: 1,
		defaultExpression: () => ['!', ['has', '']]
	},
	{
		operator: '==',
		category: 'comparison',
		compatGroup: 'comparison',
		minArgs: 2,
		defaultExpression: () => ['==', ['get', ''], '']
	},
	{
		operator: '!=',
		category: 'comparison',
		compatGroup: 'comparison',
		minArgs: 2,
		defaultExpression: () => ['!=', ['get', ''], '']
	},
	{
		operator: '<',
		category: 'comparison',
		compatGroup: 'comparison',
		minArgs: 2,
		defaultExpression: () => ['<', ['get', ''], 0]
	},
	{
		operator: '<=',
		category: 'comparison',
		compatGroup: 'comparison',
		minArgs: 2,
		defaultExpression: () => ['<=', ['get', ''], 0]
	},
	{
		operator: '>',
		category: 'comparison',
		compatGroup: 'comparison',
		minArgs: 2,
		defaultExpression: () => ['>', ['get', ''], 0]
	},
	{
		operator: '>=',
		category: 'comparison',
		compatGroup: 'comparison',
		minArgs: 2,
		defaultExpression: () => ['>=', ['get', ''], 0]
	},
	{
		operator: 'all',
		category: 'decision',
		compatGroup: 'boolean-variadic',
		minArgs: 0,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [['==', ['get', ''], '']] },
		defaultExpression: () => ['all']
	},
	{
		operator: 'any',
		category: 'decision',
		compatGroup: 'boolean-variadic',
		minArgs: 0,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [['==', ['get', ''], '']] },
		defaultExpression: () => ['any']
	},
	{
		operator: 'case',
		category: 'decision',
		minArgs: 3,
		variadic: { unit: 2, tailCount: 1, newArgsTemplate: () => [['==', ['get', ''], ''], ''] },
		defaultExpression: () => ['case', ['==', ['get', ''], ''], '', '']
	},
	{
		operator: 'coalesce',
		category: 'decision',
		minArgs: 1,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [['get', '']] },
		defaultExpression: () => ['coalesce', ['get', '']]
	},
	{
		operator: 'match',
		label: 'switch',
		category: 'decision',
		minArgs: 4,
		variadic: { unit: 2, tailCount: 1, newArgsTemplate: () => ['', ''] },
		defaultExpression: () => ['match', ['get', ''], '', '', '']
	},
	{
		operator: 'within',
		category: 'decision',
		minArgs: 1,
		defaultExpression: () =>
			['within', { type: 'Polygon', coordinates: [] }] as unknown as ExpressionSpecification
	},
	// feature-data
	{
		operator: 'accumulated',
		category: 'feature-data',
		compatGroup: 'nullary',
		minArgs: 0,
		defaultExpression: () => ['accumulated'] as unknown as ExpressionSpecification
	},
	{
		operator: 'feature-state',
		category: 'feature-data',
		minArgs: 1,
		defaultExpression: () => ['feature-state', '']
	},
	{
		operator: 'geometry-type',
		category: 'feature-data',
		compatGroup: 'nullary',
		minArgs: 0,
		defaultExpression: () => ['geometry-type']
	},
	{
		operator: 'id',
		category: 'feature-data',
		compatGroup: 'nullary',
		minArgs: 0,
		defaultExpression: () => ['id']
	},
	{
		operator: 'line-progress',
		category: 'feature-data',
		compatGroup: 'nullary',
		minArgs: 0,
		defaultExpression: () => ['line-progress']
	},
	{
		operator: 'properties',
		category: 'feature-data',
		compatGroup: 'nullary',
		minArgs: 0,
		defaultExpression: () => ['properties']
	},
	// heatmap
	{
		operator: 'heatmap-density',
		category: 'heatmap',
		compatGroup: 'nullary',
		minArgs: 0,
		defaultExpression: () => ['heatmap-density']
	},
	// zoom
	{
		operator: 'zoom',
		category: 'zoom',
		compatGroup: 'nullary',
		minArgs: 0,
		defaultExpression: () => ['zoom']
	},
	// lookup
	{
		operator: 'at',
		category: 'lookup',
		minArgs: 2,
		defaultExpression: () => ['at', 0, ['literal', []]]
	},
	{
		operator: 'get',
		category: 'lookup',
		minArgs: 1,
		defaultExpression: () => ['get', '']
	},
	{
		operator: 'has',
		category: 'lookup',
		minArgs: 1,
		defaultExpression: () => ['has', '']
	},
	{
		operator: 'in',
		category: 'lookup',
		minArgs: 2,
		defaultExpression: () => ['in', '', ['literal', []]]
	},
	{
		operator: 'index-of',
		category: 'lookup',
		minArgs: 2,
		defaultExpression: () => ['index-of', '', ['get', '']]
	},
	{
		operator: 'length',
		category: 'lookup',
		minArgs: 1,
		defaultExpression: () => ['length', ['get', '']]
	},
	{
		operator: 'slice',
		category: 'lookup',
		minArgs: 2,
		defaultExpression: () => ['slice', ['get', ''], 0]
	},
	// curves
	{
		operator: 'interpolate',
		category: 'curves',
		compatGroup: 'interpolate-family',
		minArgs: 4,
		variadic: { unit: 2, tailCount: 0, newArgsTemplate: nextStopTemplate(0) },
		defaultExpression: () => ['interpolate', ['linear'], ['zoom'], 0, 0]
	},
	{
		operator: 'interpolate-hcl',
		category: 'curves',
		compatGroup: 'interpolate-family',
		minArgs: 4,
		variadic: { unit: 2, tailCount: 0, newArgsTemplate: nextStopTemplate('#000000') },
		defaultExpression: () =>
			['interpolate-hcl', ['linear'], ['zoom'], 0, '#000000'] as ExpressionSpecification
	},
	{
		operator: 'interpolate-lab',
		category: 'curves',
		compatGroup: 'interpolate-family',
		minArgs: 4,
		variadic: { unit: 2, tailCount: 0, newArgsTemplate: nextStopTemplate('#000000') },
		defaultExpression: () =>
			['interpolate-lab', ['linear'], ['zoom'], 0, '#000000'] as ExpressionSpecification
	},
	{
		operator: 'step',
		category: 'curves',
		minArgs: 2,
		variadic: { unit: 2, tailCount: 0, newArgsTemplate: nextStopTemplate(0) },
		defaultExpression: () => ['step', ['zoom'], 0, 0, 0]
	},
	// math
	{
		operator: '+',
		category: 'math',
		compatGroup: 'math-variadic',
		minArgs: 2,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [0] },
		defaultExpression: () => ['+', 0, 0]
	},
	{
		operator: '*',
		category: 'math',
		compatGroup: 'math-variadic',
		minArgs: 2,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [0] },
		defaultExpression: () => ['*', 1, 1]
	},
	{
		operator: 'min',
		category: 'math',
		compatGroup: 'math-variadic',
		minArgs: 2,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [0] },
		defaultExpression: () => ['min', 0, 0]
	},
	{
		operator: 'max',
		category: 'math',
		compatGroup: 'math-variadic',
		minArgs: 2,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [0] },
		defaultExpression: () => ['max', 0, 0]
	},
	{
		operator: '-',
		category: 'math',
		minArgs: 1,
		defaultExpression: () => ['-', 0, 0]
	},
	{
		operator: '/',
		category: 'math',
		minArgs: 2,
		defaultExpression: () => ['/', 1, 1]
	},
	{
		operator: '%',
		category: 'math',
		minArgs: 2,
		defaultExpression: () => ['%', 0, 1]
	},
	{
		operator: '^',
		category: 'math',
		minArgs: 2,
		defaultExpression: () => ['^', 0, 1]
	},
	{
		operator: 'abs',
		category: 'math',
		compatGroup: 'unary-math',
		minArgs: 1,
		defaultExpression: () => ['abs', 0]
	},
	{
		operator: 'acos',
		category: 'math',
		compatGroup: 'unary-math',
		minArgs: 1,
		defaultExpression: () => ['acos', 0]
	},
	{
		operator: 'asin',
		category: 'math',
		compatGroup: 'unary-math',
		minArgs: 1,
		defaultExpression: () => ['asin', 0]
	},
	{
		operator: 'atan',
		category: 'math',
		compatGroup: 'unary-math',
		minArgs: 1,
		defaultExpression: () => ['atan', 0]
	},
	{
		operator: 'ceil',
		category: 'math',
		compatGroup: 'unary-math',
		minArgs: 1,
		defaultExpression: () => ['ceil', 0]
	},
	{
		operator: 'cos',
		category: 'math',
		compatGroup: 'unary-math',
		minArgs: 1,
		defaultExpression: () => ['cos', 0]
	},
	{
		operator: 'distance',
		category: 'math',
		minArgs: 1,
		defaultExpression: () =>
			['distance', { type: 'Point', coordinates: [0, 0] }] as unknown as ExpressionSpecification
	},
	{
		operator: 'e',
		category: 'math',
		compatGroup: 'nullary',
		minArgs: 0,
		defaultExpression: () => ['e']
	},
	{
		operator: 'floor',
		category: 'math',
		compatGroup: 'unary-math',
		minArgs: 1,
		defaultExpression: () => ['floor', 0]
	},
	{
		operator: 'ln',
		category: 'math',
		compatGroup: 'unary-math',
		minArgs: 1,
		defaultExpression: () => ['ln', 1]
	},
	{
		operator: 'ln2',
		category: 'math',
		compatGroup: 'nullary',
		minArgs: 0,
		defaultExpression: () => ['ln2']
	},
	{
		operator: 'log10',
		category: 'math',
		compatGroup: 'unary-math',
		minArgs: 1,
		defaultExpression: () => ['log10', 1]
	},
	{
		operator: 'log2',
		category: 'math',
		compatGroup: 'unary-math',
		minArgs: 1,
		defaultExpression: () => ['log2', 1]
	},
	{
		operator: 'pi',
		category: 'math',
		compatGroup: 'nullary',
		minArgs: 0,
		defaultExpression: () => ['pi']
	},
	{
		operator: 'round',
		category: 'math',
		compatGroup: 'unary-math',
		minArgs: 1,
		defaultExpression: () => ['round', 0]
	},
	{
		operator: 'sin',
		category: 'math',
		compatGroup: 'unary-math',
		minArgs: 1,
		defaultExpression: () => ['sin', 0]
	},
	{
		operator: 'sqrt',
		category: 'math',
		compatGroup: 'unary-math',
		minArgs: 1,
		defaultExpression: () => ['sqrt', 0]
	},
	{
		operator: 'tan',
		category: 'math',
		compatGroup: 'unary-math',
		minArgs: 1,
		defaultExpression: () => ['tan', 0]
	},
	// string
	{
		operator: 'concat',
		category: 'string',
		minArgs: 2,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [''] },
		defaultExpression: () => ['concat', '', '']
	},
	{
		operator: 'downcase',
		category: 'string',
		compatGroup: 'string-unary',
		minArgs: 1,
		defaultExpression: () => ['downcase', '']
	},
	{
		operator: 'upcase',
		category: 'string',
		compatGroup: 'string-unary',
		minArgs: 1,
		defaultExpression: () => ['upcase', '']
	},
	{
		operator: 'is-supported-script',
		category: 'string',
		minArgs: 1,
		defaultExpression: () => ['is-supported-script', ['get', '']]
	},
	{
		operator: 'resolved-locale',
		category: 'string',
		minArgs: 1,
		defaultExpression: () => ['resolved-locale', ['collator', {}]]
	},
	// types
	{
		operator: 'array',
		category: 'types',
		minArgs: 1,
		defaultExpression: () => ['array', ['get', '']]
	},
	{
		operator: 'boolean',
		category: 'types',
		compatGroup: 'assertion',
		minArgs: 1,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [['get', '']] },
		defaultExpression: () => ['boolean', ['get', '']]
	},
	{
		operator: 'number',
		category: 'types',
		compatGroup: 'assertion',
		minArgs: 1,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [['get', '']] },
		defaultExpression: () => ['number', ['get', '']]
	},
	{
		operator: 'string',
		category: 'types',
		compatGroup: 'assertion',
		minArgs: 1,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [['get', '']] },
		defaultExpression: () => ['string', ['get', '']]
	},
	{
		operator: 'object',
		category: 'types',
		minArgs: 1,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [['get', '']] },
		defaultExpression: () => ['object', ['get', '']]
	},
	{
		operator: 'collator',
		category: 'types',
		minArgs: 1,
		defaultExpression: () => ['collator', {}]
	},
	{
		operator: 'format',
		category: 'types',
		minArgs: 1,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [''] },
		defaultExpression: () => ['format', '', {}] as unknown as ExpressionSpecification
	},
	{
		operator: 'image',
		category: 'types',
		minArgs: 1,
		defaultExpression: () => ['image', '']
	},
	{
		operator: 'literal',
		category: 'types',
		minArgs: 1,
		defaultExpression: () => ['literal', []]
	},
	{
		operator: 'number-format',
		category: 'types',
		minArgs: 2,
		defaultExpression: () => ['number-format', 0, {}]
	},
	{
		operator: 'to-boolean',
		category: 'types',
		compatGroup: 'to-cast',
		minArgs: 1,
		defaultExpression: () => ['to-boolean', ['get', '']]
	},
	{
		operator: 'to-color',
		category: 'types',
		compatGroup: 'to-cast',
		minArgs: 1,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [['get', '']] },
		defaultExpression: () => ['to-color', ['get', '']]
	},
	{
		operator: 'to-number',
		category: 'types',
		compatGroup: 'to-cast',
		minArgs: 1,
		variadic: { unit: 1, tailCount: 0, newArgsTemplate: () => [['get', '']] },
		defaultExpression: () => ['to-number', ['get', '']]
	},
	{
		operator: 'to-string',
		category: 'types',
		compatGroup: 'to-cast',
		minArgs: 1,
		defaultExpression: () => ['to-string', ['get', '']]
	},
	{
		operator: 'typeof',
		category: 'types',
		minArgs: 1,
		defaultExpression: () => ['typeof', ['get', '']]
	},
	// color
	{
		operator: 'rgb',
		category: 'color',
		minArgs: 3,
		defaultExpression: () => ['rgb', 0, 0, 0]
	},
	{
		operator: 'rgba',
		category: 'color',
		minArgs: 4,
		defaultExpression: () => ['rgba', 0, 0, 0, 1]
	},
	{
		operator: 'to-rgba',
		category: 'color',
		minArgs: 1,
		defaultExpression: () => ['to-rgba', ['to-color', '#000000']]
	},
	// variables
	{
		operator: 'let',
		category: 'variables',
		minArgs: 3,
		variadic: { unit: 2, tailCount: 1, newArgsTemplate: () => ['name', 0] },
		defaultExpression: () => ['let', 'x', 0, ['var', 'x']] as unknown as ExpressionSpecification
	},
	{
		operator: 'var',
		category: 'variables',
		minArgs: 1,
		defaultExpression: () => ['var', ''] as unknown as ExpressionSpecification
	}
];

export const expressionRegistry: Record<string, ExpressionOperatorMeta> = Object.fromEntries(
	entries.map((entry) => [entry.operator, entry])
);

export const getExpressionOperatorMeta = (
	operator: unknown
): ExpressionOperatorMeta | undefined => {
	if (typeof operator !== 'string') return undefined;
	return expressionRegistry[operator];
};

const categoryOrder: ExpressionOperatorCategory[] = [
	'comparison',
	'decision',
	'lookup',
	'feature-data',
	'curves',
	'zoom',
	'math',
	'string',
	'types',
	'color',
	'variables',
	'heatmap'
];

export const listOperatorsByCategory = (): {
	category: ExpressionOperatorCategory;
	operators: ExpressionOperatorMeta[];
}[] => {
	return categoryOrder.map((category) => ({
		category,
		operators: entries.filter((entry) => entry.category === category)
	}));
};
