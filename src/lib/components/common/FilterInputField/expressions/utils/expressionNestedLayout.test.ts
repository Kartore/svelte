import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';

import ExpressionInputField from '../ExpressionInputField.svelte';

const renderExpression = (value: ExpressionSpecification) =>
	render(ExpressionInputField, {
		props: {
			value,
			onChange: () => undefined
		}
	}).body;

describe('compact nested expression layout', () => {
	it('renders nested get arguments as nowrap controls without root-only metadata', () => {
		const body = renderExpression([
			'match',
			['get', 'kind'],
			'park',
			['get', 'name'],
			['get', 'fallback']
		] as unknown as ExpressionSpecification);

		expect(body.match(/class="group\/arg[^"]*flex-nowrap[^"]*"/g)).toHaveLength(3);
		expect(
			body.match(/data-expression-node="nested"[^>]*class="[^"]*flex-nowrap[^"]*"/g)
		).toHaveLength(3);
		for (const nestedNode of body.match(/<div data-expression-node="nested"[^>]*>/g) ?? []) {
			expect(nestedNode).not.toContain('style=');
		}
		expect(body).toContain('text-ellipsis');
		expect(body).not.toContain('現在のフィーチャー');
	});

	it('keeps the full metadata when get is the root expression', () => {
		const body = renderExpression(['get', 'name']);

		expect(body).toContain('現在のフィーチャー');
		expect(body).toContain('flex-wrap');
	});
});
