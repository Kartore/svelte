<script lang="ts">
	import { Compass } from 'phosphor-svelte';
	import type { ComponentProps } from 'svelte';

	let { ...props }: ComponentProps<typeof Compass> = $props();
</script>

<Compass {...props} color="currentColor" weight="regular" />
