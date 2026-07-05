<script lang="ts">
	import { shikiToMonaco } from '@shikijs/monaco';
	import * as monaco from 'monaco-editor';
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

	self.MonacoEnvironment = {
		getWorker(_, label) {
			if (label === 'json') {
				return new jsonWorker();
			}
			return new editorWorker();
		}
	};

	$effect(() => {
		editor = monaco.editor.create(container, {
			value,
			language,
			theme: 'github-light',
			minimap: { enabled: false },
			scrollBeyondLastLine: false,
			automaticLayout: true,
			...options
		});
		const mountedEditor = editor;
		mountedEditor.onDidChangeModelContent(() => {
			onChange?.(mountedEditor.getValue());
		});
		onMount?.(mountedEditor, monaco);
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
		if (editor && value !== editor.getValue()) {
			editor.setValue(value);
		}
	});
</script>

<div bind:this={container} class={cn('h-full w-full', className)}></div>
