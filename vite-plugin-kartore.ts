import path from 'node:path';

import type { Plugin } from 'vite';

const clientVirtualModuleId = 'virtual:kartore-adapter';
const serverVirtualModuleId = 'virtual:kartore-adapter/server';

type KartoreAdapterApi = {
	/** `adapterModules` / `adapterProviders` を export するモジュール指定子 */
	clientModule: string;
	/** `adapterApiHandlers` を export するモジュール指定子 (バックエンドを持つ場合のみ) */
	serverModule?: string;
	/** optimizeDeps.exclude / ssr.noExternal に加える Svelte 系依存 */
	svelteDependencies?: string[];
};

/** アダプタが export するマニフェスト型と同じ形 (コア側で独立に定義し、特定アダプタに依存しない) */
type KartoreAdapterVitePlugin = {
	name: string;
	api: { kartoreAdapter: KartoreAdapterApi };
};

const kartoreAdapterApi = (plugin: unknown): KartoreAdapterApi | null => {
	if (typeof plugin !== 'object' || plugin === null) return null;
	const api = (plugin as { api?: { kartoreAdapter?: unknown } }).api?.kartoreAdapter;
	if (typeof api !== 'object' || api === null) return null;
	const { clientModule } = api as Record<string, unknown>;
	if (typeof clientModule !== 'string') return null;
	return api as KartoreAdapterApi;
};

// Tailwind のルート CSS (@import 'tailwindcss' を含むもの) にアダプタの @source を注入する。
// @tailwindcss/vite の変換 (enforce: 'pre') より先に走る必要があるため、この plugin も pre で
// kartore() が tailwindcss() より前に並ぶことを利用する。
// スキャン対象ディレクトリは clientModule を vite 自身のリゾルバ (this.resolve) で解決して求める —
// 集約コードの import と同じ解決系を使うため、パッケージマネージャの配置 (pnpm virtual store 等) に依存しない
const tailwindSourcePlugin = (clientModules: string[]): Plugin => {
	let sourceDirsPromise: Promise<string[]> | null = null;

	return {
		name: 'kartore-adapter-tailwind-sources',
		enforce: 'pre',
		async transform(code, id) {
			if (clientModules.length === 0) return;
			const [file] = id.split('?', 1);
			if (!file.endsWith('.css') || !/@import\s+(['"])tailwindcss\1/.test(code)) return;

			sourceDirsPromise ??= Promise.all(
				clientModules.map(async (specifier) => {
					const resolved = await this.resolve(specifier, undefined, { skipSelf: true });
					if (!resolved) {
						console.warn(`[kartore] Could not resolve ${specifier} for Tailwind @source.`);
						return [];
					}
					return [path.dirname(resolved.id.split('?', 1)[0])];
				})
			).then((dirs) => dirs.flat());

			const sources = (await sourceDirsPromise).map((dir) => {
				const relative = path.relative(path.dirname(file), dir).split(path.sep).join('/');
				return `@source ${JSON.stringify(relative)};`;
			});
			return { code: `${code}\n${sources.join('\n')}\n`, map: null };
		}
	};
};

// 各アダプタのモジュールから named export を集めて 1 本の配列に再 export するコードを生成する
const aggregateModule = (moduleIds: string[], exportNames: string[]): string => {
	const imports = moduleIds.map(
		(moduleId, index) =>
			`import { ${exportNames.map((name) => `${name} as ${name}${index}`).join(', ')} } from ${JSON.stringify(moduleId)};`
	);
	const aggregates = exportNames.map(
		(name) =>
			`export const ${name} = [${moduleIds.map((_, index) => `...${name}${index}`).join(', ')}];`
	);
	return [...imports, ...aggregates, ''].join('\n');
};

const registryPlugin = (adapters: KartoreAdapterVitePlugin[]): Plugin => {
	// 同一アダプタが二重に渡されてもモジュールが二重登録されないよう clientModule で重複排除する
	const apis = [
		...new Map(
			adapters.map(({ api }) => [api.kartoreAdapter.clientModule, api.kartoreAdapter])
		).values()
	];
	const clientIds = apis.map(({ clientModule }) => clientModule);
	const serverIds = apis.flatMap(({ serverModule }) => (serverModule ? [serverModule] : []));
	const svelteDependencies = [...new Set(apis.flatMap((api) => api.svelteDependencies ?? []))];
	const registeredIds = new Set(clientIds);
	const resolvedIds = new Map([
		[clientVirtualModuleId, '\0' + clientVirtualModuleId],
		[serverVirtualModuleId, '\0' + serverVirtualModuleId]
	]);

	return {
		name: 'kartore-adapter-registry',
		config() {
			if (svelteDependencies.length === 0) return;
			// アダプタの Svelte 系依存はソースのままホスト側でコンパイルする
			return {
				optimizeDeps: { exclude: svelteDependencies },
				ssr: { noExternal: svelteDependencies }
			};
		},
		configResolved(config) {
			// kartore() を通さず plugins に直接置かれたアダプタは機能しない。事故防止に警告する
			for (const plugin of config.plugins) {
				const api = kartoreAdapterApi(plugin);
				if (api && !registeredIds.has(api.clientModule)) {
					console.warn(
						`[kartore] Adapter plugin "${plugin.name}" is placed outside kartore(). Pass it via kartore({ adapters: [...] }) instead.`
					);
				}
			}
		},
		resolveId(id) {
			return resolvedIds.get(id);
		},
		load(id) {
			if (id === resolvedIds.get(clientVirtualModuleId)) {
				return aggregateModule(clientIds, ['adapterModules', 'adapterProviders']);
			}
			if (id === resolvedIds.get(serverVirtualModuleId)) {
				return aggregateModule(serverIds, ['adapterApiHandlers']);
			}
		}
	};
};

/**
 * Kartore のアダプタ登録の唯一の入口。
 *
 * ```ts
 * plugins: [kartore({ adapters: [someAdapter(), anotherAdapter()] })]
 * ```
 */
export const kartore = ({
	adapters = []
}: {
	adapters?: KartoreAdapterVitePlugin[];
} = {}): Plugin[] => [
	registryPlugin(adapters),
	tailwindSourcePlugin([...new Set(adapters.map(({ api }) => api.kartoreAdapter.clientModule))]),
	...adapters
];
