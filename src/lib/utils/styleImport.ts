import { convertFilter, migrate, validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import type { FilterSpecification } from '@maplibre/maplibre-gl-style-spec';
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

	let warnings = validateStyleMin(style).map((error) => error.message);

	// 旧式フィルタと expression の混在は validator に弾かれるが機械的に等価変換できるため、
	// 該当レイヤーのフィルタを正規化してから再検証する
	const mixedFilterLayerIndexes = [
		...new Set(
			warnings
				.filter((message) => message.includes(MIXED_FILTER_ERROR))
				.map((message) => Number(/^layers\[(\d+)\]/.exec(message)?.[1]))
				.filter((index) => Number.isInteger(index))
		)
	];
	if (mixedFilterLayerIndexes.length > 0) {
		for (const index of mixedFilterLayerIndexes) {
			const layer = style.layers[index] as { filter?: unknown };
			layer.filter = convertMixedFilter(layer.filter);
		}
		warnings = validateStyleMin(style).map((error) => error.message);
	}

	return { ok: true, style, warnings };
};

const MIXED_FILTER_ERROR = 'Mixing deprecated filter syntax with expression syntax';

/**
 * "all" などの子に旧式フィルタと expression が混在すると、style-spec は全体を
 * expression と判定して旧式の子を弾き、公式 convertFilter も素通しする。
 * 子単位なら convertFilter が正しく判定・変換できるため、結合演算子を分解して変換する
 */
const convertMixedFilter = (filter: unknown): unknown => {
	if (!Array.isArray(filter) || filter.length === 0) return filter;
	const [op, ...children] = filter as [string, ...unknown[]];
	if (op === 'all' || op === 'any') {
		return [op, ...children.map(convertMixedFilterChild)];
	}
	if (op === 'none') {
		// none は expression 構文に存在しないため !any に変換する
		return ['!', ['any', ...children.map(convertMixedFilterChild)]];
	}
	return filter;
};

const convertMixedFilterChild = (child: unknown): unknown => {
	if (typeof child === 'boolean') return child;
	if (Array.isArray(child) && (child[0] === 'all' || child[0] === 'any' || child[0] === 'none')) {
		return convertMixedFilter(child);
	}
	// convertFilter は expression と判定した入力を素通しし、旧式のみ変換する
	return convertFilter(child as FilterSpecification);
};
