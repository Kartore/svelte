export type BuiltinShellMode =
	'layers' | 'palette' | 'sources' | 'sprites' | 'fonts' | 'history' | 'settings';

export type ModuleShellMode = `module:${string}:${string}`;

export type ShellMode = BuiltinShellMode | ModuleShellMode;
