import type { StyleSpecification } from 'maplibre-gl';

import type { RootPropertyKind } from '$lib/utils/layerSpec.ts';

const getStyleRootObject = (
	style: StyleSpecification,
	kind: RootPropertyKind
): Record<string, unknown> | undefined => {
	return style[kind] as Record<string, unknown> | undefined;
};

export const setStyleRootObject = (
	style: StyleSpecification,
	kind: RootPropertyKind,
	value: object | undefined
): StyleSpecification => {
	if (value !== undefined) {
		return { ...style, [kind]: value } as StyleSpecification;
	}

	const nextStyle = { ...style };
	Reflect.deleteProperty(nextStyle, kind);
	return nextStyle;
};

export const replaceStyleRootData = (
	style: StyleSpecification,
	kind: RootPropertyKind,
	key: string,
	value: unknown
): StyleSpecification => {
	if (value !== undefined) {
		if (kind === 'terrain' && style.terrain === undefined && key !== 'source') {
			return style;
		}

		return {
			...style,
			[kind]: {
				...getStyleRootObject(style, kind),
				[key]: value
			}
		} as StyleSpecification;
	}

	if (kind === 'terrain' && key === 'source') {
		return setStyleRootObject(style, kind, undefined);
	}

	const nextRootObject = { ...getStyleRootObject(style, kind) };
	Reflect.deleteProperty(nextRootObject, key);

	if (Object.keys(nextRootObject).length === 0 && kind !== 'sky') {
		return setStyleRootObject(style, kind, undefined);
	}

	return setStyleRootObject(style, kind, nextRootObject);
};
