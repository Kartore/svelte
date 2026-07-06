import { migrate, validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import type { StyleSpecification } from 'maplibre-gl';

export type StyleImportResult =
	{ ok: true; style: StyleSpecification; warnings: string[] } | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<PropertyKey, unknown> => {
	return typeof value === 'object' && value !== null;
};

export const isStyleSpecification = (value: unknown): value is StyleSpecification => {
	if (!isRecord(value)) return false;

	return (
		typeof value.version === 'number' && isRecord(value.sources) && Array.isArray(value.layers)
	);
};

/** JSON 文字列を StyleSpecification として解釈する。migrate + validate 込み */
export const parseStyleJSON = (text: string): StyleImportResult => {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch (error) {
		return {
			ok: false,
			error: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`
		};
	}

	if (!isStyleSpecification(parsed)) {
		return {
			ok: false,
			error: 'Invalid style: version, sources, and layers are required.'
		};
	}

	if (parsed.layers.length === 0) {
		return {
			ok: false,
			error: 'Invalid style: layers must contain at least one layer.'
		};
	}

	let style: StyleSpecification;
	try {
		style = migrate(structuredClone(parsed)) as StyleSpecification;
	} catch (error) {
		return {
			ok: false,
			error: `Failed to migrate style: ${error instanceof Error ? error.message : String(error)}`
		};
	}

	return {
		ok: true,
		style,
		warnings: validateStyleMin(style).map((error) => error.message)
	};
};
