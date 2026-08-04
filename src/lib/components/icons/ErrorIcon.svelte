<script lang="ts">
	import { WarningCircle } from 'phosphor-svelte';
	import type { ComponentProps } from 'svelte';

	let { ...props }: ComponentProps<typeof WarningCircle> = $props();
</script>

<WarningCircle {...props} color="currentColor" weight="regular" />
