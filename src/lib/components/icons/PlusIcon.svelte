<script lang="ts">
	import { Plus } from 'phosphor-svelte';
	import type { ComponentProps } from 'svelte';

	let { ...props }: ComponentProps<typeof Plus> = $props();
</script>

<Plus {...props} color="currentColor" weight="regular" />
