import { getContext, setContext } from 'svelte';

export class RowPopoverContext {
	activeId = $state<string | null>(null);

	open(id: string) {
		this.activeId = id;
	}

	close(id?: string) {
		if (id === undefined || this.activeId === id) this.activeId = null;
	}
}

const KEY = Symbol('row-popover');

export const provideRowPopover = (): RowPopoverContext => setContext(KEY, new RowPopoverContext());

export const useRowPopover = (): RowPopoverContext | undefined => getContext(KEY);
