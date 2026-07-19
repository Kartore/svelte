import type {
	Completion,
	CompletionContext,
	CompletionResult,
	CompletionSource
} from '@codemirror/autocomplete';
import { jsonLanguage } from '@codemirror/lang-json';
import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import type { HoverTooltipSource } from '@codemirror/view';
import styleSpecReferenceJson from '@maplibre/maplibre-gl-style-spec/dist/latest.json';

export type StyleJsonDiagnostic = {
	from: number;
	to: number;
	severity: 'error' | 'warning';
	message: string;
	source?: string;
};

export type StyleJsonHover = {
	from: number;
	to: number;
	title: string;
	detail?: string;
	documentation?: string;
};

type JsonNode = {
	readonly name: string;
	readonly from: number;
	readonly to: number;
	readonly parent: JsonNode | null;
	readonly firstChild: JsonNode | null;
	readonly nextSibling: JsonNode | null;
	getChild(name: string): JsonNode | null;
	resolveInner(position: number, side?: -1 | 0 | 1): JsonNode;
};

type ReferenceDefinition = Record<string, unknown>;
type ReferenceSection = Record<string, ReferenceDefinition>;
type ReferenceDocument = Record<string, unknown>;
type DefinitionContext = {
	name: string;
	definitions: ReferenceSection;
};

const styleSpecReference = styleSpecReferenceJson as unknown as ReferenceDocument;
const jsonValueNodeNames = new Set([
	'Object',
	'Array',
	'String',
	'Number',
	'True',
	'False',
	'Null'
]);

const sameNode = (left: JsonNode | null, right: JsonNode | null): boolean =>
	left !== null &&
	right !== null &&
	left.name === right.name &&
	left.from === right.from &&
	left.to === right.to;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const asSection = (value: unknown): ReferenceSection | null => {
	if (!isRecord(value)) return null;
	const entries = Object.entries(value).filter((entry): entry is [string, ReferenceDefinition] =>
		isRecord(entry[1])
	);
	return Object.fromEntries(entries);
};

const namedSection = (name: string): DefinitionContext | null => {
	const definitions = asSection(styleSpecReference[name]);
	return definitions ? { name, definitions } : null;
};

const parseRoot = (text: string): JsonNode =>
	jsonLanguage.parser.parse(text).topNode as unknown as JsonNode;

const stateRoot = (state: EditorState, position: number): JsonNode => {
	const tree = ensureSyntaxTree(state, position, 25) ?? syntaxTree(state);
	return tree.topNode as unknown as JsonNode;
};

const documentObject = (root: JsonNode): JsonNode | null =>
	root.name === 'Object' ? root : root.getChild('Object');

const decodeJsonString = (value: string): string | null => {
	try {
		const decoded: unknown = JSON.parse(value);
		return typeof decoded === 'string' ? decoded : null;
	} catch {
		return null;
	}
};

const propertyNodes = (object: JsonNode): JsonNode[] => {
	const properties: JsonNode[] = [];
	for (let child = object.firstChild; child; child = child.nextSibling) {
		if (child.name === 'Property') properties.push(child);
	}
	return properties;
};

const propertyNameNode = (property: JsonNode): JsonNode | null => property.getChild('PropertyName');

const propertyName = (property: JsonNode, text: string): string | null => {
	const node = propertyNameNode(property);
	return node ? decodeJsonString(text.slice(node.from, node.to)) : null;
};

const propertyValue = (property: JsonNode): JsonNode | null => {
	for (let child = property.firstChild; child; child = child.nextSibling) {
		if (jsonValueNodeNames.has(child.name)) return child;
	}
	return null;
};

const objectProperty = (object: JsonNode, name: string, text: string): JsonNode | null =>
	propertyNodes(object).find((property) => propertyName(property, text) === name) ?? null;

const stringPropertyValue = (object: JsonNode, name: string, text: string): string | null => {
	const property = objectProperty(object, name, text);
	const value = property ? propertyValue(property) : null;
	return value?.name === 'String' ? decodeJsonString(text.slice(value.from, value.to)) : null;
};

const ownerProperty = (value: JsonNode): JsonNode | null =>
	value.parent?.name === 'Property' && sameNode(propertyValue(value.parent), value)
		? value.parent
		: null;

const isRootPropertyValue = (
	value: JsonNode,
	name: string,
	rootObject: JsonNode,
	text: string
): boolean => {
	const property = ownerProperty(value);
	if (!property || !sameNode(property.parent, rootObject)) return false;
	return propertyName(property, text) === name;
};

