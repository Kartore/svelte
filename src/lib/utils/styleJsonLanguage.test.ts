import { CompletionContext } from '@codemirror/autocomplete';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';

import {
	createStyleJsonDiagnostics,
	getStyleJsonCompletions,
	getStyleJsonHover,
	styleJsonCompletionSource
} from './styleJsonLanguage.ts';

const createState = (doc: string): EditorState => EditorState.create({ doc, extensions: [json()] });

describe('style JSON language support', () => {
	it('completes root properties', () => {
		const doc = '{\n  ';
		const state = createState(doc);

		const result = getStyleJsonCompletions(state, doc.length, true);

		expect(result?.options.map((option) => option.label)).toEqual(
			expect.arrayContaining(['version', 'sources', 'layers'])
		);
		expect(result?.options.find((option) => option.label === 'version')?.apply).toBe('"version": ');
	});

	it('completes properties for the current layer type', () => {
		const doc = JSON.stringify({
			version: 8,
			sources: {},
			layers: [{ id: 'water', type: 'fill', paint: {} }]
		});
		const position = doc.indexOf('{}', doc.indexOf('"paint"')) + 1;
		const result = getStyleJsonCompletions(createState(doc), position, true);
		const labels = result?.options.map((option) => option.label) ?? [];

		expect(labels).toContain('fill-color');
		expect(labels).toContain('fill-color-transition');
		expect(labels).not.toContain('line-width');
	});

	it('completes source properties for the current source type', () => {
		const doc = JSON.stringify({
			version: 8,
			sources: { roads: { type: 'vector' } },
			layers: []
		}).replace('"vector"}', '"vector", }');
		const position = doc.indexOf('}', doc.indexOf('"vector"'));
		const result = getStyleJsonCompletions(createState(doc), position, true);
		const labels = result?.options.map((option) => option.label) ?? [];

		expect(labels).toContain('url');
		expect(labels).toContain('tiles');
		expect(labels).not.toContain('data');
	});

	it('completes an incomplete quoted property and excludes properties already present', () => {
		const doc =
			'{"version":8,"sources":{},"layers":[{"id":"water","type":"fill","paint":{"fill-opacity":1,"fill-c';
		const state = createState(doc);
		const context = new CompletionContext(state, doc.length, false);

		const result = styleJsonCompletionSource(context);

		expect(
			result && !(result instanceof Promise) ? result.options.map((option) => option.label) : []
		).toContain('fill-color');
		expect(
			result && !(result instanceof Promise) ? result.options.map((option) => option.label) : []
		).not.toContain('fill-opacity');
		expect(
			result && !(result instanceof Promise)
				? result.options.find((option) => option.label === 'fill-color')?.apply
				: undefined
		).toBe('fill-color": ');
	});

	it('shows official property documentation on hover', () => {
		const doc = JSON.stringify({
			version: 8,
			sources: {},
			layers: [{ id: 'water', type: 'fill', paint: { 'fill-color': '#000000' } }]
		});
		const position = doc.indexOf('fill-color') + 2;

		const hover = getStyleJsonHover(createState(doc), position);

		expect(hover?.title).toBe('fill-color');
		expect(hover?.detail).toContain('color');
		expect(hover?.documentation).toContain('filled part');
	});

	it('maps semantic validation paths to property and value ranges', () => {
		const doc = JSON.stringify({
			version: 8,
			sources: {},
			layers: [
				{ id: 'water', type: 'fill', paint: { 'fill-colorr': '#000000', 'fill-opacity': 2 } }
			]
		});
		const diagnostics = createStyleJsonDiagnostics(doc, [
			'layers[0]: missing required property "source"',
			'layers[0].paint.fill-colorr: unknown property "fill-colorr"',
			'layers[0].paint.fill-opacity: 2 is greater than the maximum value 1'
		]);

		expect(doc.slice(diagnostics[0].from, diagnostics[0].to)).toBe('{');
		expect(doc.slice(diagnostics[1].from, diagnostics[1].to)).toBe('"fill-colorr"');
		expect(doc.slice(diagnostics[2].from, diagnostics[2].to)).toBe('2');
		expect(diagnostics.every((diagnostic) => diagnostic.severity === 'warning')).toBe(true);
	});

	it('handles dots in dynamic source names when mapping diagnostics', () => {
		const doc = JSON.stringify({
			version: 8,
			sources: { 'tiles.example': { type: 'vector', bogus: true } },
			layers: []
		});
		const [diagnostic] = createStyleJsonDiagnostics(doc, [
			'sources.tiles.example.bogus: unknown property "bogus"'
		]);

		expect(doc.slice(diagnostic.from, diagnostic.to)).toBe('"bogus"');
	});
});
