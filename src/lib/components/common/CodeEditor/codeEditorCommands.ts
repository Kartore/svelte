import { IndentContext, getIndentation, getIndentUnit, indentString } from '@codemirror/language';
import { countColumn, EditorSelection } from '@codemirror/state';
import type { Command } from '@codemirror/view';

/**
 * Inserts one indented line break. CodeMirror's default Enter command inserts
 * an additional line break between matching brackets, which feels like a
 * duplicated newline in the JSON editor.
 */
export const insertSingleNewlineAndIndent: Command = ({ state, dispatch }) => {
	if (state.readOnly) return false;

	const changes = state.changeByRange((range) => {
		let { from, to } = range;
		const line = state.doc.lineAt(from);
		const context = new IndentContext(state, { simulateBreak: from });
		let indentation = getIndentation(context, from);
		if (indentation === null) {
			indentation = countColumn(/^\s*/.exec(line.text)?.[0] ?? '', state.tabSize);
		}
		if (/\(\)|\[\]|\{\}/.test(state.sliceDoc(from - 1, from + 1))) {
			const lineIndentation = countColumn(/^\s*/.exec(line.text)?.[0] ?? '', state.tabSize);
			indentation = lineIndentation + getIndentUnit(state);
		}

		while (to < line.to && /\s/.test(line.text[to - line.from] ?? '')) to += 1;
		if (
			from > line.from &&
			from < line.from + 100 &&
			!/\S/.test(line.text.slice(0, from - line.from))
		) {
			from = line.from;
		}

		const insert = `${state.lineBreak}${indentString(state, indentation)}`;
		return {
			changes: { from, to, insert },
			range: EditorSelection.cursor(from + insert.length)
		};
	});

	dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input' }));
	return true;
};
