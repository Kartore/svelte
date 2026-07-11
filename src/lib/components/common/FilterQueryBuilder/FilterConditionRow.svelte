<script lang="ts">
	import type { SelectItem } from '$lib/components/common/Select';
	import { Button } from '$lib/components/common/Button';
	import { ComboBox } from '$lib/components/common/ComboBox';
	import { useExpressionSuggestions } from '$lib/components/common/FilterInputField/expressions/common/ExpressionSuggestionsContext';
	import { Select } from '$lib/components/common/Select';
	import { TextField } from '$lib/components/common/TextField';
	import { CloseIcon } from '$lib/components/icons';

	import type { FilterConditionNode, FilterSubject } from './model.ts';

	type FilterOperator =
		'==' | '!=' | '<' | '<=' | '>' | '>=' | 'exists' | 'not-exists' | 'in' | 'not-in';

	let {
		node,
		onChange,
		onRemove
	}: {
		node: FilterConditionNode;
		onChange: (node: FilterConditionNode) => void;
		onRemove?: () => void;
	} = $props();

	const getSuggestions = useExpressionSuggestions();
	const suggestions = $derived(getSuggestions());
	const subject = $derived<FilterSubject>(
		node.kind === 'exists' ? { kind: 'property', key: node.key } : node.subject
	);
	const propertyItems = $derived<SelectItem[]>(
		(suggestions?.propertyKeys ?? []).map(({ name }) => ({
			value: `property:${encodeURIComponent(name)}`,
			label: name
		}))
	);
	const fixedSubjectItems: SelectItem[] = [
		{ value: 'subject:geometry-type', label: 'geometry-type' },
		{ value: 'subject:id', label: 'feature id' },
		{ value: 'subject:zoom', label: 'zoom' }
	];
	const subjectItems = $derived(
		node.kind === 'exists' ? propertyItems : [...propertyItems, ...fixedSubjectItems]
	);

	const subjectLabel = (value: FilterSubject): string => {
		switch (value.kind) {
			case 'property':
				return value.key;
			case 'geometry-type':
				return 'geometry-type';
			case 'id':
				return 'feature id';
			case 'zoom':
				return 'zoom';
		}
	};
	const subjectValue = (value: FilterSubject): string => {
		return value.kind === 'property'
			? `property:${encodeURIComponent(value.key)}`
			: `subject:${value.kind}`;
	};
	const parseSubjectValue = (value: string): FilterSubject => {
		if (value.startsWith('property:')) {
			return { kind: 'property', key: decodeURIComponent(value.slice('property:'.length)) };
		}
		switch (value) {
			case 'subject:geometry-type':
				return { kind: 'geometry-type' };
			case 'subject:id':
				return { kind: 'id' };
			case 'subject:zoom':
				return { kind: 'zoom' };
			default:
				return { kind: 'property', key: value };
		}
	};
	const parseSubjectText = (value: string): FilterSubject => {
		if (node.kind === 'exists') return { kind: 'property', key: value };
		switch (value) {
			case 'geometry-type':
				return { kind: 'geometry-type' };
			case 'feature id':
				return { kind: 'id' };
			case 'zoom':
				return { kind: 'zoom' };
			default:
				return { kind: 'property', key: value };
		}
	};

	let subjectDraft = $derived(subjectLabel(subject));
	let comparisonDraft = $derived(node.kind === 'comparison' ? String(node.value) : '');
	let membershipDraft = $state('');

	const operator = $derived<FilterOperator>(
		node.kind === 'comparison'
			? node.op
			: node.kind === 'exists'
				? node.negated
					? 'not-exists'
					: 'exists'
				: node.negated
					? 'not-in'
					: 'in'
	);
	const operatorItems: SelectItem[] = [
		{ value: '==', label: '==' },
		{ value: '!=', label: '!=' },
		{ value: '<', label: '<' },
		{ value: '<=', label: '<=' },
		{ value: '>', label: '>' },
		{ value: '>=', label: '>=' },
		{ value: 'exists', label: 'exists' },
		{ value: 'not-exists', label: 'not exists' },
		{ value: 'in', label: 'in' },
		{ value: 'not-in', label: 'not in' }
	];

	const valueSuggestions = $derived<(string | number | boolean)[]>(
		subject.kind === 'property'
			? (suggestions?.getValueSuggestions(subject.key) ?? [])
			: subject.kind === 'geometry-type'
				? ['Point', 'LineString', 'Polygon']
				: []
	);
	const membershipSuggestions = $derived(
		valueSuggestions.filter((value): value is string | number => typeof value !== 'boolean')
	);
	const expectedType = $derived(
		subject.kind === 'zoom'
			? 'number'
			: subject.kind === 'geometry-type'
				? 'string'
				: subject.kind === 'property'
					? suggestions?.propertyKeys.find(({ name }) => name === subject.key)?.type?.toLowerCase()
					: undefined
	);

	const parseValue = (
		text: string,
		current?: string | number | boolean
	): string | number | boolean => {
		const suggested = valueSuggestions.find((value) => String(value) === text);
		if (suggested !== undefined) return suggested;
		if (expectedType === 'boolean' || typeof current === 'boolean') {
			if (text === 'true') return true;
			if (text === 'false') return false;
		}
		if (expectedType === 'number' || typeof current === 'number') {
			const number = Number(text);
			if (text.trim() !== '' && Number.isFinite(number)) return number;
		}
		return text;
	};

	const commitSubject = (nextSubject: FilterSubject) => {
		if (node.kind === 'exists') {
			const key = nextSubject.kind === 'property' ? nextSubject.key : node.key;
			if (key === node.key) return;
			onChange({ ...node, key });
			return;
		}
		if (
			node.subject.kind === nextSubject.kind &&
			(node.subject.kind !== 'property' ||
				(nextSubject.kind === 'property' && node.subject.key === nextSubject.key))
		) {
			return;
		}
		onChange({ ...node, subject: nextSubject });
	};
	const changeOperator = (next: FilterOperator) => {
		if (next === operator) return;
		if (next === 'exists' || next === 'not-exists') {
			if (node.kind === 'exists') {
				onChange({ ...node, negated: next === 'not-exists' });
				return;
			}
			onChange({
				kind: 'exists',
				negated: next === 'not-exists',
				key: subject.kind === 'property' ? subject.key : (propertyItems[0]?.label ?? '')
			});
			return;
		}
		if (next === 'in' || next === 'not-in') {
			if (node.kind === 'membership') {
				onChange({ ...node, negated: next === 'not-in' });
				return;
			}
			onChange({ kind: 'membership', negated: next === 'not-in', subject, values: [] });
			return;
		}
		if (node.kind === 'comparison') {
			onChange({ ...node, op: next });
			return;
		}
		onChange({ kind: 'comparison', op: next, subject, value: '' });
	};
	const addMembershipValue = (text: string) => {
		if (node.kind !== 'membership' || text === '') return;
		const value = parseValue(text);
		if (typeof value === 'boolean') return;
		onChange({ ...node, values: [...node.values, value] });
		membershipDraft = '';
	};
