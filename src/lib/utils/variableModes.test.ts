import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { describe, expect, it } from 'vitest';

import {
	getStyleVariables,
	isLegacyVariableName,
	replaceStyleVariables,
	suggestModernVariableName,
	VARIABLES_METADATA_KEY
} from './styleVariables.ts';
import {
	activateStyleVariableMode,
	duplicateStyleVariableMode,
	getStyleVariableModes
} from './variableModes.ts';

const style = (): StyleSpecification => ({
	version: 8,
	metadata: {
		[VARIABLES_METADATA_KEY]: {
			version: 1,
			variables: [
				{ id: 'brand', name: 'road/primary', type: 'color', value: '#112233' },
				{ id: 'width', name: 'road/width', type: 'number', value: 2 }
			]
		}
	},
	sources: {},
	layers: [{ id: 'background', type: 'background' }]
});

describe('style variable naming and modes', () => {
	it('keeps legacy names readable while proposing slash-compatible names', () => {
		expect(isLegacyVariableName('$road.primary')).toBe(true);
		expect(suggestModernVariableName('$road.primary')).toBe('road/primary');
		expect(suggestModernVariableName('road/primary')).toBe('road/primary');
	});

	it('duplicates current values and restores each mode value set', () => {
		const duplicated = duplicateStyleVariableMode(style(), 'ダーク', 'dark');
		const darkVariables = getStyleVariables(duplicated.style).map((variable) =>
			variable.id === 'brand' && variable.type === 'color'
				? { ...variable, value: '#ddeeff' }
				: variable
		);
		const darkEdited = replaceStyleVariables(duplicated.style, darkVariables);
		const dark = activateStyleVariableMode(darkEdited, 'dark');
		const light = activateStyleVariableMode(dark, 'light');
		const restoredDark = activateStyleVariableMode(light, 'dark');

		expect(getStyleVariableModes(restoredDark).activeModeId).toBe('dark');
		expect(getStyleVariables(light).find(({ id }) => id === 'brand')?.value).toBe('#ddeeff');
		expect(getStyleVariables(restoredDark).find(({ id }) => id === 'brand')?.value).toBe('#112233');
	});
});
