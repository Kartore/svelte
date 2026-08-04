export const isPropertyCatalogInsertKey = ({
	key,
	isComposing
}: Pick<KeyboardEvent, 'key' | 'isComposing'>): boolean => key === 'Enter' && !isComposing;
