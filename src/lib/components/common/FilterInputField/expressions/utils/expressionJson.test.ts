import { latest } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import { parseExpressionJson } from './expressionJson.ts';

describe('parseExpressionJson', () => {
	it('accepts an advanced property expression supported by MapLibre', () => {
		const result = parseExpressionJson(
			JSON.stringify(['let', 'width', ['get', 'width'], ['*', ['var', 'width'], 2]]),
			latest.paint_line['line-width']
		);

		expect(result).toEqual({
			ok: true,
			value: ['let', 'width', ['get', 'width'], ['*', ['var', 'width'], 2]]
		});
	});

	it('rejects malformed JSON', () => {
		const result = parseExpressionJson('["get",');
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toContain('Invalid JSON');
	});

	it('rejects a non-array JSON value', () => {
		expect(parseExpressionJson('{"get":"name"}')).toEqual({
			ok: false,
			error: 'Expression must be a JSON array.'
		});
	});

	it('rejects an expression whose output type does not match the property', () => {
		const result = parseExpressionJson(
			JSON.stringify(['concat', 'wide', 'line']),
			latest.paint_line['line-width']
		);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error).toContain('Expected number but found string');
	});

	it('rejects an unknown expression operator', () => {
		const result = parseExpressionJson(JSON.stringify(['not-a-maplibre-expression', 1]));
		expect(result.ok).toBe(false);
	});
});
