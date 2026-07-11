type TextFieldKeyEvent = Pick<KeyboardEvent, 'isComposing' | 'key'>;

export const isTextFieldCommitKey = (event: TextFieldKeyEvent): boolean =>
	event.key === 'Enter' && !event.isComposing;

export const isTextFieldCancelKey = (event: TextFieldKeyEvent): boolean =>
	event.key === 'Escape' && !event.isComposing;
