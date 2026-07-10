<script lang="ts">
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { adapterProviders } from 'virtual:kartore-adapter';

	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AdapterProviders from '$lib/components/AdapterProviders.svelte';

	let { children } = $props();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: Infinity,
				refetchOnWindowFocus: false,
				retry: 1
			}
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<QueryClientProvider client={queryClient}>
	<AdapterProviders providers={adapterProviders}>
		{@render children()}
	</AdapterProviders>
</QueryClientProvider>
