import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';
import { Color, createExpression } from '@maplibre/maplibre-gl-style-spec';

const PROBE_KEY = '__kartore_curve_x';

export type CurveOutputType = 'color' | 'number' | 'text';

export type CurveSample = {
	x: number;
	/** number for numeric curves, CSS color string for color curves */
	output: number | string;
};

export type CurveSamplingResult = {
	outputType: CurveOutputType;
	/** stop input positions declared in the expression */
	stops: number[];
	/** empty for 'text' curves — text is not sampled, use textOutputs instead */
	samples: CurveSample[];
	domain: [number, number];
	/** step segment labels in stop order, only set for outputType 'text' */
	textOutputs?: string[];
	/** curve input is ['zoom'] — enables the current-zoom marker in previews */
	inputIsZoom: boolean;
	/** evaluate the compiled expression at an arbitrary x — returns null on error */
	evaluateAt?: (x: number) => number | null;
};

const curveOperators = new Set(['interpolate', 'interpolate-hcl', 'interpolate-lab', 'step']);

const isColorLike = (output: unknown): boolean => {
	if (output instanceof Color) return true;
	if (typeof output !== 'string') return false;
	return Color.parse(output) !== undefined;
};

const detectOutputType = (outputs: unknown[]): CurveOutputType | null => {
	if (outputs.length === 0) return null;
	if (outputs.every((output) => typeof output === 'number')) return 'number';
	// expression outputs (arrays) may resolve to either type — only literal
	// outputs decide
	const literalOutputs = outputs.filter((output) => !Array.isArray(output));
	if (literalOutputs.length === 0) return null;
	if (literalOutputs.every(isColorLike)) return 'color';
	if (literalOutputs.every((output) => typeof output === 'string')) return 'text';
	return null;
};

const collectCurveStops = (
	expression: ExpressionSpecification
): { isStep: boolean; inputIndex: number; stops: number[]; outputs: unknown[] } | null => {
	const operator = expression[0];
	if (typeof operator !== 'string' || !curveOperators.has(operator)) return null;
	const isStep = operator === 'step';
	const inputIndex = isStep ? 1 : 2;

	const stops: number[] = [];
	const outputs: unknown[] = [];
	if (isStep) {
		outputs.push(expression[2]);
	}
	for (let i = 3; i + 1 < expression.length; i += 2) {
		const stopInput = expression[i];
		if (typeof stopInput !== 'number') return null;
		stops.push(stopInput);
		outputs.push(expression[i + 1]);
	}
	if (stops.length === 0) return null;
	return { isStep, inputIndex, stops, outputs };
};

/** true when the curve's stop outputs are colors — used to render color pickers on stop slots */
export const curveHasColorOutputs = (expression: ExpressionSpecification): boolean => {
	if (expression[0] === 'interpolate-hcl' || expression[0] === 'interpolate-lab') return true;
	const collected = collectCurveStops(expression);
	return collected !== null && detectOutputType(collected.outputs) === 'color';
};

/**
 * Samples an interpolate / step expression by MapLibre's own evaluator: the
 * curve input is swapped for a probed feature property, so the sampling is
 * exact (exponential bases, cubic-bezier, hcl/lab color spaces) regardless of
 * whether the original input was zoom, get, or line-progress.
 * Text outputs (step only) are not sampled — the literal stop outputs are
 * returned as textOutputs for a segmented preview.
 * Returns null when the expression is not a samplable curve or fails to
 * compile/evaluate (e.g. mid-edit states).
 */
export const sampleCurveExpression = (
	expression: ExpressionSpecification,
	sampleCount = 64,
	domainOverride?: [number, number]
): CurveSamplingResult | null => {
	const collected = collectCurveStops(expression);
	if (!collected) return null;
	const { isStep, inputIndex, stops, outputs } = collected;

	const outputType = detectOutputType(outputs);
	if (!outputType) return null;

	const inputArg = expression[inputIndex];
	const inputIsZoom = Array.isArray(inputArg) && inputArg[0] === 'zoom';

	const min = stops[0];
	const max = stops[stops.length - 1];
	// zoom curve はレイヤーの表示 zoom 範囲に合わせる (呼び出し側が domainOverride で指定)
	const domain: [number, number] =
		inputIsZoom && domainOverride
			? domainOverride
			: inputIsZoom
				? [Math.min(0, min), Math.max(24, max)]
				: (() => {
						const margin = isStep ? (max - min || 1) * 0.15 : 0;
						return [min - margin, max + margin];
					})();

	if (outputType === 'text') {
		// interpolate cannot output strings; a segmented preview needs every
		// output to be a literal label
		if (!isStep || !outputs.every((output) => typeof output === 'string')) return null;
		return { outputType, stops, samples: [], domain, textOutputs: outputs, inputIsZoom };
	}

	const probed = expression.map((part, index) =>
		index === inputIndex ? ['to-number', ['get', PROBE_KEY]] : part
	);
	const compiled = createExpression(probed, {
		type: outputType,
		'property-type': 'data-driven',
		expression: { interpolated: true, parameters: ['zoom', 'feature'] },
		transition: false,
		overridable: false
	} as Parameters<typeof createExpression>[1]);
	if (compiled.result === 'error') return null;

	const span = domain[1] - domain[0] || 1;
	const samples: CurveSample[] = [];
	try {
		for (let i = 0; i <= sampleCount; i++) {
			const x = domain[0] + (span * i) / sampleCount;
			const output: unknown = compiled.value.evaluate(
				{ zoom: 0 } as Parameters<typeof compiled.value.evaluate>[0],
				{
					type: 'Point',
					geometry: { type: 'Point', coordinates: [0, 0] },
					properties: { [PROBE_KEY]: x }
				} as unknown as Parameters<typeof compiled.value.evaluate>[1]
			);
			if (outputType === 'number') {
				if (typeof output !== 'number') return null;
				samples.push({ x, output });
			} else {
				if (!(output instanceof Color)) return null;
				samples.push({ x, output: String(output) });
			}
		}
	} catch {
		return null;
	}
	const evaluateAt =
		outputType === 'number'
			? (x: number): number | null => {
					try {
						const output = compiled.value.evaluate(
							{ zoom: 0 } as Parameters<typeof compiled.value.evaluate>[0],
							{
								type: 'Point',
								geometry: { type: 'Point', coordinates: [0, 0] },
								properties: { [PROBE_KEY]: x }
							} as unknown as Parameters<typeof compiled.value.evaluate>[1]
						);
						return typeof output === 'number' ? output : null;
					} catch {
						return null;
					}
				}
			: undefined;
	return { outputType, stops, samples, domain, inputIsZoom, evaluateAt };
};
