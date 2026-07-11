import { getContext, setContext } from 'svelte';

export type ExpressionFlyoutTarget = {
	/** property group the expression belongs to — 'filter' targets the layer-level filter */
	group: 'paint' | 'layout' | 'filter';
	/** style-spec property key (e.g. 'fill-color'), or 'filter' for the filter group */
	key: string;
	/** human-readable label shown in the flyout header */
	label: string;
};

/**
 * プロパティ行にアンカーされた expression 編集パネルの開閉状態。
 * 値の解決は表示側 (+page) が行う。
 */
export class ExpressionFlyoutContext {
	target = $state<ExpressionFlyoutTarget | null>(null);
	anchor = $state<HTMLElement | null>(null);

	open(target: ExpressionFlyoutTarget, anchorElement: HTMLElement) {
		this.anchor = anchorElement;
		this.target = target;
	}

	close() {
		this.target = null;
		this.anchor = null;
	}

	reanchor(group: string, key: string, anchorElement: HTMLElement) {
		if (this.isOpen(group, key)) this.anchor = anchorElement;
	}

	isOpen(group: string, key: string): boolean {
		return this.target?.group === group && this.target?.key === key;
	}
}

const KEY = Symbol('expression-flyout');

export const provideExpressionFlyout = (): ExpressionFlyoutContext =>
	setContext(KEY, new ExpressionFlyoutContext());

export const useExpressionFlyout = (): ExpressionFlyoutContext | undefined => getContext(KEY);
