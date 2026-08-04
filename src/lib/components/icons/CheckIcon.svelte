<script lang="ts">
	import { Check } from 'phosphor-svelte';
	import type { ComponentProps } from 'svelte';

	let { ...props }: ComponentProps<typeof Check> = $props();
</script>

<Check {...props} color="currentColor" weight="regular" />
