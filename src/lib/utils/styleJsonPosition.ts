import { jsonLanguage } from '@codemirror/lang-json';

const decodeJsonString = (value: string): string | null => {
	try {
		const decoded: unknown = JSON.parse(value);
		return typeof decoded === 'string' ? decoded : null;
	} catch {
		return null;
	}
};

/**
 * Finds the selected layer's id value inside the top-level `layers` array.
 * The CodeMirror parser keeps this useful while the surrounding draft is
 * temporarily incomplete, without mistaking nested `id` values for layers.
 */
export const findStyleLayerIdPosition = (text: string, layerId: string): number | null => {
	const documentObject = jsonLanguage.parser.parse(text).topNode.getChild('Object');
	if (!documentObject) return null;

	for (let property = documentObject.firstChild; property; property = property.nextSibling) {
		if (property.name !== 'Property') continue;
		const propertyName = property.getChild('PropertyName');
		if (
			!propertyName ||
			decodeJsonString(text.slice(propertyName.from, propertyName.to)) !== 'layers'
		) {
			continue;
		}
		const layersArray = property.getChild('Array');
		if (!layersArray) return null;

		for (let layer = layersArray.firstChild; layer; layer = layer.nextSibling) {
			if (layer.name !== 'Object') continue;
			for (let property = layer.firstChild; property; property = property.nextSibling) {
				if (property.name !== 'Property') continue;
				const propertyName = property.getChild('PropertyName');
				if (
					!propertyName ||
					decodeJsonString(text.slice(propertyName.from, propertyName.to)) !== 'id'
				) {
					continue;
				}

				const idValue = property.getChild('String');
				if (idValue && decodeJsonString(text.slice(idValue.from, idValue.to)) === layerId) {
					return idValue.from;
				}
			}
		}

		return null;
	}

	return null;
};
