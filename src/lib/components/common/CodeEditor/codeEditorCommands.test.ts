import { json } from '@codemirror/lang-json';
import { indentUnit } from '@codemirror/language';
import { EditorState, type Transaction } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { describe, expect, it } from 'vitest';

import { insertSingleNewlineAndIndent } from './codeEditorCommands.ts';

const runEnter = (doc: string, position: number) => {
	let state = EditorState.create({
		doc,
		selection: { anchor: position },
		extensions: [json(), indentUnit.of('  ')]
	});
	const view = {
		get state() {
			return state;
		},
		dispatch(transaction: Transaction) {
			state = transaction.state;
		}
	} as EditorView;

	insertSingleNewlineAndIndent(view);
	return state;
};

describe('insertSingleNewlineAndIndent', () => {
	it.each([
		['{}', 1, '{\n  }'],
		['[]', 1, '[\n  ]']
	])('inserts only one newline between matching brackets in %s', (doc, position, expected) => {
		const state = runEnter(doc, position);

		expect(state.doc.toString()).toBe(expected);
		expect(state.selection.main.head).toBe(4);
	});

	it('keeps the syntax indentation on regular lines', () => {
		const doc = '{\n  "first": 1,\n  "second": 2\n}';
		const position = doc.indexOf(',', doc.indexOf('"first"')) + 1;
		const state = runEnter(doc, position);

		expect(state.doc.toString()).toBe('{\n  "first": 1,\n  \n  "second": 2\n}');
		expect(state.doc.lineAt(state.selection.main.head).text).toBe('  ');
	});
});
