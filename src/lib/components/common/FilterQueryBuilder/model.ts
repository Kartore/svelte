export type FilterNode = FilterGroupNode | FilterConditionNode | FilterRawNode;

export type FilterGroupNode = {
	kind: 'group';
	op: 'all' | 'any' | 'none';
	children: FilterNode[];
};

export type FilterSubject =
	{ kind: 'property'; key: string } | { kind: 'geometry-type' } | { kind: 'id' } | { kind: 'zoom' };

export type FilterConditionNode =
	| {
			kind: 'comparison';
			op: '==' | '!=' | '<' | '<=' | '>' | '>=';
			subject: FilterSubject;
			value: string | number | boolean;
	  }
	| { kind: 'exists'; negated: boolean; key: string }
	| {
			kind: 'membership';
			negated: boolean;
			subject: FilterSubject;
			values: (string | number)[];
	  };

export type FilterRawNode = { kind: 'raw'; expression: unknown[] };

export const isFilterBuilderSupported = (node: FilterNode, depth = 0, maxDepth = 2): boolean => {
	if (node.kind === 'raw') return false;
	if (node.kind !== 'group') return true;
	if (depth > maxDepth) return false;
	return node.children.every((child) => isFilterBuilderSupported(child, depth + 1, maxDepth));
};
