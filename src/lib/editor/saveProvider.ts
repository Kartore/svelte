import type { SaveProvider } from './EditorModule.ts';

export const dispatchSave = (
	providers: readonly SaveProvider[],
	fallback: () => void | Promise<void>
): void | Promise<void> => {
	const provider = providers.find((candidate) => candidate.available);
	return provider ? provider.save() : fallback();
};
