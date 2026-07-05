<script lang="ts">
	import type { InterpolationSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils/tailwindUtil.ts';

	let {
		class: className,
		// value / onChange は dispatcher から渡されるが linear は編集対象の引数を持たない
		// （rest spread で div に漏らさないため destructure だけする）
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		value,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		onChange,
		typeSelect,
		children,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		children?: Snippet;
		value: ['linear'];
		onChange?: (value: InterpolationSpecification) => void;
		/** rendered in place of the static interpolation-type token */
		typeSelect?: Snippet;
	} = $props();
</script>

<div
	{...props}
	class={cn('flex flex-row flex-wrap items-center rounded bg-black/5 px-0.5 py-0.5', className)}
>
	{#if typeSelect}{@render typeSelect()}{:else}linear{/if}
	{@render children?.()}
</div>
