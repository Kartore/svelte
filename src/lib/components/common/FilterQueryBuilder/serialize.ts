import type {
	ExpressionFilterSpecification,
	ExpressionSpecification
} from '@maplibre/maplibre-gl-style-spec';

import type { FilterGroupNode, FilterNode, FilterSubject } from './model.ts';

const serializeSubject = (subject: FilterSubject): ExpressionSpecification => {
	switch (subject.kind) {
		case 'property':
			return ['get', subject.key];
		case 'geometry-type':
			return ['geometry-type'];
		case 'id':
			return ['id'];
		case 'zoom':
			return ['zoom'];
	}
};

export const serializeFilterNode = (node: FilterNode): ExpressionSpecification => {
	switch (node.kind) {
		case 'group': {
			const children = node.children.map(serializeFilterNode);
			if (node.op === 'none') return ['!', ['any', ...children]];
			return [node.op, ...children];
		}
		case 'comparison':
			return [node.op, serializeSubject(node.subject), node.value] as ExpressionSpecification;
		case 'exists': {
			const expression: ExpressionSpecification = ['has', node.key];
			return node.negated ? ['!', expression] : expression;
		}
		case 'membership': {
			const expression: ExpressionSpecification = [
				'in',
				serializeSubject(node.subject),
				['literal', node.values]
			];
			return node.negated ? ['!', expression] : expression;
		}
		case 'raw':
			return node.expression as ExpressionSpecification;
	}
};

export const serializeFilter = (node: FilterGroupNode): ExpressionFilterSpecification => {
	return serializeFilterNode(node);
};
