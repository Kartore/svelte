<script lang="ts">
	import { Eyedropper } from 'phosphor-svelte';
	import type { ComponentProps } from 'svelte';

	let { ...props }: ComponentProps<typeof Eyedropper> = $props();
</script>

<Eyedropper {...props} color="currentColor" weight="regular" />
