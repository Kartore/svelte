import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';

import type { EditorModule } from './EditorModule.ts';
import { collectEditorMenuSections, resolveEditorMenuSection } from './editorMenu.ts';

const component = (name: string): Component => ({ name }) as unknown as Component;

describe('editor menu sections', () => {
	it('resolves the section for the requested menu', () => {
		const file = component('file');
		const module: EditorModule = {
			id: 'fixture',
			menuSections: { file }
		};

		expect(resolveEditorMenuSection(module, 'file')).toBe(file);
		expect(resolveEditorMenuSection(module, 'edit')).toBeUndefined();
	});

	it('collects extensions for every menu in module order', () => {
		const firstEdit = component('first-edit');
		const secondEdit = component('second-edit');
		const view = component('view');
		const assets = component('assets');
		const modules: EditorModule[] = [
			{ id: 'first', menuSections: { edit: firstEdit, view } },
			{ id: 'second', menuSections: { edit: secondEdit, assets } }
		];

		expect(collectEditorMenuSections(modules)).toEqual({
			file: [],
			edit: [
				{ moduleId: 'first', component: firstEdit },
				{ moduleId: 'second', component: secondEdit }
			],
			view: [{ moduleId: 'first', component: view }],
			assets: [{ moduleId: 'second', component: assets }]
		});
	});
});
