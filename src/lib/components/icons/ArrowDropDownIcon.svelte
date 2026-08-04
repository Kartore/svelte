<script lang="ts">
	import { CaretDown } from 'phosphor-svelte';
	import type { ComponentProps } from 'svelte';

	let { ...props }: ComponentProps<typeof CaretDown> = $props();
</script>

<CaretDown {...props} color="currentColor" weight="regular" />
