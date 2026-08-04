<script lang="ts">
	import type { InterpolationSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '#lib/utils/tailwindUtil.ts';

	let {
		class: className,
		// value / onChange は dispatcher から渡されるが linear は編集対象の引数を持たない
		// （rest spread で div に漏らさないため destructure だけする）
		value: _value,
		onChange: _onChange,
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

	const htmlProps = $derived.by(() => {
		void _value;
		void _onChange;
		return props;
	});
</script>

<div
	{...htmlProps}
	class={cn('flex flex-row flex-wrap items-center rounded bg-field px-0.5 py-0.5', className)}
>
	{#if typeSelect}{@render typeSelect()}{:else}linear{/if}
	{@render children?.()}
</div>