const isLayerObject = (object: JsonNode, rootObject: JsonNode, text: string): boolean => {
	const array = object.parent;
	if (array?.name !== 'Array') return false;
	const property = ownerProperty(array);
	if (!property || !sameNode(property.parent, rootObject)) return false;
	return propertyName(property, text) === 'layers';
};

const sourceSectionNames = Array.isArray(styleSpecReference.source)
	? styleSpecReference.source.filter((value): value is string => typeof value === 'string')
	: [];

const sourceTypeFromSection = (sectionName: string, section: ReferenceSection): string | null => {
	const values = section.type?.values;
	if (isRecord(values)) {
		const first = Object.keys(values)[0];
		if (first) return first;
	}
	return sectionName.replace(/^source_/, '').replaceAll('_', '-');
};

const sourceUnionDefinitions = (() => {
	const definitions: ReferenceSection = {};
	const sourceTypes: Record<string, unknown> = {};
	let typeDefinition: ReferenceDefinition | undefined;

	for (const sectionName of sourceSectionNames) {
		const section = asSection(styleSpecReference[sectionName]);
		if (!section) continue;
		for (const [name, definition] of Object.entries(section)) {
			definitions[name] ??= definition;
		}
		const type = sourceTypeFromSection(sectionName, section);
		if (type) sourceTypes[type] = isRecord(section.type?.values) ? section.type.values[type] : {};
		typeDefinition ??= section.type;
	}

	if (typeDefinition) {
		definitions.type = {
			...typeDefinition,
			values: sourceTypes,
			doc: 'The source type. Available properties depend on this value.'
		};
	}
	return definitions;
})();

const sourceContext = (object: JsonNode, text: string): DefinitionContext => {
	const sourceType = stringPropertyValue(object, 'type', text);
	if (sourceType) {
		const sectionName = `source_${sourceType.replaceAll('-', '_')}`;
		const section = namedSection(sectionName);
		if (section) return section;
	}
	return { name: 'source', definitions: sourceUnionDefinitions };
};

const definitionContext = (
	object: JsonNode,
	rootObject: JsonNode,
	text: string
): DefinitionContext | null => {
	if (sameNode(object, rootObject)) return namedSection('$root');
	if (isLayerObject(object, rootObject, text)) return namedSection('layer');

	const property = ownerProperty(object);
	const owner = property?.parent;
	const name = property ? propertyName(property, text) : null;
	if (!property || owner?.name !== 'Object' || !name) return null;

	if (isLayerObject(owner, rootObject, text) && (name === 'paint' || name === 'layout')) {
		const layerType = stringPropertyValue(owner, 'type', text);
		return layerType ? namedSection(`${name}_${layerType}`) : null;
	}

	if (isRootPropertyValue(owner, 'sources', rootObject, text)) {
		return sourceContext(object, text);
	}

	if (name.endsWith('-transition')) {
		const ownerContext = definitionContext(owner, rootObject, text);
		if (ownerContext?.name.startsWith('paint_') || ownerContext?.name.startsWith('layout_')) {
			return namedSection('transition');
		}
	}

	if (sameNode(owner ?? null, rootObject)) {
		const rootDefinition = namedSection('$root')?.definitions[name];
		const type = rootDefinition?.type;
		return typeof type === 'string' ? namedSection(type) : null;
	}

	return null;
};

const expandedDefinitions = (context: DefinitionContext): ReferenceSection => {
	if (!context.name.startsWith('paint_') && !context.name.startsWith('layout_')) {
		return context.definitions;
	}

	const definitions = { ...context.definitions };
	for (const [name, definition] of Object.entries(context.definitions)) {
		if (definition.transition !== true) continue;
		definitions[`${name}-transition`] = {
			type: 'transition',
			doc: `Transition timing for \`${name}\`.`
		};
	}
	return definitions;
};

const formatJsonValue = (value: unknown): string => {
	const formatted = JSON.stringify(value);
	if (formatted === undefined) return String(value);
	return formatted.length > 60 ? `${formatted.slice(0, 57)}…` : formatted;
};

const enumValues = (definition: ReferenceDefinition): string[] => {
	const values = definition.values;
	if (Array.isArray(values)) return values.map(String);
	return isRecord(values) ? Object.keys(values) : [];
};

const definitionDetail = (definition: ReferenceDefinition): string | undefined => {
	const details: string[] = [];
	if (typeof definition.type === 'string') details.push(definition.type);
	if (definition.required === true) details.push('required');
	if ('default' in definition) details.push(`default ${formatJsonValue(definition.default)}`);

	const minimum = typeof definition.minimum === 'number' ? definition.minimum : undefined;
	const maximum = typeof definition.maximum === 'number' ? definition.maximum : undefined;
	if (minimum !== undefined && maximum !== undefined) details.push(`${minimum}–${maximum}`);
	else if (minimum !== undefined) details.push(`≥ ${minimum}`);
	else if (maximum !== undefined) details.push(`≤ ${maximum}`);

	const values = enumValues(definition);
	if (values.length > 0) details.push(values.join(' | '));
	if (typeof definition.units === 'string') details.push(definition.units);
	return details.length > 0 ? details.join(' · ') : undefined;
};

