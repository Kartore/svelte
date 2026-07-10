<script lang="ts">
	import { adapterProviders } from 'virtual:kartore-adapter';

	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AdapterProviders from '$lib/components/AdapterProviders.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<AdapterProviders providers={adapterProviders}>
	{@render children()}
</AdapterProviders>
