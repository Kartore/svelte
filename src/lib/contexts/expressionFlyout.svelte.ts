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
 * PropertiesPanel の横に飛び出す expression 編集パネルの開閉状態。
 * どのプロパティを編集中かだけを持ち、値の解決は表示側 (+page) が行う。
 */
export class ExpressionFlyoutContext {
	target = $state<ExpressionFlyoutTarget | null>(null);

	open(target: ExpressionFlyoutTarget) {
		this.target = target;
	}

	close() {
		this.target = null;
	}

	isOpen(group: string, key: string): boolean {
		return this.target?.group === group && this.target?.key === key;
	}
}

const KEY = Symbol('expression-flyout');

export const provideExpressionFlyout = (): ExpressionFlyoutContext =>
	setContext(KEY, new ExpressionFlyoutContext());

export const useExpressionFlyout = (): ExpressionFlyoutContext | undefined => getContext(KEY);
