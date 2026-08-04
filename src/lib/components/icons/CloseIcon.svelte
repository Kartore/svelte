<script lang="ts">
	import { X } from 'phosphor-svelte';
	import type { ComponentProps } from 'svelte';

	let { ...props }: ComponentProps<typeof X> = $props();
</script>

<X {...props} color="currentColor" weight="regular" />
