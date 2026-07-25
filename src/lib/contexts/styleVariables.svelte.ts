import { getContext, setContext } from 'svelte';

import type { MapStyleStore } from '$lib/stores/mapStyle';
import {
	applyVariableBindings,
	bindProperty,
	countVariableUsages,
	deleteVariable,
	getBindingStatus as readBindingStatus,
	getStyleVariables,
	type PropertyBindingTarget,
	type StyleVariable,
	type StyleVariableType,
	unbindProperty,
	upsertVariable
} from '$lib/utils/styleVariables.ts';

const uniqueName = (
	requestedName: string,
	variables: StyleVariable[],
	excludeId?: string
): string => {
	const baseName = requestedName.trim() || 'Variable';
	const names = new Set(
		variables.filter((variable) => variable.id !== excludeId).map((variable) => variable.name)
	);
	if (!names.has(baseName)) return baseName;

	let suffix = 2;
	while (names.has(`${baseName} ${suffix}`)) suffix += 1;
	return `${baseName} ${suffix}`;
};

const variableWithValue = (
	variable: StyleVariable,
	value: StyleVariable['value']
): StyleVariable | undefined => {
	if (variable.type === 'color' && typeof value === 'string') {
		return { ...variable, value };
	}
	if (variable.type === 'number' && typeof value === 'number') {
		return { ...variable, value };
	}
	if (variable.type === 'interpolation' && Array.isArray(value)) {
		return {
			...variable,
			value: value as Extract<StyleVariable, { type: 'interpolation' }>['value']
		};
	}
	return undefined;
};

type CreateVariableInput = {
	name: string;
	type: StyleVariableType;
	value: StyleVariable['value'];
};

const buildVariable = (input: CreateVariableInput, variables: StyleVariable[]): StyleVariable => {
	const common = {
		id: crypto.randomUUID(),
		name: uniqueName(input.name, variables)
	};
	return input.type === 'color'
		? { ...common, type: input.type, value: input.value as string }
		: input.type === 'number'
			? { ...common, type: input.type, value: input.value as number }
			: {
					...common,
					type: input.type,
					value: input.value as Extract<StyleVariable, { type: 'interpolation' }>['value']
				};
};

export class StyleVariablesContext {
	#store: MapStyleStore;
	#isEditable: () => boolean;

	constructor(store: MapStyleStore, isEditable: () => boolean) {
		this.#store = store;
		this.#isEditable = isEditable;
	}

	get variables(): StyleVariable[] {
		return getStyleVariables(this.#store.mapStyle);
	}

	get isEditable(): boolean {
		return this.#isEditable();
	}

	getBindingStatus(layerId: string, target: PropertyBindingTarget) {
		const layer = this.#store.mapStyle.layers.find((current) => current.id === layerId);
		if (!layer) return undefined;
		return readBindingStatus(layer, target, this.variables);
	}

	countUsages(variableId: string): number {
		return countVariableUsages(this.#store.mapStyle, variableId);
	}

	create(input: CreateVariableInput): StyleVariable {
		const variable = buildVariable(input, this.variables);
		if (this.#isEditable()) {
			this.#store.setMapStyle((style) => upsertVariable(style, variable));
		}
		return variable;
	}

	createAndBind(
		input: CreateVariableInput,
		layerId: string,
		target: PropertyBindingTarget
	): StyleVariable {
		const variable = buildVariable(input, this.variables);
		if (this.#isEditable()) {
			this.#store.setMapStyle((style) =>
				bindProperty(upsertVariable(style, variable), layerId, target, variable.id)
			);
		}
		return variable;
	}

	updateValue(id: string, value: StyleVariable['value']): void {
		if (!this.#isEditable()) return;
		const variable = this.variables.find((current) => current.id === id);
		if (!variable) return;
		const nextVariable = variableWithValue(variable, value);
		if (!nextVariable) return;
		this.#store.setMapStyle((style) => upsertVariable(style, nextVariable));
	}

	rename(id: string, name: string): void {
		if (!this.#isEditable()) return;
		const variable = this.variables.find((current) => current.id === id);
		if (!variable) return;
		const nextName = uniqueName(name, this.variables, id);
		if (nextName === variable.name) return;
		this.#store.setMapStyle((style) => upsertVariable(style, { ...variable, name: nextName }));
	}

	remove(id: string): void {
		if (!this.#isEditable()) return;
		this.#store.setMapStyle((style) => deleteVariable(style, id));
	}

	bind(layerId: string, target: PropertyBindingTarget, variableId: string): void {
		if (!this.#isEditable()) return;
		this.#store.setMapStyle((style) => bindProperty(style, layerId, target, variableId));
	}

	unbind(layerId: string, target: PropertyBindingTarget): void {
		if (!this.#isEditable()) return;
		this.#store.setMapStyle((style) => unbindProperty(style, layerId, target));
	}

	reapply(): void {
		if (!this.#isEditable()) return;
		this.#store.setMapStyle((style) => applyVariableBindings(style));
	}
}

const KEY = Symbol('style-variables');

export const provideStyleVariables = (
	store: MapStyleStore,
	isEditable: () => boolean
): StyleVariablesContext => setContext(KEY, new StyleVariablesContext(store, isEditable));

export const useStyleVariables = (): StyleVariablesContext | undefined => getContext(KEY);
