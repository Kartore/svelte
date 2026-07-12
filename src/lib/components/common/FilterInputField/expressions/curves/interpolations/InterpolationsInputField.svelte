<script lang="ts">
	import type { InterpolationSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import {
		CubicBezierInputField,
		isCubicBezierInterpolationSpecification
	} from '$lib/components/common/FilterInputField/expressions/curves/interpolations/CubicBezierInputField';
	import {
		ExponentialInputField,
		isExponentialInterpolationSpecification
	} from '$lib/components/common/FilterInputField/expressions/curves/interpolations/ExponentialInputField';
	import {
		LinearInputField,
		isLinearInterpolationSpecification
	} from '$lib/components/common/FilterInputField/expressions/curves/interpolations/LinearInputField';
	import { Select } from '$lib/components/common/Select';

	let {
		value,
		onChange,
		children,
		...props
	}: Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		children?: Snippet;
		value: InterpolationSpecification;
		onChange?: (value: InterpolationSpecification) => void;
	} = $props();

	const interpolationTypeDefaults: Record<string, () => InterpolationSpecification> = {
		linear: () => ['linear'],
		exponential: () => ['exponential', 2],
		'cubic-bezier': () => ['cubic-bezier', 0.42, 0, 0.58, 1]
	};

	const interpolationTypes = Object.keys(interpolationTypeDefaults);
</script>

{#snippet typeSelect()}
	<Select
		aria-label="interpolation type"
		class="inline-flex min-w-0 max-w-full font-mono"
		triggerClass="w-auto min-w-0 max-w-full font-mono font-normal text-gray-700"
		items={interpolationTypes.map((type) => ({ value: type, label: type }))}
		value={value[0]}
		onValueChange={(key) => {
			if (key === value[0]) return;
			const createDefault = interpolationTypeDefaults[String(key)];
			if (!createDefault) return;
			onChange?.(createDefault());
		}}
	/>
{/snippet}

{#if isCubicBezierInterpolationSpecification(value)}
	<CubicBezierInputField
		{value}
		{onChange}
		typeSelect={onChange ? typeSelect : undefined}
		{...props}
		{children}
	/>
{:else if isExponentialInterpolationSpecification(value)}
	<ExponentialInputField
		{value}
		{onChange}
		typeSelect={onChange ? typeSelect : undefined}
		{...props}
		{children}
	/>
{:else if isLinearInterpolationSpecification(value)}
	<LinearInputField
		{value}
		{onChange}
		typeSelect={onChange ? typeSelect : undefined}
		{...props}
		{children}
	/>
{/if}
