<script lang="ts">
	import { shikiToMonaco } from '@shikijs/monaco';
	import * as monaco from 'monaco-editor';
	import { untrack } from 'svelte';
	import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
	import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
	import { createHighlighter } from 'shiki/bundle/web';

	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		value = '',
		language = 'json',
		options,
		onChange,
		onMount
	}: {
		class?: string;
		value?: string;
		language?: string;
		options?: monaco.editor.IStandaloneEditorConstructionOptions;
		onChange?: (value: string) => void;
		onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monacoApi: typeof monaco) => void;
	} = $props();

	let container: HTMLDivElement;
	let editor: monaco.editor.IStandaloneCodeEditor | undefined;
	let applyingExternal = false;

	self.MonacoEnvironment = {
		getWorker(_, label) {
			if (label === 'json') {
				return new jsonWorker();
			}
			return new editorWorker();
		}
	};

	$effect(() => {
		// 生成はマウント時の一度きり。value 等を追跡すると変更のたびにエディタが
		// dispose → 再生成されて画面がチラつくため untrack で読む
		const mountedEditor = untrack(() =>
			monaco.editor.create(container, {
				value,
				language,
				theme: 'github-light',
				minimap: { enabled: false },
				scrollBeyondLastLine: false,
				automaticLayout: true,
				...options
			})
		);
		editor = mountedEditor;
		mountedEditor.onDidChangeModelContent(() => {
			if (applyingExternal) return;
			onChange?.(mountedEditor.getValue());
		});
		untrack(() => onMount?.(mountedEditor, monaco));
		void (async () => {
			const highlighter = await createHighlighter({
				themes: ['github-light'],
				langs: ['json']
			});
			monaco.languages.register({ id: 'json' });
			shikiToMonaco(highlighter, monaco);
		})();
		return () => {
			mountedEditor.dispose();
			editor = undefined;
		};
	});

	$effect(() => {
		if (!editor || value === editor.getValue()) return;
		const timer = setTimeout(() => {
			if (!editor || value === editor.getValue()) return;
			const model = editor.getModel();
			if (!model) return;
			applyingExternal = true;
			try {
				// setValue はモデル全置換でビューステートも失うため、全範囲編集で差し替える
				const viewState = editor.saveViewState();
				editor.executeEdits('kartore-external', [
					{ range: model.getFullModelRange(), text: value }
				]);
				if (viewState) editor.restoreViewState(viewState);
			} finally {
				applyingExternal = false;
			}
		}, 300);
		return () => clearTimeout(timer);
	});
</script>

<div bind:this={container} class={cn('h-full w-full', className)}></div>
