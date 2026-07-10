declare module 'virtual:kartore-adapter' {
	import type { EditorModule } from '$lib/editor/EditorModule.ts';
	import type { Component, Snippet } from 'svelte';

	export type AdapterProvider = Component<{ children: Snippet }>;

	export const adapterModules: EditorModule[];
	export const adapterProviders: AdapterProvider[];
}

declare module 'virtual:kartore-adapter/server' {
	export type AdapterApiHandler = {
		id: string;
		fetch: (request: Request, env: unknown, ctx: ExecutionContext) => Response | Promise<Response>;
	};

	export const adapterApiHandlers: AdapterApiHandler[];
}
