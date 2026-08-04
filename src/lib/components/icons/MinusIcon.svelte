<script lang="ts">
	import { Minus } from 'phosphor-svelte';
	import type { ComponentProps } from 'svelte';

	let { ...props }: ComponentProps<typeof Minus> = $props();
</script>

<Minus {...props} color="currentColor" weight="regular" />
