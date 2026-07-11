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
