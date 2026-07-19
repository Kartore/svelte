<script lang="ts">
	import { autocompletion, type CompletionSource } from '@codemirror/autocomplete';
	import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
	import { json, jsonParseLinter } from '@codemirror/lang-json';
	import {
		bracketMatching,
		defaultHighlightStyle,
		foldGutter,
		indentUnit,
		syntaxHighlighting
	} from '@codemirror/language';
	import { forceLinting, linter } from '@codemirror/lint';
	import { Compartment, EditorState, Prec, Transaction } from '@codemirror/state';
	import {
		EditorView,
		hoverTooltip,
		keymap,
		lineNumbers,
		type HoverTooltipSource
	} from '@codemirror/view';
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	import { insertSingleNewlineAndIndent } from './codeEditorCommands.ts';
	import { cn } from '$lib/utils/tailwindUtil.ts';

	type CodeEditorDiagnostic = {
		from: number;
		to: number;
		severity: 'error' | 'warning';
		message: string;
		source?: string;
	};
	type CodeEditorScrollTarget = {
		request: string | number;
		findPosition: (value: string) => number | null;
	};

	let {
		class: className,
		value = '',
		readOnly = false,
		lint,
		onChange,
		onSubmit,
		scrollTarget,
		completionSource,
		hoverSource,
		lintVersion
	}: {
		class?: string;
		value?: string;
		readOnly?: boolean;
		/** Additional semantic diagnostics. JSON syntax diagnostics are always enabled. */
		lint?: (text: string) => CodeEditorDiagnostic[];
		onChange?: (value: string) => void;
		onSubmit?: () => void;
		/** Resolves an application-level navigation request to a document position. */
		scrollTarget?: CodeEditorScrollTarget;
		completionSource?: CompletionSource;
		hoverSource?: HoverTooltipSource;
		/** Refreshes external lint results when their backing validation changes. */
		lintVersion?: unknown;
	} = $props();

	let editor: EditorView | undefined;
	let applyingExternal = false;
	const readOnlyConfig = new Compartment();

	const editorTheme = EditorView.theme({
		'&': {
			flex: '1 1 auto',
			height: '100%',
			minHeight: '0',
			width: '100%',
			backgroundColor: '#ffffff',
			color: '#24292f',
			fontSize: '12px'
		},
		'&.cm-focused': {
			outline: 'none'
		},
		'.cm-scroller': {
			fontFamily:
				'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
			lineHeight: '20px'
		},
		'.cm-content': {
			padding: '10px 0',
			caretColor: '#24292f'
		},
		'.cm-line': {
			padding: '0 8px'
		},
		'.cm-gutters': {
			borderRight: '1px solid #f0f1f2',
			backgroundColor: '#ffffff',
			color: '#8c959f'
		},
		'.cm-lineNumbers .cm-gutterElement': {
			minWidth: '3ch',
			padding: '0 8px 0 6px'
		},
		'.cm-activeLine, .cm-activeLineGutter': {
			backgroundColor: '#f6f8fa'
		},
		'&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
			backgroundColor: '#b6d7ff'
		},
		'.cm-cursor, .cm-dropCursor': {
			borderLeftColor: '#24292f'
		},
		'.cm-foldGutter .cm-gutterElement': {
			color: '#8c959f'
		},
		'.cm-style-json-hover': {
			boxSizing: 'border-box',
			maxWidth: '32rem',
			maxHeight: '18rem',
			overflowY: 'auto',
			padding: '8px 10px',
			fontFamily:
				'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
			fontSize: '12px',
			lineHeight: '1.45',
			color: '#24292f'
		},
		'.cm-style-json-hover-title': {
			fontFamily:
				'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
			fontWeight: '600'
		},
		'.cm-style-json-hover-detail': {
			marginTop: '2px',
			color: '#57606a'
		},
		'.cm-style-json-hover-documentation': {
			marginTop: '7px',
			whiteSpace: 'pre-wrap'
		}
	});

	const attachEditor: Attachment<HTMLDivElement> = (container) => {
		// Editor generation settings are read once. Reactive value/readOnly sync is handled below.
		const initial = untrack(() => ({ value, readOnly }));
		const mountedEditor = new EditorView({
			parent: container,
			state: EditorState.create({
				doc: initial.value,
				extensions: [
					lineNumbers(),
					history(),
					Prec.high(
						keymap.of([
							{
								key: 'Mod-Enter',
								run: (view) => {
									if (!onSubmit) return insertSingleNewlineAndIndent(view);
									onSubmit();
									return true;
								}
							},
							{
								key: 'Enter',
								run: insertSingleNewlineAndIndent,
								shift: insertSingleNewlineAndIndent
							}
						])
					),
					keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
					json(),
					autocompletion({
						override: [
							(context) => (context.state.readOnly ? null : (completionSource?.(context) ?? null))
						]
					}),
					hoverTooltip((view, position, side) => hoverSource?.(view, position, side) ?? null, {
						hideOnChange: true
					}),
					syntaxHighlighting(defaultHighlightStyle),
					bracketMatching(),
					foldGutter(),
					linter(jsonParseLinter()),
					linter((view) => lint?.(view.state.doc.toString()) ?? []),
					EditorView.lineWrapping,
					EditorView.contentAttributes.of({
						'aria-label': 'JSON code editor',
						spellcheck: 'false'
					}),
					EditorState.tabSize.of(2),
					indentUnit.of('  '),
					readOnlyConfig.of([
						EditorState.readOnly.of(initial.readOnly),
						EditorView.editable.of(!initial.readOnly)
					]),
					EditorView.updateListener.of((update) => {
						if (!update.docChanged || applyingExternal) return;
						onChange?.(update.state.doc.toString());
					}),
					editorTheme
				]
			})
		});
		editor = mountedEditor;

		return () => {
			if (editor === mountedEditor) editor = undefined;
			mountedEditor.destroy();
		};
	};

	const syncEditorValue = (externalValue: string): Attachment<HTMLDivElement> => {
		return () => {
			const mountedEditor = editor;
			if (!mountedEditor || externalValue === mountedEditor.state.doc.toString()) return;
			applyingExternal = true;
			try {
				mountedEditor.dispatch({
					annotations: Transaction.addToHistory.of(false),
					changes: {
						from: 0,
						to: mountedEditor.state.doc.length,
						insert: externalValue
					}
				});
			} finally {
				applyingExternal = false;
			}
		};
	};

	const syncReadOnly = (isReadOnly: boolean): Attachment<HTMLDivElement> => {
		return () => {
			const mountedEditor = editor;
			if (!mountedEditor) return;
			mountedEditor.dispatch({
				effects: readOnlyConfig.reconfigure([
					EditorState.readOnly.of(isReadOnly),
					EditorView.editable.of(!isReadOnly)
				])
			});
		};
	};

	const scrollEditorToTarget = (
		target: CodeEditorScrollTarget | undefined
	): Attachment<HTMLDivElement> => {
		return () => {
			const mountedEditor = editor;
			if (!mountedEditor || !target) return;
			void target.request;
			const position = target.findPosition(mountedEditor.state.doc.toString());
			if (
				position === null ||
				!Number.isSafeInteger(position) ||
				position < 0 ||
				position > mountedEditor.state.doc.length
			) {
				return;
			}
			mountedEditor.dispatch({
				annotations: Transaction.addToHistory.of(false),
				selection: { anchor: position },
				effects: EditorView.scrollIntoView(position, { y: 'center' })
			});
		};
	};

	const refreshLint = (version: unknown): Attachment<HTMLDivElement> => {
		return () => {
			void version;
			if (editor) forceLinting(editor);
		};
	};
</script>

<div
	{@attach attachEditor}
	{@attach syncEditorValue(value)}
	{@attach syncReadOnly(readOnly)}
	{@attach refreshLint(lintVersion)}
	{@attach scrollEditorToTarget(scrollTarget)}
	class={cn('flex h-full min-h-0 w-full flex-col', className)}
></div>
