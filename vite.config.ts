import tailwindcss from '@tailwindcss/vite';
import { fileAdapter } from '@kartore/file-adapter/vite';
import { githubAdapter } from '@kartore-internal/github-adapter/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { kartore } from './vite-plugin-kartore.ts';

export default defineConfig({
	plugins: [
		kartore({
			adapters: [fileAdapter(), githubAdapter()]
		}),
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
				experimental: { async: true }
			},
			adapter: adapter(),
			experimental: {
				remoteFunctions: true,
				forkPreloads: true
			}
		})
	]
});
