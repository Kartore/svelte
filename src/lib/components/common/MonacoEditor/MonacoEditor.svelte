<script lang="ts">
	import { shikiToMonaco } from '@shikijs/monaco';
	import * as monaco from 'monaco-editor';
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
	import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
	import { createHighlighter } from 'shiki/bundle/web';

	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		value = '',
		language = 'json',
		modelUri,
		options,
		onChange,
		onMount
	}: {
		class?: string;
		value?: string;
		language?: string;
		/** Stable URI used to scope language-service schemas and diagnostics. */
		modelUri?: string;
		options?: monaco.editor.IStandaloneEditorConstructionOptions;
		onChange?: (value: string) => void;
		onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monacoApi: typeof monaco) => void;
	} = $props();

	let editor: monaco.editor.IStandaloneCodeEditor | undefined;
	let applyingExternal = false;

	const attachEditor: Attachment<HTMLDivElement> = (container) => {
		self.MonacoEnvironment = {
			getWorker(_, label) {
				if (label === 'json') return new jsonWorker();
				return new editorWorker();
			}
		};

		// Monaco の生成条件は初回だけ読む。value の同期は下の専用 attachment が担当する。
		const initial = untrack(() => ({ value, language, modelUri, options, onChange, onMount }));
		const createdModel = initial.modelUri
			? monaco.editor.createModel(
					initial.value,
					initial.language,
					monaco.Uri.parse(initial.modelUri)
				)
			: undefined;
		const mountedEditor = monaco.editor.create(container, {
			...(createdModel
				? { model: createdModel }
				: { value: initial.value, language: initial.language }),
			theme: 'github-light',
			minimap: { enabled: false },
			scrollBeyondLastLine: false,
			automaticLayout: true,
			...initial.options
		});
		editor = mountedEditor;

		mountedEditor.onDidChangeModelContent(() => {
			if (applyingExternal) return;
			initial.onChange?.(mountedEditor.getValue());
		});
		initial.onMount?.(mountedEditor, monaco);
		void (async () => {
			const highlighter = await createHighlighter({
				themes: ['github-light'],
				langs: ['json']
			});
			monaco.languages.register({ id: 'json' });
			shikiToMonaco(highlighter, monaco);
		})();

		return () => {
			if (editor === mountedEditor) editor = undefined;
			mountedEditor.dispose();
			createdModel?.dispose();
		};
	};

	// value 専用 attachment は Monaco 本体を再生成せず、外部変更だけを反映する。
	const syncEditorValue = (externalValue: string): Attachment<HTMLDivElement> => {
		return () => {
			const mountedEditor = editor;
			if (!mountedEditor || externalValue === mountedEditor.getValue()) return;
			const timer = setTimeout(() => {
				if (editor !== mountedEditor || externalValue === mountedEditor.getValue()) return;
				const model = mountedEditor.getModel();
				if (!model) return;
				applyingExternal = true;
				try {
					// setValue はモデル全置換でビューステートも失うため、全範囲編集で差し替える
					const viewState = mountedEditor.saveViewState();
					mountedEditor.executeEdits('kartore-external', [
						{ range: model.getFullModelRange(), text: externalValue }
					]);
					if (viewState) mountedEditor.restoreViewState(viewState);
				} finally {
					applyingExternal = false;
				}
			}, 300);
			return () => clearTimeout(timer);
		};
	};
</script>

<div
	{@attach attachEditor}
	{@attach syncEditorValue(value)}
	class={cn('h-full w-full', className)}
></div>
