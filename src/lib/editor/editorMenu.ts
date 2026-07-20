import type { Component } from 'svelte';

import type { EditorMenuId, EditorModule } from './EditorModule.ts';

export type ResolvedEditorMenuSection = {
	moduleId: string;
	component: Component;
};

export const resolveEditorMenuSection = (
	module: EditorModule,
	menuId: EditorMenuId
): Component | undefined => module.menuSections?.[menuId];

export const collectEditorMenuSections = (
	modules: EditorModule[]
): Record<EditorMenuId, ResolvedEditorMenuSection[]> => {
	const sections: Record<EditorMenuId, ResolvedEditorMenuSection[]> = {
		file: [],
		edit: [],
		view: [],
		assets: []
	};

	for (const module of modules) {
		for (const menuId of Object.keys(sections) as EditorMenuId[]) {
			const component = resolveEditorMenuSection(module, menuId);
			if (component) sections[menuId].push({ moduleId: module.id, component });
		}
	}

	return sections;
};