</script>

<div class="grid grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)_20px] items-start gap-1">
	<ComboBox
		aria-label="Filter subject"
		class="min-w-0 font-mono"
		triggerClass="w-full min-w-0 font-mono font-normal"
		items={subjectItems}
		value={subjectValue(subject)}
		inputValue={subjectDraft}
		allowsCustomValue
		onInputChange={(value) => (subjectDraft = value)}
		onCommit={(value) => commitSubject(parseSubjectText(value))}
		onValueChange={(value) => commitSubject(parseSubjectValue(value))}
	/>
	<Select
		aria-label="Filter operator"
		class="min-w-0 font-mono"
		triggerClass="w-full min-w-0 font-mono font-normal"
		items={operatorItems}
		value={operator}
		onValueChange={(value) => changeOperator(value as FilterOperator)}
	/>
	{#if node.kind === 'comparison'}
		<TextField
			aria-label="Filter value"
			class="min-w-0 font-mono [&>input]:w-full [&>input]:font-normal"
			value={comparisonDraft}
			suggestions={valueSuggestions}
			onValueChange={(value) => (comparisonDraft = value)}
			onCommit={(value) => {
				const nextValue = parseValue(value, node.value);
				if (nextValue !== node.value) onChange({ ...node, value: nextValue });
			}}
		/>
	{:else if node.kind === 'membership'}
		<div class="flex min-h-7 min-w-0 flex-wrap items-center gap-1 rounded bg-gray-100 px-1 py-0.5">
			{#each node.values as value, index (index)}
				<span
					class="flex max-w-full items-center rounded bg-white px-1 font-mono text-xs text-gray-600"
				>
					<span class="truncate">{value}</span>
					<Button
						aria-label={`Remove ${value}`}
						class="ml-0.5 rounded text-gray-400 hover:text-red-500"
						onclick={() => {
							if (node.kind !== 'membership') return;
							onChange({
								...node,
								values: node.values.filter((_, valueIndex) => valueIndex !== index)
							});
						}}
					>
						<CloseIcon class="h-3 w-3 fill-current" />
					</Button>
				</span>
			{/each}
			<TextField
				aria-label="Add filter value"
				class="min-w-16 flex-1 font-mono [&>input]:w-full [&>input]:bg-transparent [&>input]:px-1 [&>input]:font-normal"
				value={membershipDraft}
				suggestions={membershipSuggestions}
				onValueChange={(value) => (membershipDraft = value)}
				onCommit={addMembershipValue}
			/>
		</div>
	{:else}
		<div class="px-2 py-1 text-center text-sm text-gray-400">—</div>
	{/if}
	<Button
		aria-label="Remove filter condition"
		class="mt-1 rounded text-gray-400 hover:text-red-500"
		onclick={onRemove}
	>
		<CloseIcon class="h-4 w-4 fill-current" />
	</Button>
</div>
