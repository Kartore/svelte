/** from https://github.com/maplibre/maplibre-style-spec/blob/95c905812b537a017a14b383233f2722d7ff14db/src/feature_filter/index.ts
 *
 */

import type { ExpressionFilterSpecification } from '@maplibre/maplibre-gl-style-spec';

export function isExpressionFilter(filter: unknown): filter is ExpressionFilterSpecification {
	if (filter === true || filter === false) {
		return true;
	}

	if (!Array.isArray(filter) || filter.length === 0) {
		return false;
	}
	switch (filter[0]) {
		case 'has':
			return filter.length >= 2 && filter[1] !== '$id' && filter[1] !== '$type';

		case 'in':
			return filter.length >= 3 && (typeof filter[1] !== 'string' || Array.isArray(filter[2]));

		case '!in':
		case '!has':
		case 'none':
			return false;

		case '==':
		case '!=':
		case '>':
		case '>=':
		case '<':
		case '<=':
			return filter.length !== 3 || Array.isArray(filter[1]) || Array.isArray(filter[2]);

		case 'any':
		case 'all':
			for (const f of filter.slice(1)) {
				if (!isExpressionFilter(f) && typeof f !== 'boolean') {
					return false;
				}
			}
			return true;

		default:
			return true;
	}
}
