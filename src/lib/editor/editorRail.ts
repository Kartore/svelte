import type { ModuleShellMode } from '#lib/components/shell/shellMode.ts';

import type { EditorModule, EditorModuleRailItem } from './EditorModule.ts';

export type RegisteredEditorRailItem = EditorModuleRailItem & {
	moduleId: string;
	mode: ModuleShellMode;
};

export const moduleRailMode = (moduleId: string, railItemId: string): ModuleShellMode =>
	`module:${moduleId}:${railItemId}`;

export const collectEditorRailItems = (modules: EditorModule[]): RegisteredEditorRailItem[] =>
	modules.flatMap((module) =>
		(module.railItems ?? []).map((item) => ({
			...item,
			moduleId: module.id,
			mode: moduleRailMode(module.id, item.id)
		}))
	);
