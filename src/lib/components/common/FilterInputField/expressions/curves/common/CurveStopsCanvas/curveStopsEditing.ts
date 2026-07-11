import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

export type CurveInputBounds = { min: number; max: number };

const normalizeZero = (value: number): number => (Object.is(value, -0) ? 0 : value);
const roundToTenth = (value: number): number => normalizeZero(Number(value.toFixed(1)));
const ceilToTenth = (value: number): number => normalizeZero(Math.ceil(value * 10 - 1e-9) / 10);
const floorToTenth = (value: number): number => normalizeZero(Math.floor(value * 10 + 1e-9) / 10);

export const curveStopInputIndex = (stopIndex: number): number => 3 + stopIndex * 2;

export const roundCurveInput = (value: number): number => {
	return roundToTenth(value);
};

export const getCurveInputBounds = (
	expression: ExpressionSpecification,
	stopIndex: number,
	domain: [number, number]
): CurveInputBounds | null => {
	const inputIndex = curveStopInputIndex(stopIndex);
	const previousInput = stopIndex > 0 ? expression[inputIndex - 2] : undefined;
	const nextInput = inputIndex + 2 < expression.length ? expression[inputIndex + 2] : undefined;
	const min = ceilToTenth(typeof previousInput === 'number' ? previousInput + 0.1 : domain[0]);
	const max = floorToTenth(typeof nextInput === 'number' ? nextInput - 0.1 : domain[1]);
	return min <= max ? { min, max } : null;
};

export const clampCurveInput = (value: number, bounds: CurveInputBounds): number => {
	return Math.min(bounds.max, Math.max(bounds.min, roundCurveInput(value)));
};

export const roundToSignificantFigures = (value: number, figures: number): number => {
	if (!Number.isFinite(value) || value === 0) return value;
	const scale = 10 ** (figures - 1 - Math.floor(Math.log10(Math.abs(value))));
	return Math.round(value * scale) / scale;
};

export const getCurveOutputStep = (outputSpan: number): number => {
	return roundToSignificantFigures((outputSpan || 1) / 100, 2);
};

export const roundCurveOutput = (value: number, outputSpan: number): number => {
	const step = getCurveOutputStep(outputSpan);
	if (!Number.isFinite(step) || step <= 0) return value;
	const exponent = Math.floor(Math.log10(step));
	const decimalPlaces = Math.max(0, 1 - exponent);
	return Number((Math.round(value / step) * step).toFixed(Math.min(12, decimalPlaces)));
};
