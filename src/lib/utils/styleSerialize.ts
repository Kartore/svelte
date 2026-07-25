import { latest } from '@maplibre/maplibre-gl-style-spec';
import type {
	LayerSpecification,
	SourceSpecification,
	StyleSpecification
} from '@maplibre/maplibre-gl-style-spec';

type JsonObject = Record<string, unknown>;

type SerializeContext =
	| { kind: 'generic' }
	| { kind: 'layer'; layerType: string | undefined }
	| { kind: 'layers' }
	| { kind: 'metadata' }
	| { kind: 'paint' | 'layout'; layerType: string | undefined }
	| { kind: 'root' }
	| { kind: 'source'; sourceType: string | undefined }
	| { kind: 'sources' }
	| { kind: 'spec'; name: string };

const reference = latest as unknown as Record<string, unknown>;
const FORBIDDEN_JSON_VALUE_TYPES = new Set(['function', 'symbol', 'undefined']);
const compareKeys = (left: string, right: string): number =>
	left < right ? -1 : left > right ? 1 : 0;

const isObject = (value: unknown): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isSerializableObjectValue = (value: unknown): boolean =>
	!FORBIDDEN_JSON_VALUE_TYPES.has(typeof value);

const specKeys = (name: string): string[] => {
	const section = reference[name];
	return isObject(section) ? Object.keys(section).filter((key) => key !== '*') : [];
};

const orderedKeys = (value: JsonObject, context: SerializeContext): string[] => {
	const presentKeys = Object.keys(value).filter((key) => isSerializableObjectValue(value[key]));
	let preferred: string[];

	switch (context.kind) {
		case 'root':
			preferred = specKeys('$root');
			break;
		case 'layer':
			preferred = specKeys('layer');
			break;
		case 'paint':
		case 'layout':
			preferred = context.layerType
				? specKeys(`${context.kind}_${context.layerType}`)
				: specKeys(context.kind);
			break;
		case 'source':
			preferred = context.sourceType
				? specKeys(`source_${context.sourceType.replaceAll('-', '_')}`)
				: [];
			break;
		case 'spec':
			preferred = specKeys(context.name);
			break;
		case 'generic':
		case 'layers':
		case 'metadata':
		case 'sources':
			preferred = [];
			break;
	}

	const present = new Set(presentKeys);
	const known = preferred.filter((key) => present.delete(key));
	return [...known, ...[...present].sort(compareKeys)];
};

const objectChildContext = (
	parent: SerializeContext,
	key: string,
	value: unknown
): SerializeContext => {
	if (parent.kind === 'metadata') return { kind: 'metadata' };

	if (parent.kind === 'root') {
		if (key === 'metadata') return { kind: 'metadata' };
		if (key === 'sources') return { kind: 'sources' };
		if (key === 'layers') return { kind: 'layers' };
		if (['light', 'sky', 'terrain', 'projection', 'transition'].includes(key)) {
			return { kind: 'spec', name: key };
		}
	}

	if (parent.kind === 'layer') {
		if (key === 'metadata') return { kind: 'metadata' };
		if (key === 'paint' || key === 'layout') {
			return { kind: key, layerType: parent.layerType };
		}
	}

	if (parent.kind === 'sources') {
		return {
			kind: 'source',
			sourceType: isObject(value) && typeof value.type === 'string' ? value.type : undefined
		};
	}

	if (parent.kind === 'paint' || parent.kind === 'layout' || parent.kind === 'spec') {
		return { kind: 'spec', name: 'function' };
	}

	return { kind: 'generic' };
};

const arrayChildContext = (parent: SerializeContext): SerializeContext => {
	if (parent.kind === 'layers') return parent;
	if (parent.kind === 'metadata') return parent;
	return { kind: 'generic' };
};

const primitiveJson = (value: unknown): string => {
	const serialized = JSON.stringify(value);
	if (serialized === undefined) return 'null';
	return serialized;
};

const canInlineArray = (value: unknown[]): boolean => {
	if (value.some((item) => typeof item === 'object' && item !== null)) return false;
	return `[${value.map(primitiveJson).join(', ')}]`.length <= 72;
};

const serializeArray = (value: unknown[], context: SerializeContext, depth: number): string => {
	if (canInlineArray(value)) return `[${value.map(primitiveJson).join(', ')}]`;
	if (value.length === 0) return '[]';

	const indentation = '\t'.repeat(depth + 1);
	const closingIndentation = '\t'.repeat(depth);
	const childContext = arrayChildContext(context);
	const items = value.map(
		(item) => `${indentation}${serializeValue(item, childContext, depth + 1)}`
	);
	return `[\n${items.join(',\n')}\n${closingIndentation}]`;
};

const serializeObject = (value: JsonObject, context: SerializeContext, depth: number): string => {
	const keys = orderedKeys(value, context);
	if (keys.length === 0) return '{}';

	const indentation = '\t'.repeat(depth + 1);
	const closingIndentation = '\t'.repeat(depth);
	const properties = keys.map((key) => {
		const child = value[key];
		const childContext = objectChildContext(context, key, child);
		return `${indentation}${JSON.stringify(key)}: ${serializeValue(child, childContext, depth + 1)}`;
	});
	return `{\n${properties.join(',\n')}\n${closingIndentation}}`;
};

const serializeValue = (value: unknown, context: SerializeContext, depth: number): string => {
	if (Array.isArray(value)) {
		const arrayContext =
			context.kind === 'layers'
				? context
				: context.kind === 'generic' || context.kind === 'metadata'
					? context
					: { kind: 'generic' as const };
		return serializeArray(value, arrayContext, depth);
	}
	if (isObject(value)) {
		const objectContext =
			context.kind === 'layers'
				? {
						kind: 'layer' as const,
						layerType: typeof value.type === 'string' ? value.type : undefined
					}
				: context;
		if (objectContext.kind === 'layer' && objectContext.layerType === undefined) {
			objectContext.layerType = typeof value.type === 'string' ? value.type : undefined;
		}
		return serializeObject(value, objectContext, depth);
	}
	return primitiveJson(value);
};

const withTrailingNewline = (value: unknown, context: SerializeContext): string =>
	`${serializeValue(value, context, 0)}\n`;

/** StyleSpecification 全体を style-spec 定義順で決定的にシリアライズする。 */
export const serializeStyle = (style: StyleSpecification): string =>
	withTrailingNewline(style, { kind: 'root' });

/** 分割形式の style.json (sources / layers を除いたルート) をシリアライズする。 */
export const serializeStyleRoot = (styleRoot: Record<string, unknown>): string =>
	withTrailingNewline(styleRoot, { kind: 'root' });

/** 分割形式の sources.json をシリアライズする。 */
export const serializeStyleSources = (sources: Record<string, SourceSpecification>): string =>
	withTrailingNewline(sources, { kind: 'sources' });

/** 分割形式のレイヤーファイルをシリアライズする。 */
export const serializeStyleLayer = (layer: LayerSpecification): string =>
	withTrailingNewline(layer, {
		kind: 'layer',
		layerType: layer.type
	});

/** layers.json など、style-spec 外の JSON 値を決定的にシリアライズする。 */
export const serializeStyleAuxiliary = (value: unknown): string =>
	withTrailingNewline(value, { kind: 'generic' });
