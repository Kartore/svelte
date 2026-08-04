import { getContext, setContext } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';

export type RegisteredEditorCommand = {
	id: string;
	group: string;
	groupLabel: string;
	getLabel: () => string;
	getDisabled: () => boolean;
	shortcut?: string;
	run: () => void;
};

export type EditorActionCommand = {
	id: string;
	group: string;
	groupLabel: string;
	label: string;
	disabled: boolean;
	shortcut?: string;
	run: () => void;
};

export class EditorCommandsContext {
	private readonly registrations = new SvelteMap<string, RegisteredEditorCommand>();

	register(command: RegisteredEditorCommand): () => void {
		this.registrations.set(command.id, command);
		return () => {
			if (this.registrations.get(command.id) === command) this.registrations.delete(command.id);
		};
	}

	get commands(): EditorActionCommand[] {
		return [...this.registrations.values()].map((command) => ({
			id: command.id,
			group: command.group,
			groupLabel: command.groupLabel,
			label: command.getLabel(),
			disabled: command.getDisabled(),
			shortcut: command.shortcut,
			run: command.run
		}));
	}
}

export type HeaderCommandGroup = {
	registry: EditorCommandsContext;
	value: string;
	label: string;
};

const EDITOR_COMMANDS_KEY = Symbol('editor-commands');
const HEADER_COMMAND_GROUP_KEY = Symbol('header-command-group');

export const provideEditorCommands = (): EditorCommandsContext =>
	setContext(EDITOR_COMMANDS_KEY, new EditorCommandsContext());

export const useEditorCommands = (): EditorCommandsContext | undefined =>
	getContext(EDITOR_COMMANDS_KEY);

export const provideHeaderCommandGroup = (
	value: string,
	label: string
): HeaderCommandGroup | undefined => {
	const registry = useEditorCommands();
	if (!registry) return undefined;
	return setContext(HEADER_COMMAND_GROUP_KEY, { registry, value, label });
};

export const useHeaderCommandGroup = (): HeaderCommandGroup | undefined =>
	getContext(HEADER_COMMAND_GROUP_KEY);
