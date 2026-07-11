import { convertFilter } from '@maplibre/maplibre-gl-style-spec';
import type {
	ExpressionFilterSpecification,
	FilterSpecification
} from '@maplibre/maplibre-gl-style-spec';

import { isExpressionFilter } from '$lib/components/editor/PropertiesPanel/LayerPropertiesPanel/common/FilterProperties/utils/isExpressionFilter.ts';

import type { FilterConditionNode, FilterGroupNode, FilterNode, FilterSubject } from './model.ts';

type ComparisonOperator = Extract<FilterConditionNode, { kind: 'comparison' }>['op'];

const comparisonOperators = new Set<ComparisonOperator>(['==', '!=', '<', '<=', '>', '>=']);
const typeofNames = new Set(['string', 'number', 'boolean']);

const isComparisonOperator = (value: unknown): value is ComparisonOperator => {
	return typeof value === 'string' && comparisonOperators.has(value as ComparisonOperator);
};

const isPrimitive = (value: unknown): value is string | number | boolean => {
	return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
};

const isMembershipValue = (value: unknown): value is string | number => {
	return typeof value === 'string' || typeof value === 'number';
};

const parseSubject = (value: unknown): FilterSubject | undefined => {
	if (!Array.isArray(value) || typeof value[0] !== 'string') return undefined;

	if (value.length === 2 && value[0] === 'get' && typeof value[1] === 'string') {
		return { kind: 'property', key: value[1] };
	}
	if (value.length !== 1) return undefined;

	switch (value[0]) {
		case 'geometry-type':
			return { kind: 'geometry-type' };
		case 'id':
			return { kind: 'id' };
		case 'zoom':
			return { kind: 'zoom' };
		default:
			return undefined;
	}
};

const subjectsEqual = (left: FilterSubject, right: FilterSubject): boolean => {
	if (left.kind !== right.kind) return false;
	return left.kind !== 'property' || (right.kind === 'property' && left.key === right.key);
};

const parseComparison = (value: unknown): FilterConditionNode | undefined => {
	if (
		!Array.isArray(value) ||
		value.length !== 3 ||
		!isComparisonOperator(value[0]) ||
		!isPrimitive(value[2])
	) {
		return undefined;
	}

	const subject = parseSubject(value[1]);
	if (!subject) return undefined;

	return {
		kind: 'comparison',
		op: value[0],
		subject,
		value: value[2]
	};
};

const parseMembership = (
	value: unknown
): Extract<FilterConditionNode, { kind: 'membership' }> | undefined => {
	if (!Array.isArray(value)) return undefined;

	let subjectValue: unknown;
	let valuesValue: unknown;
	let negated = false;

	if (
		value.length === 3 &&
		value[0] === 'in' &&
		Array.isArray(value[2]) &&
		value[2].length === 2 &&
		value[2][0] === 'literal'
	) {
		subjectValue = value[1];
		valuesValue = value[2][1];
	} else if (
		value.length === 5 &&
		value[0] === 'match' &&
		((value[3] === true && value[4] === false) || (value[3] === false && value[4] === true))
	) {
		subjectValue = value[1];
		valuesValue = value[2];
		negated = value[3] === false;
	} else {
		return undefined;
	}

	const subject = parseSubject(subjectValue);
	if (!subject || !Array.isArray(valuesValue) || !valuesValue.every(isMembershipValue)) {
		return undefined;
	}

	return { kind: 'membership', negated, subject, values: valuesValue };
};

const parseTypeofGuard = (value: unknown): FilterConditionNode | undefined => {
	if (!Array.isArray(value) || value.length !== 4 || value[0] !== 'case' || value[3] !== false) {
		return undefined;
	}

	const guard = value[1];
	const guardedComparison = value[2];
	if (
		!Array.isArray(guard) ||
		guard.length !== 3 ||
		guard[0] !== '==' ||
		!Array.isArray(guard[1]) ||
		guard[1].length !== 2 ||
		guard[1][0] !== 'typeof' ||
		typeof guard[2] !== 'string' ||
		!typeofNames.has(guard[2])
	) {
		return undefined;
	}

	const guardedSubject = parseSubject(guard[1][1]);
	const comparison = parseComparison(guardedComparison);
	if (
		!guardedSubject ||
		!comparison ||
		comparison.kind !== 'comparison' ||
		!subjectsEqual(guardedSubject, comparison.subject)
	) {
		return undefined;
	}

	return comparison;
};

const rawNode = (expression: unknown[]): FilterNode => ({ kind: 'raw', expression });

const parseNode = (value: unknown): FilterNode => {
	if (value === true) return { kind: 'group', op: 'all', children: [] };
	if (value === false) return { kind: 'group', op: 'any', children: [] };
	if (!Array.isArray(value)) return rawNode(['literal', value]);

	if ((value[0] === 'all' || value[0] === 'any') && value.length >= 1) {
		return {
			kind: 'group',
			op: value[0],
			children: value.slice(1).map(parseNode)
		};
	}

	if (value[0] === '!' && value.length === 2 && Array.isArray(value[1])) {
		const inner = value[1];
		if (inner[0] === 'any') {
			return { kind: 'group', op: 'none', children: inner.slice(1).map(parseNode) };
		}
		if (inner.length === 2 && inner[0] === 'has' && typeof inner[1] === 'string') {
			return { kind: 'exists', negated: true, key: inner[1] };
		}
		const membership = parseMembership(inner);
		if (membership) return { ...membership, negated: !membership.negated };
	}

	const guardedComparison = parseTypeofGuard(value);
	if (guardedComparison) return guardedComparison;

	const comparison = parseComparison(value);
	if (comparison) return comparison;

	if (value.length === 2 && value[0] === 'has' && typeof value[1] === 'string') {
		return { kind: 'exists', negated: false, key: value[1] };
	}

	const membership = parseMembership(value);
	if (membership) return membership;

	return rawNode(value);
};

const normalizeFilter = (filter: FilterSpecification): ExpressionFilterSpecification => {
	return isExpressionFilter(filter) ? filter : convertFilter(filter);
};

export const parseFilter = (filter: FilterSpecification | undefined): FilterGroupNode => {
	if (filter === undefined) return { kind: 'group', op: 'all', children: [] };

	const node = parseNode(normalizeFilter(filter));
	return node.kind === 'group' ? node : { kind: 'group', op: 'all', children: [node] };
};
