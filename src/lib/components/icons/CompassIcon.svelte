<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';

	let {
		northClass,
		southClass,
		...props
	}: SVGAttributes<SVGSVGElement> & {
		northClass?: string;
		southClass?: string;
	} = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" {...props}>
	<polygon fill="currentColor" points="6,9 10,1 14,9" class={northClass} />
	<polygon fill="currentColor" points="6,11 10,19 14,11" class={southClass} />
</svg>
