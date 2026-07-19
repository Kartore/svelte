import type { AddProtocolAction, RequestParameters } from 'maplibre-gl';
import * as maplibregl from 'maplibre-gl';

export const GLYPH_PROTOCOL_NAME = 'kartore-glyph';
export const GLYPH_PROTOCOL_TEMPLATE = `${GLYPH_PROTOCOL_NAME}://{fontstack}/{range}.pbf`;

export type ParsedGlyphProtocolUrl = {
	fontstack: string;
	start: number;
	end: number;
	range: string;
};

export type GlyphProtocolGetters = {
	hasLocalFont: (fontstack: string) => boolean;
	getOriginalGlyphsUrl: () => string | undefined;
	generateRange: (fontstack: string, start: number) => Promise<Uint8Array>;
};

export type GlyphProtocolLoaderOptions = GlyphProtocolGetters & {
	fetch?: typeof globalThis.fetch;
};

const glyphUrlPattern = new RegExp(
	`^${GLYPH_PROTOCOL_NAME}://([^/]+)/(\\d+)-(\\d+)\\.pbf(?:[?#].*)?$`
);

export const parseGlyphProtocolUrl = (url: string): ParsedGlyphProtocolUrl => {
	const match = glyphUrlPattern.exec(url);
	if (!match) throw new Error(`Invalid ${GLYPH_PROTOCOL_NAME} URL: ${url}`);

	let fontstack: string;
	try {
		fontstack = decodeURIComponent(match[1]);
	} catch {
		throw new Error(`Invalid encoded fontstack in ${GLYPH_PROTOCOL_NAME} URL: ${url}`);
	}
	if (fontstack === '') throw new Error(`Fontstack is missing from ${GLYPH_PROTOCOL_NAME} URL.`);

	const start = Number(match[2]);
	const end = Number(match[3]);
	if (!Number.isSafeInteger(start) || start < 0 || start % 256 !== 0 || end !== start + 255) {
		throw new Error(`Invalid glyph range in ${GLYPH_PROTOCOL_NAME} URL: ${match[2]}-${match[3]}`);
	}

	return { fontstack, start, end, range: `${start}-${end}` };
};

export const expandGlyphsUrl = (template: string, fontstack: string, range: string): string =>
	template.replace('{fontstack}', fontstack).replace('{range}', range);

const responseMetadata = (response: Response) => {
	const expires = response.headers.get('expires');
	return {
		cacheControl: response.headers.get('cache-control') ?? undefined,
		expires: expires ?? undefined,
		etag: response.headers.get('etag') ?? undefined
	};
};

const fetchOptions = (
	request: RequestParameters,
	abortController: AbortController
): RequestInit => ({
	method: request.method,
	body: request.body,
	headers: request.headers,
	credentials: request.credentials,
	cache: request.cache,
	referrerPolicy: request.referrerPolicy,
	signal: abortController.signal
});

const exactArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
	if (
		bytes.buffer instanceof ArrayBuffer &&
		bytes.byteOffset === 0 &&
		bytes.byteLength === bytes.buffer.byteLength
	) {
		return bytes.buffer;
	}
	return Uint8Array.from(bytes).buffer;
};

export const createGlyphProtocolLoader = ({
	hasLocalFont,
	getOriginalGlyphsUrl,
	generateRange,
	fetch: fetchGlyphs = globalThis.fetch
}: GlyphProtocolLoaderOptions): AddProtocolAction => {
	return async (request, abortController) => {
		const glyphRequest = parseGlyphProtocolUrl(request.url);
		if (hasLocalFont(glyphRequest.fontstack)) {
			const data = await generateRange(glyphRequest.fontstack, glyphRequest.start);
			return { data: exactArrayBuffer(data) };
		}

		const originalGlyphsUrl = getOriginalGlyphsUrl();
		if (!originalGlyphsUrl) {
			throw new Error(
				`No local font or original glyphs URL is available for “${glyphRequest.fontstack}”.`
			);
		}

		const url = expandGlyphsUrl(originalGlyphsUrl, glyphRequest.fontstack, glyphRequest.range);
		const response = await fetchGlyphs(url, fetchOptions(request, abortController));
		if (!response.ok) {
			throw new Error(
				`Could not load glyphs from ${url}: ${response.status} ${response.statusText}`.trim()
			);
		}
		return { data: await response.arrayBuffer(), ...responseMetadata(response) };
	};
};

type GlyphProtocolRuntime = GlyphProtocolGetters & {
	registered: boolean;
};

const runtimeKey = '__kartoreGlyphProtocolRuntime__';
const runtimeHost = globalThis as typeof globalThis & {
	[runtimeKey]?: GlyphProtocolRuntime;
};
const runtime = (runtimeHost[runtimeKey] ??= {
	registered: false,
	hasLocalFont: () => false,
	getOriginalGlyphsUrl: () => undefined,
	generateRange: async () => {
		throw new Error('The local font store is not configured.');
	}
});

const protocolLoader = createGlyphProtocolLoader({
	hasLocalFont: (fontstack) => runtime.hasLocalFont(fontstack),
	getOriginalGlyphsUrl: () => runtime.getOriginalGlyphsUrl(),
	generateRange: (fontstack, start) => runtime.generateRange(fontstack, start)
});

export const registerGlyphProtocol = (getters: GlyphProtocolGetters): void => {
	runtime.hasLocalFont = getters.hasLocalFont;
	runtime.getOriginalGlyphsUrl = getters.getOriginalGlyphsUrl;
	runtime.generateRange = getters.generateRange;
	if (typeof window === 'undefined' || runtime.registered) return;

	maplibregl.addProtocol(GLYPH_PROTOCOL_NAME, protocolLoader);
	runtime.registered = true;
};