const plainDocumentation = (definition: ReferenceDefinition): string | undefined => {
	if (typeof definition.doc !== 'string' || definition.doc.trim() === '') return undefined;
	const plain = definition.doc
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replaceAll('`', '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
	return plain.length > 1_200 ? `${plain.slice(0, 1_197)}…` : plain;
};

const completionInfo = (definition: ReferenceDefinition): string | undefined => {
	const documentation = plainDocumentation(definition);
	const detail = definitionDetail(definition);
	return [documentation, detail].filter(Boolean).join('\n\n') || undefined;
};

const ancestor = (node: JsonNode | null, name: string): JsonNode | null => {
	for (let current = node; current; current = current.parent) {
		if (current.name === name) return current;
	}
	return null;
};

type CompletionTarget = {
	object: JsonNode;
	from: number;
	to: number;
	currentName: string | null;
	apply: (name: string) => string;
};

const completionTarget = (
	root: JsonNode,
	text: string,
	position: number,
	explicit: boolean
): CompletionTarget | null => {
	const node = root.resolveInner(position, -1);
	const nameNode = ancestor(node, 'PropertyName');
	if (nameNode?.parent?.name === 'Property' && nameNode.parent.parent?.name === 'Object') {
		if (position <= nameNode.from || position > nameNode.to) return null;
		const currentName = decodeJsonString(text.slice(nameNode.from, nameNode.to));
		return {
			object: nameNode.parent.parent,
			from: nameNode.from + 1,
			to: Math.max(nameNode.from + 1, nameNode.to - 1),
			currentName,
			apply: (name) => name
		};
	}

	const object = ancestor(node, 'Object');
	if (!object) return null;
	const containingProperty = ancestor(node, 'Property');
	if (sameNode(containingProperty?.parent ?? null, object)) return null;

	let directNode = node;
	while (directNode.parent && !sameNode(directNode.parent, object)) directNode = directNode.parent;
	if (
		directNode.name === '⚠' &&
		sameNode(directNode.parent, object) &&
		directNode.to > directNode.from
	) {
		const raw = text.slice(directNode.from, directNode.to);
		if (/^"[^"\\]*$/.test(raw)) {
			return {
				object,
				from: directNode.from + 1,
				to: directNode.to,
				currentName: null,
				apply: (name) => `${name}": `
			};
		}
		if (/^[\w-]+$/.test(raw)) {
			return {
				object,
				from: directNode.from,
				to: directNode.to,
				currentName: null,
				apply: (name) => `${JSON.stringify(name)}: `
			};
		}
		return null;
	}

	if (!explicit) return null;
	return {
		object,
		from: position,
		to: position,
		currentName: null,
		apply: (name) => `${JSON.stringify(name)}: `
	};
};

export const getStyleJsonCompletions = (
	state: EditorState,
	position: number,
	explicit: boolean
): CompletionResult | null => {
	const text = state.doc.toString();
	const root = stateRoot(state, position);
	const rootObject = documentObject(root);
	if (!rootObject) return null;
	const target = completionTarget(root, text, position, explicit);
	if (!target) return null;
	const context = definitionContext(target.object, rootObject, text);
	if (!context) return null;

	const definitions = expandedDefinitions(context);
	const existing = new Set(
		propertyNodes(target.object)
			.map((property) => propertyName(property, text))
			.filter((name): name is string => name !== null && name !== target.currentName)
	);
	const options: Completion[] = Object.entries(definitions)
		.filter(([name]) => name !== '*' && !existing.has(name))
		.map(([name, definition]) => ({
			label: name,
			type: 'property',
			detail: definitionDetail(definition),
			info: completionInfo(definition),
			apply: target.apply(name),
			boost: definition.required === true ? 10 : undefined
		}));
	if (options.length === 0) return null;

	return { from: target.from, to: target.to, options };
};

export const styleJsonCompletionSource: CompletionSource = (context: CompletionContext) =>
	getStyleJsonCompletions(context.state, context.pos, context.explicit);

