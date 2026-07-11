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

	let {
		class: className,
		children,
		value,
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
		onChange?: (value: ExpressionSpecification) => void;
	} = $props();

	const expression = $derived(value as ExpressionSpecification);
</script>

<CurveStopsEditor {...props} class={className} value={expression} {onChange} {children} />
