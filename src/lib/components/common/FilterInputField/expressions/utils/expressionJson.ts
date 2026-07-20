import {
	createExpression,
	createPropertyExpression,
	type ExpressionSpecification,
	type StylePropertySpecification
} from '@maplibre/maplibre-gl-style-spec';

import type { StylePropertySpec } from '$lib/utils/layerSpec.ts';

export type ExpressionJsonResult =
	{ ok: true; value: ExpressionSpecification } | { ok: false; error: string };

const formatParseErrors = (errors: { message: string }[]): string => {
	return [...new Set(errors.map(({ message }) => message))].join(' ');
};

/** Parses and validates a JSON expression without mutating the current style. */
export const parseExpressionJson = (
	draft: string,
	propertySpec?: StylePropertySpec
): ExpressionJsonResult => {
	let parsed: unknown;
	try {
		parsed = JSON.parse(draft);
	} catch (caught) {
		return {
			ok: false,
			error: `Invalid JSON: ${caught instanceof Error ? caught.message : String(caught)}`
		};
	}

	if (!Array.isArray(parsed)) {
		return { ok: false, error: 'Expression must be a JSON array.' };
	}

	const result = propertySpec
		? createPropertyExpression(parsed, 'expression', propertySpec as StylePropertySpecification)
		: createExpression(parsed, 'expression');
	if (result.result === 'error') {
		return { ok: false, error: formatParseErrors(result.value) };
	}

	return { ok: true, value: parsed as ExpressionSpecification };
};
