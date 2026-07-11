<script lang="ts">
	import type {
		ExpressionInputType,
		ExpressionSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { CurveStopsEditor } from '$lib/components/common/FilterInputField/expressions/curves/common/CurveStopsEditor';

	let {
		class: className,
		children,
		value,
		zoomRange,
		onChange,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		children?: Snippet;
		value: [
			'step',
			number | ExpressionSpecification,
			ExpressionInputType | ExpressionSpecification,
			...(number | ExpressionInputType | ExpressionSpecification)[]
		];
		zoomRange?: [number, number];
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
</script>

<CurveStopsEditor
	{...props}
	class={className}
	value={expression}
	{zoomRange}
	{onChange}
	{children}
/>