export const getStyleJsonHover = (state: EditorState, position: number): StyleJsonHover | null => {
	const text = state.doc.toString();
	const root = stateRoot(state, position);
	const rootObject = documentObject(root);
	if (!rootObject) return null;
	const node = root.resolveInner(position, 0);
	const nameNode = ancestor(node, 'PropertyName');
	const property = nameNode?.parent;
	const object = property?.parent;
	if (!nameNode || property?.name !== 'Property' || object?.name !== 'Object') return null;
	const name = propertyName(property, text);
	if (!name) return null;
	const context = definitionContext(object, rootObject, text);
	if (!context) return null;
	const definitions = expandedDefinitions(context);
	const definition = definitions[name] ?? definitions['*'];
	if (!definition) return null;

	return {
		from: nameNode.from,
		to: nameNode.to,
		title: name,
		detail: definitionDetail(definition),
		documentation: plainDocumentation(definition)
	};
};

export const styleJsonHoverSource: HoverTooltipSource = (view, position) => {
	const hover = getStyleJsonHover(view.state, position);
	if (!hover) return null;
	return {
		pos: hover.from,
		end: hover.to,
		above: true,
		arrow: true,
		create: () => {
			const dom = document.createElement('div');
			dom.className = 'cm-style-json-hover';
			const title = document.createElement('div');
			title.className = 'cm-style-json-hover-title';
			title.textContent = hover.title;
			dom.appendChild(title);
			if (hover.detail) {
				const detail = document.createElement('div');
				detail.className = 'cm-style-json-hover-detail';
				detail.textContent = hover.detail;
				dom.appendChild(detail);
			}
			if (hover.documentation) {
				const documentation = document.createElement('div');
				documentation.className = 'cm-style-json-hover-documentation';
				documentation.textContent = hover.documentation;
				dom.appendChild(documentation);
			}
			return { dom };
		}
	};
};

const arrayValue = (array: JsonNode, index: number): JsonNode | null => {
	let currentIndex = 0;
	for (let child = array.firstChild; child; child = child.nextSibling) {
		if (!jsonValueNodeNames.has(child.name)) continue;
		if (currentIndex === index) return child;
		currentIndex += 1;
	}
	return null;
};

type ResolvedValidationPath = {
	node: JsonNode;
	nameNode: JsonNode | null;
};

const resolveValidationPath = (
	rootObject: JsonNode,
	path: string,
	text: string
): ResolvedValidationPath => {
	let node = rootObject;
	let nameNode: JsonNode | null = null;
	let remaining = path;

	while (remaining !== '') {
		if (node.name === 'Object') {
			if (remaining.startsWith('.')) remaining = remaining.slice(1);
			const candidates = propertyNodes(node)
				.map((property) => ({ property, name: propertyName(property, text) }))
				.filter(
					(candidate): candidate is { property: JsonNode; name: string } =>
						candidate.name !== null &&
						(remaining === candidate.name ||
							remaining.startsWith(`${candidate.name}.`) ||
							remaining.startsWith(`${candidate.name}[`))
				)
				.sort((a, b) => b.name.length - a.name.length);
			const candidate = candidates[0];
			if (!candidate) break;
			const value = propertyValue(candidate.property);
			nameNode = propertyNameNode(candidate.property);
			if (!value) break;
			node = value;
			remaining = remaining.slice(candidate.name.length);
			continue;
		}

		if (node.name === 'Array') {
			const match = /^\[(\d+)\]/.exec(remaining);
			if (!match) break;
			const value = arrayValue(node, Number(match[1]));
			if (!value) break;
			node = value;
			nameNode = null;
			remaining = remaining.slice(match[0].length);
			continue;
		}

		break;
	}

	return { node, nameNode };
};

const diagnosticRange = (node: JsonNode, textLength: number): { from: number; to: number } => {
	const from = Math.min(Math.max(node.from, 0), textLength);
	if (node.name === 'Object' || node.name === 'Array') {
		return { from, to: Math.min(from + 1, textLength) };
	}
	const to = Math.min(Math.max(node.to, from), textLength);
	return { from, to: to === from ? Math.min(from + 1, textLength) : to };
};

export const createStyleJsonDiagnostics = (
	text: string,
	messages: readonly string[]
): StyleJsonDiagnostic[] => {
	const rootObject = documentObject(parseRoot(text));
	if (!rootObject) return [];

	return messages.map((validationMessage) => {
		const separator = validationMessage.indexOf(': ');
		const path = separator === -1 ? '' : validationMessage.slice(0, separator);
		const message = separator === -1 ? validationMessage : validationMessage.slice(separator + 2);
		const resolved = resolveValidationPath(rootObject, path, text);
		const target =
			message.startsWith('unknown property') && resolved.nameNode
				? resolved.nameNode
				: resolved.node;
		return {
			...diagnosticRange(target, text.length),
			severity: 'warning' as const,
			message,
			source: 'MapLibre style'
		};
	});
};
