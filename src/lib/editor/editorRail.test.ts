import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';

import type { EditorModule } from './EditorModule.ts';
import { collectEditorRailItems, moduleRailMode } from './editorRail.ts';

const component = {} as Component;

describe('editor Rail registrations', () => {
	it('module id と項目 id を組み合わせて mode を名前空間化する', () => {
		expect(moduleRailMode('github', 'connection')).toBe('module:github:connection');
	});

	it('複数 adapter の同名項目を別の mode として収集する', () => {
		const modules: EditorModule[] = [
			{
				id: 'first',
				railItems: [
					{
						id: 'connection',
						label: 'First',
						icon: component,
						secondColumn: component
					}
				]
			},
			{
				id: 'second',
				railItems: [
					{
						id: 'connection',
						label: 'Second',
						icon: component,
						secondColumn: component,
						placement: 'bottom'
					}
				]
			}
		];

		expect(collectEditorRailItems(modules)).toEqual([
			expect.objectContaining({
				moduleId: 'first',
				id: 'connection',
				mode: 'module:first:connection'
			}),
			expect.objectContaining({
				moduleId: 'second',
				id: 'connection',
				mode: 'module:second:connection',
				placement: 'bottom'
			})
		]);
	});
});
