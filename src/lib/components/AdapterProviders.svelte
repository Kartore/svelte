<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	type AdapterProvider = Component<{ children: Snippet }>;

	let { providers, children }: { providers: AdapterProvider[]; children: Snippet } = $props();
</script>

{#snippet provide(index: number)}
	{@const Provider = providers[index]}
	{#if Provider}
		<Provider>
			{@render provide(index + 1)}
		</Provider>
	{:else}
		{@render children()}
	{/if}
{/snippet}

{@render provide(0)}
