import type { SelectItem } from '#lib/components/common/Select';

const DEFAULT_EXPRESSION_TYPE_ITEMS: SelectItem[] = [
	{ value: 'interpolate', label: 'interpolate' },
	{ value: 'step', label: 'step' },
	{ value: 'match', label: 'match' },
	{ value: 'case', label: 'case' },
	{ value: 'get', label: 'get' },
	{ value: 'literal', label: 'literal' }
];

export const getExpressionTypeItems = (expressionType: string): SelectItem[] =>
	DEFAULT_EXPRESSION_TYPE_ITEMS.some((item) => item.value === expressionType)
		? DEFAULT_EXPRESSION_TYPE_ITEMS
		: [{ value: expressionType, label: expressionType }, ...DEFAULT_EXPRESSION_TYPE_ITEMS];
