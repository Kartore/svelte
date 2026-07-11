<script lang="ts">
	import type {
		ColorSpecification,
		ExpressionSpecification,
		InterpolationSpecification,
		ProjectionDefinitionSpecification
	} from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { CurveStopsEditor } from '$lib/components/common/FilterInputField/expressions/curves/common/CurveStopsEditor';
	import type { StylePropertySpec } from '$lib/utils/layerSpec.ts';

	let {
		class: className,
		children,
		value,
		zoomRange,
		propertySpec,
		onChange,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		children?: Snippet;
		value: [
			'interpolate',
			InterpolationSpecification,
			number | ExpressionSpecification,
			...(
				| number
				| number[]
				| ColorSpecification
				| ProjectionDefinitionSpecification
				| ExpressionSpecification
			)[]
		];
		zoomRange?: [number, number];
		propertySpec?: StylePropertySpec;
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
</script>

<CurveStopsEditor
	{...props}
	class={className}
	value={expression}
	{zoomRange}
	{propertySpec}
	{onChange}
	{children}
/>
