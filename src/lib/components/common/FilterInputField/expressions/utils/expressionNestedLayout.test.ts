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

		// Three wrappers hold the compact get expressions, and each get keeps its literal key row nowrap.
		expect(body.match(/class="group\/arg[^"]*flex-nowrap[^"]*"/g)).toHaveLength(6);
		expect(
			body.match(/data-expression-node="nested"[^>]*class="[^"]*flex-nowrap[^"]*"/g)
		).toHaveLength(3);
		for (const nestedNode of body.match(/<div data-expression-node="nested"[^>]*>/g) ?? []) {
			expect(nestedNode).not.toContain('style=');
		}
		expect(body).toContain('text-ellipsis');
		expect(body).toMatch(/class="[^"]*shrink-0[^"]*whitespace-nowrap[^"]*"[^>]*>入力/);
		expect(body.match(/h-6 shrink-0/g)).toHaveLength(3);
		expect(
			body.match(/<button(?=[^>]*aria-label="式の演算子")(?=[^>]*class="[^"]*px-1[^"]*")[^>]*>/g)
		).toHaveLength(3);
		expect(body.match(/grid-cols-\[minmax\(0,0\.8fr\)_16px_minmax\(0,1\.2fr\)\]/g)).toHaveLength(3);
		expect(body.match(/flex-nowrap gap-x-1/g)).toHaveLength(3);
		expect(body).not.toContain('aria-label="式に変換"');
		expect(body).not.toContain('現在のフィーチャー');
	});

	it('keeps the full metadata when get is the root expression', () => {
		const body = renderExpression(['get', 'name']);

		expect(body).toContain('現在のフィーチャー');
		expect(body).toContain('flex-wrap');
		expect(body).toContain('aria-label="式に変換"');
	});
});
