<script lang="ts" module>
	import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type ExpressionInputFieldProps = Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> & {
		class?: string;
		children?: Snippet;
		value: ExpressionSpecification;
		onChange?: (value: ExpressionSpecification) => void;
	};
</script>

<script lang="ts">
	import type { Component } from 'svelte';

	import {
		RgbaInputField,
		isRgbaExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/color/RgbaInputField';
	import {
		RgbInputField,
		isRgbExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/color/RgbInputField';
	import {
		ToRgbaInputField,
		isToRgbaExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/color/ToRgbaInputField';
	import {
		InterpolateHclInputField,
		isInterpolateHclExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/curves/InterpolateHclInputField';
	import {
		InterpolateInputField,
		isInterpolateExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/curves/InterpolateInputField';
	import {
		InterpolateLabInputField,
		isInterpolateLabExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/curves/InterpolateLabInputField';
	import {
		StepInputField,
		isStepExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/curves/StepInputField';
	import {
		AllInputField,
		isAllExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/decision/AllInputField';
	import {
		AnyInputField,
		isAnyExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/decision/AnyInputField';
	import {
		CaseInputField,
		isCaseExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/decision/CaseInputField';
	import {
		CoalesceInputField,
		isCoalesceExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/decision/CoalesceInputField';
	import {
		EqualInputField,
		isEqualExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/decision/EqualInputField';
	import {
		GreaterThanInputField,
		isGreaterThanExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/decision/GreaterThanInputField';
	import {
		GreaterThanOrEqualInputField,
		isGreaterThanOrEqualExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/decision/GreaterThanOrEqualInputField';
	import {
		LessThanInputField,
		isLessThanExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/decision/LessThanInputField';
	import {
		LessThanOrEqualInputField,
		isLessThanOrEqualExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/decision/LessThanOrEqualInputField';
	import {
		MatchInputField,
		isMatchExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/decision/MatchInputField';
	import {
		NotEqualInputField,
		isNotEqualExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/decision/NotEqualInputField';
	import {
		NotInputField,
		isNotExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/decision/NotInputField';
	import {
		WithinInputField,
		isWithinExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/decision/WithinInputField';
	import {
		AccumulatedInputField,
		isAccumulatedExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/feature-data/AccumulatedInputField';
	import {
		FeatureStateInputField,
		isFeatureStateExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/feature-data/FeatureStateInputField';
	import {
		GeometryTypeInputField,
		isGeometryTypeExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/feature-data/GeometryTypeInputField';
	import {
		IdInputField,
		isIdExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/feature-data/IdInputField';
	import {
		LineProgressInputField,
		isLineProgressExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/feature-data/LineProgressInputField';
	import {
		PropertiesInputField,
		isPropertiesExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/feature-data/PropertiesInputField';
	import {
		HeatmapDensityInputField,
		isHeatmapDensityExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/heatmap/HeatmapDensity';
	import {
		AtInputField,
		isAtExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/lookup/AtInputField';
	import {
		GetInputField,
		isGetExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/lookup/GetInputField';
	import {
		HasInputField,
		isHasExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/lookup/HasInputField';
	import {
		IndexOfInputField,
		isIndexOfExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/lookup/IndexOfInputField';
	import {
		InInputField,
		isInExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/lookup/InInputField';
	import {
		LengthInputField,
		isLengthExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/lookup/LengthInputField';
	import {
		SliceInputField,
		isSliceExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/lookup/SliceInputField';
	import {
		AbsInputField,
		isAbsExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/AbsInputField';
	import {
		AcosInputField,
		isAcosExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/AcosInputField';
	import {
		AdditionInputField,
		isAdditionExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/AdditionInputField';
	import {
		AsinInputField,
		isAsinExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/AsinInputField';
	import {
		AtanInputField,
		isAtanExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/AtanInputField';
	import {
		CeilInputField,
		isCeilExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/CeilInputField';
	import {
		CosInputField,
		isCosExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/CosInputField';
	import {
		DistanceInputField,
		isDistanceExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/DistanceInputField';
	import {
		DivisionInputField,
		isDivisionExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/DivisionInputField';
	import {
		EInputField,
		isEExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/EInputField';
	import {
		FloorInputField,
		isFloorExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/FloorInputField';
	import {
		Ln2InputField,
		isLn2ExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/Ln2InputField';
	import {
		LnInputField,
		isLnExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/LnInputField';
	import {
		Log2InputField,
		isLog2ExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/Log2InputField';
	import {
		Log10InputField,
		isLog10ExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/Log10InputField';
	import {
		MaxInputField,
		isMaxExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/MaxInputField';
	import {
		MinInputField,
		isMinExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/MinInputField';
	import {
		MultiplicationInputField,
		isMultiplicationExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/MultiplicationInputField';
	import {
		PiInputField,
		isPiExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/PiInputField';
	import {
		PowerInputField,
		isPowerExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/PowerInputField';
	import {
		RemainderInputField,
		isRemainderExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/RemainderInputField';
	import {
		RoundInputField,
		isRoundExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/RoundInputField';
	import {
		SinInputField,
		isSinExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/SinInputField';
	import {
		SqrtInputField,
		isSqrtExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/SqrtInputField';
	import {
		SubtractionInputField,
		isSubtractionExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/SubtractionInputField';
	import {
		TanInputField,
		isTanExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/math/TanInputField';
	import {
		ConcatInputField,
		isConcatExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/string/ConcatInputField';
	import {
		DowncaseInputField,
		isDowncaseExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/string/DowncaseInputField';
	import {
		IsSupportedScriptInputField,
		isIsSupportedScriptExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/string/IsSupportedScriptInputField';
	import {
		ResolvedLocaleInputField,
		isResolvedLocaleExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/string/ResolvedLocaleInputField';
	import {
		UpcaseInputField,
		isUpcaseExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/string/UpcaseInputField';
	import {
		ArrayInputField,
		isArrayExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/ArrayInputField';
	import {
		BooleanInputField,
		isBooleanExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/BooleanInputField';
	import {
		CollatorInputField,
		isCollatorExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/CollatorInputField';
	import {
		FormatInputField,
		isFormatExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/FormatInputField';
	import {
		ImageInputField,
		isImageExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/ImageInputField';
	import {
		LiteralInputField,
		isLiteralExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/LiteralInputField';
	import {
		NumberFormatInputField,
		isNumberFormatExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/NumberFormatInputField';
	import {
		NumberInputField,
		isNumberExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/NumberInputField';
	import {
		ObjectInputField,
		isObjectExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/ObjectInputField';
	import {
		StringInputField,
		isStringExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/StringInputField';
	import {
		ToBooleanInputField,
		isToBooleanExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/ToBooleanInputField';
	import {
		ToColorInputField,
		isToColorExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/ToColorInputField';
	import {
		ToNumberInputField,
		isToNumberExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/ToNumberInputField';
	import {
		ToStringInputField,
		isToStringExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/ToStringInputField';
	import {
		TypeofInputField,
		isTypeofExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/types/TypeofInputField';
	import {
		LetInputField,
		isLetExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/variables/LetInputField';
	import {
		VarInputField,
		isVarExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/variables/VarInputField';
	import {
		ZoomInputField,
		isZoomExpressionSpecification
	} from '$lib/components/common/FilterInputField/expressions/zoom/ZoomInputField';

	type ExpressionFieldDispatchEntry = {
		guard: (value: ExpressionSpecification) => boolean;
		// each field narrows `value` further; the guard guarantees the match at runtime
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: Component<any>;
	};

	// the order MUST match the React version's if-chain (first match wins)
	const dispatchers: ExpressionFieldDispatchEntry[] = [
		{ guard: isRgbaExpressionSpecification, component: RgbaInputField },
		{ guard: isRgbExpressionSpecification, component: RgbInputField },
		{ guard: isToRgbaExpressionSpecification, component: ToRgbaInputField },
		{ guard: isInterpolateHclExpressionSpecification, component: InterpolateHclInputField },
		{ guard: isInterpolateExpressionSpecification, component: InterpolateInputField },
		{ guard: isInterpolateLabExpressionSpecification, component: InterpolateLabInputField },
		{ guard: isStepExpressionSpecification, component: StepInputField },
		{ guard: isAllExpressionSpecification, component: AllInputField },
		{ guard: isAnyExpressionSpecification, component: AnyInputField },
		{ guard: isCaseExpressionSpecification, component: CaseInputField },
		{ guard: isCoalesceExpressionSpecification, component: CoalesceInputField },
		{ guard: isEqualExpressionSpecification, component: EqualInputField },
		{ guard: isGreaterThanExpressionSpecification, component: GreaterThanInputField },
		{
			guard: isGreaterThanOrEqualExpressionSpecification,
			component: GreaterThanOrEqualInputField
		},
		{ guard: isLessThanExpressionSpecification, component: LessThanInputField },
		{ guard: isLessThanOrEqualExpressionSpecification, component: LessThanOrEqualInputField },
		{ guard: isMatchExpressionSpecification, component: MatchInputField },
		{ guard: isNotEqualExpressionSpecification, component: NotEqualInputField },
		{ guard: isNotExpressionSpecification, component: NotInputField },
		{ guard: isWithinExpressionSpecification, component: WithinInputField },
		{ guard: isAccumulatedExpressionSpecification, component: AccumulatedInputField },
		{ guard: isFeatureStateExpressionSpecification, component: FeatureStateInputField },
		{ guard: isGeometryTypeExpressionSpecification, component: GeometryTypeInputField },
		{ guard: isIdExpressionSpecification, component: IdInputField },
		{ guard: isLineProgressExpressionSpecification, component: LineProgressInputField },
		{ guard: isPropertiesExpressionSpecification, component: PropertiesInputField },
		{ guard: isHeatmapDensityExpressionSpecification, component: HeatmapDensityInputField },
		{ guard: isAtExpressionSpecification, component: AtInputField },
		{ guard: isGetExpressionSpecification, component: GetInputField },
		{ guard: isHasExpressionSpecification, component: HasInputField },
		{ guard: isIndexOfExpressionSpecification, component: IndexOfInputField },
		{ guard: isInExpressionSpecification, component: InInputField },
		{ guard: isLengthExpressionSpecification, component: LengthInputField },
		{ guard: isSliceExpressionSpecification, component: SliceInputField },
		{ guard: isAbsExpressionSpecification, component: AbsInputField },
		{ guard: isAcosExpressionSpecification, component: AcosInputField },
		{ guard: isAdditionExpressionSpecification, component: AdditionInputField },
		{ guard: isAsinExpressionSpecification, component: AsinInputField },
		{ guard: isAtanExpressionSpecification, component: AtanInputField },
		{ guard: isCeilExpressionSpecification, component: CeilInputField },
		{ guard: isCosExpressionSpecification, component: CosInputField },
		{ guard: isDistanceExpressionSpecification, component: DistanceInputField },
		{ guard: isDivisionExpressionSpecification, component: DivisionInputField },
		{ guard: isEExpressionSpecification, component: EInputField },
		{ guard: isFloorExpressionSpecification, component: FloorInputField },
		{ guard: isLn2ExpressionSpecification, component: Ln2InputField },
		{ guard: isLnExpressionSpecification, component: LnInputField },
		{ guard: isLog2ExpressionSpecification, component: Log2InputField },
		{ guard: isLog10ExpressionSpecification, component: Log10InputField },
		{ guard: isMaxExpressionSpecification, component: MaxInputField },
		{ guard: isMinExpressionSpecification, component: MinInputField },
		{ guard: isMultiplicationExpressionSpecification, component: MultiplicationInputField },
		{ guard: isPiExpressionSpecification, component: PiInputField },
		{ guard: isPowerExpressionSpecification, component: PowerInputField },
		{ guard: isRemainderExpressionSpecification, component: RemainderInputField },
		{ guard: isRoundExpressionSpecification, component: RoundInputField },
		{ guard: isSinExpressionSpecification, component: SinInputField },
		{ guard: isSqrtExpressionSpecification, component: SqrtInputField },
		{ guard: isSubtractionExpressionSpecification, component: SubtractionInputField },
		{ guard: isTanExpressionSpecification, component: TanInputField },
		{ guard: isConcatExpressionSpecification, component: ConcatInputField },
		{ guard: isDowncaseExpressionSpecification, component: DowncaseInputField },
		{
			guard: isIsSupportedScriptExpressionSpecification,
			component: IsSupportedScriptInputField
		},
		{ guard: isResolvedLocaleExpressionSpecification, component: ResolvedLocaleInputField },
		{ guard: isUpcaseExpressionSpecification, component: UpcaseInputField },
		{ guard: isArrayExpressionSpecification, component: ArrayInputField },
		{ guard: isBooleanExpressionSpecification, component: BooleanInputField },
		{ guard: isCollatorExpressionSpecification, component: CollatorInputField },
		{ guard: isFormatExpressionSpecification, component: FormatInputField },
		{ guard: isImageExpressionSpecification, component: ImageInputField },
		{ guard: isLiteralExpressionSpecification, component: LiteralInputField },
		{ guard: isNumberFormatExpressionSpecification, component: NumberFormatInputField },
		{ guard: isNumberExpressionSpecification, component: NumberInputField },
		{ guard: isObjectExpressionSpecification, component: ObjectInputField },
		{ guard: isStringExpressionSpecification, component: StringInputField },
		{ guard: isToBooleanExpressionSpecification, component: ToBooleanInputField },
		{ guard: isToColorExpressionSpecification, component: ToColorInputField },
		{ guard: isToNumberExpressionSpecification, component: ToNumberInputField },
		{ guard: isToStringExpressionSpecification, component: ToStringInputField },
		{ guard: isTypeofExpressionSpecification, component: TypeofInputField },
		{ guard: isLetExpressionSpecification, component: LetInputField },
		{ guard: isVarExpressionSpecification, component: VarInputField },
		{ guard: isZoomExpressionSpecification, component: ZoomInputField }
	];

	let {
		class: className,
		children,
		value,
		onChange,
		...props
	}: ExpressionInputFieldProps = $props();

	const entry = $derived(
		value ? dispatchers.find((dispatcher) => dispatcher.guard(value)) : undefined
	);
</script>

{#if value}
	{#if entry}
		{@const Field = entry.component}
		<Field {...props} class={className} {value} {onChange}>
			{@render children?.()}
		</Field>
	{:else}
		<div {...props} class={className}>
			{JSON.stringify(value)}
			{@render children?.()}
		</div>
	{/if}
{/if}
