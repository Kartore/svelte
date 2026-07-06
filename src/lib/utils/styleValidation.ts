import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import type { StyleSpecification } from 'maplibre-gl';

export type LayerValidationError = {
	/** 'paint.fill-color' のようなレイヤー内のプロパティパス。レイヤー直下のエラーでは '' */
	path: string;
	/** 'paint' | 'layout' | 'filter' など。レイヤー直下のエラーでは undefined */
	group?: string;
	/** 'fill-color' などのプロパティ名。グループ直下のエラーでは undefined */
	property?: string;
	message: string;
};

export type StyleValidationResult = {
	/** layer id ごとのエラー一覧 */
	layerErrors: Record<string, LayerValidationError[]>;
	/** レイヤーに紐づかないスタイル全体のエラーメッセージ */
	styleErrors: string[];
};

export const formatLayerValidationError = (error: LayerValidationError): string =>
	error.path ? `${error.path}: ${error.message}` : error.message;

// validateStyleMin のメッセージは "layers[3].paint.fill-color: ..." 形式
const layerErrorPattern = /^layers\[(\d+)\]\.?([^:]*):\s([\s\S]*)$/;

export const validateMapStyle = (style: StyleSpecification): StyleValidationResult => {
	const layerErrors: Record<string, LayerValidationError[]> = {};
	const styleErrors: string[] = [];

	for (const error of validateStyleMin(style)) {
		const match = layerErrorPattern.exec(error.message);
		const layerId = match ? style.layers[Number(match[1])]?.id : undefined;
		if (!match || layerId === undefined) {
			styleErrors.push(error.message);
			continue;
		}
		const path = match[2];
		// "paint.fill-color" / "filter[1]" などから配列インデックスを除いて分解する
		const [group, property] = path.split('.').map((segment) => segment.replace(/\[\d+\]/g, ''));
		(layerErrors[layerId] ??= []).push({
			path,
			group: group === '' ? undefined : group,
			property,
			message: match[3]
		});
	}

	return { layerErrors, styleErrors };
};
