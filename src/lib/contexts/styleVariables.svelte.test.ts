import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import type { MapStyleStore, SetMapStyleAction } from '$lib/stores/mapStyle';
import { getLayerBindings, VARIABLES_METADATA_KEY } from '$lib/utils/styleVariables.ts';

import { StyleVariablesContext } from './styleVariables.svelte.ts';

const initialStyle = (): StyleSpecification => ({
	version: 8,
	sources: {},
	layers: [
		{
			id: 'background',
			type: 'background',
			paint: { 'background-color': '#000000' }
		}
	]
});

const createStore = () => {
	let callCount = 0;
	const store = {
		mapStyle: initialStyle(),
		setMapStyle(action: SetMapStyleAction) {
			callCount += 1;
			this.mapStyle = typeof action === 'function' ? action(this.mapStyle) : action;
		}
	};
	return {
		store: store as unknown as MapStyleStore,
		get callCount() {
			return callCount;
		}
	};
};

const paintValue = (store: MapStyleStore, key: string): unknown =>
	(store.mapStyle.layers[0].paint as Record<string, unknown> | undefined)?.[key];

describe('StyleVariablesContext', () => {
	it('creates uniquely named variables with one store update each', () => {
		const harness = createStore();
		const context = new StyleVariablesContext(harness.store, () => true);

		const primary = context.create({ name: 'Primary', type: 'color', value: '#ff0000' });
		const duplicate = context.create({ name: 'Primary', type: 'number', value: 2 });

		expect(primary.id).not.toBe('');
		expect(duplicate.name).toBe('Primary 2');
		expect(context.variables).toEqual([primary, duplicate]);
		expect(harness.callCount).toBe(2);
		expect(harness.store.mapStyle.metadata).toEqual({
			[VARIABLES_METADATA_KEY]: {
				version: 1,
				variables: [primary, duplicate]
			}
		});
	});

	it('creates and binds a variable atomically with one store update', () => {
		const harness = createStore();
		const context = new StyleVariablesContext(harness.store, () => true);
		const target = { group: 'paint', key: 'background-color' } as const;

		const variable = context.createAndBind(
			{ name: 'Primary', type: 'color', value: '#ff0000' },
			'background',
			target
		);

		expect(harness.callCount).toBe(1);
		expect(context.variables).toEqual([variable]);
		expect(getLayerBindings(harness.store.mapStyle.layers[0])).toEqual({
			'paint:background-color': variable.id
		});
		expect(paintValue(harness.store, 'background-color')).toBe('#ff0000');
	});

	it('atomically binds and updates a variable with one store call per command', () => {
		const harness = createStore();
		const context = new StyleVariablesContext(harness.store, () => true);
		const variable = context.create({
			name: 'Primary',
			type: 'color',
			value: '#ff0000'
		});
		const target = { group: 'paint', key: 'background-color' } as const;

		context.bind('background', target, variable.id);
		expect(harness.callCount).toBe(2);
		expect(getLayerBindings(harness.store.mapStyle.layers[0])).toEqual({
			'paint:background-color': variable.id
		});
		expect(paintValue(harness.store, 'background-color')).toBe('#ff0000');

		context.updateValue(variable.id, '#00ff00');
		expect(harness.callCount).toBe(3);
		expect(context.variables[0].value).toBe('#00ff00');
		expect(paintValue(harness.store, 'background-color')).toBe('#00ff00');

		const staleStyle = structuredClone(harness.store.mapStyle);
		(staleStyle.layers[0].paint as Record<string, unknown>)['background-color'] = '#000000';
		harness.store.mapStyle = staleStyle;
		context.reapply();
		expect(harness.callCount).toBe(4);
		expect(paintValue(harness.store, 'background-color')).toBe('#00ff00');
	});

	it('makes every command a no-op while editing is disabled', () => {
		const harness = createStore();
		const context = new StyleVariablesContext(harness.store, () => false);
		const variable = context.create({
			name: 'Primary',
			type: 'color',
			value: '#ff0000'
		});
		const target = { group: 'paint', key: 'background-color' } as const;

		context.updateValue(variable.id, '#00ff00');
		context.rename(variable.id, 'Renamed');
		context.bind('background', target, variable.id);
		context.createAndBind({ name: 'Bound', type: 'color', value: '#ffffff' }, 'background', target);
		context.unbind('background', target);
		context.remove(variable.id);
		context.reapply();

		expect(context.isEditable).toBe(false);
		expect(context.variables).toEqual([]);
		expect(harness.callCount).toBe(0);
		expect(harness.store.mapStyle.layers[0].metadata).toBeUndefined();
		expect(paintValue(harness.store, 'background-color')).toBe('#000000');
	});
});
