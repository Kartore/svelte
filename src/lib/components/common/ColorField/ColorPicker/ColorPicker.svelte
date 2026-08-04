<script lang="ts">
	import { Check, X } from 'phosphor-svelte';

	import { Button } from '#lib/components/common/Button';
	import { ColorArea } from '#lib/components/common/ColorField/ColorPicker/ColorArea';
	import { ColorChannelField } from '#lib/components/common/ColorField/ColorPicker/ColorChannelField';
	import { ColorChannelSlider } from '#lib/components/common/ColorField/ColorPicker/ColorChannelSlider';
	import { EyeDropperButton } from '#lib/components/common/ColorField/ColorPicker/EyeDropperButton';
	import { ColorSwatch } from '#lib/components/common/ColorField/ColorSwatch';
	import { RowPopover } from '#lib/components/common/RowPopover';
	import { useStyleVariables } from '#lib/contexts/styleVariables.svelte.ts';
	import { tryParseColor, type Color } from '#lib/utils/color';
	import { cn } from '#lib/utils/tailwindUtil';

	let {
		class: className,
		value,
		onChange,
		onPickVariable,
		onPromoteColor,
		'aria-label': ariaLabel
	}: {
		class?: string;
		value?: Color | null;
		onChange?: (color: Color) => void;
		onPickVariable?: (variableId: string) => void;
		onPromoteColor?: () => void;
		'aria-label'?: string;
	} = $props();

	const variables = useStyleVariables();
	let variableSearch = $state('');
	const colorVariables = $derived(
		(variables?.variables ?? [])
			.filter((variable) => variable.type === 'color')
			.filter((variable) =>
				variable.name.toLocaleLowerCase().includes(variableSearch.trim().toLocaleLowerCase())
			)
	);
	const hexValue = $derived(value?.toString('hex').replace(/^#/, '').toUpperCase() ?? '');

	const handleChange = (color: Color | null) => {
		if (color) onChange?.(color);
	};
	const commitHex = (input: HTMLInputElement) => {
		const parsed = tryParseColor(input.value.startsWith('#') ? input.value : `#${input.value}`);
		if (parsed)
			handleChange(parsed.withChannelValue('alpha', value?.getChannelValue('alpha') ?? 1));
		else input.value = hexValue;
	};
</script>

<div class={cn('h-4 w-4', className)}>
	<RowPopover
		aria-label={ariaLabel ?? 'カラー'}
		triggerClass="h-full w-full overflow-hidden rounded-[4px] border border-black/5 hover:shadow-[inset_0_0_0_1px_var(--color-accent)] focus-visible:outline-2 focus-visible:outline-accent"
		contentClass="shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
		onOpenChange={(open) => {
			if (!open) variableSearch = '';
		}}
	>
		{#snippet trigger()}
			<ColorSwatch color={value ?? undefined} class="block h-full w-full" />
		{/snippet}

		{#snippet children({ close })}
			<div class="flex h-10 items-center gap-2 border-b border-hairline-soft pr-1.5 pl-3">
				<span class="text-[11.5px] font-semibold text-ink-1">カラー</span>
				{#if ariaLabel && ariaLabel !== 'カラー'}
					<span class="truncate font-mono text-[11px] text-ink-2">{ariaLabel}</span>
				{/if}
				<Button
					class="ml-auto flex size-[26px] shrink-0 items-center justify-center rounded-[5px] text-ink-3 hover:bg-field hover:text-ink-1 focus-visible:outline-none"
					aria-label="カラーピッカーを閉じる"
					onclick={close}
				>
					<X size={14} weight="regular" aria-hidden="true" />
				</Button>
			</div>

			<div class="px-3 pt-2.5 pb-3">
				<ColorArea
					class="h-[136px] w-full rounded-[6px]"
					value={value?.toFormat('hsb')}
					xChannel="saturation"
					yChannel="brightness"
					aria-label="カラー"
					onChange={handleChange}
				/>
				<div class="mt-2.5 mb-2.5 flex items-center gap-2.5">
					<EyeDropperButton
						class="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-field p-1.5 text-ink-2 hover:text-ink-1"
						aria-label="スポイト"
						onChange={handleChange}
					/>
					<div class="flex min-w-0 flex-1 flex-col gap-2">
						<ColorChannelSlider
							label="色相"
							channel="hue"
							value={value?.toFormat('hsl')}
							onChange={handleChange}
						/>
						<ColorChannelSlider
							label="不透明度"
							channel="alpha"
							value={value?.toFormat('rgba')}
							onChange={handleChange}
						/>
					</div>
				</div>
				<div class="flex h-6 min-w-0 gap-1.5 font-mono text-[11px] text-ink-1">
					<span class="flex shrink-0 items-center rounded-[5px] bg-field px-2">
						Hex <span class="ml-1 text-[8px] text-ink-3">▾</span>
					</span>
					<input
						class="min-w-0 flex-1 rounded-[5px] border-0 bg-field px-2 outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]"
						aria-label="16進数カラー値"
						value={hexValue}
						onblur={(event) => commitHex(event.currentTarget)}
						onkeydown={(event) => {
							if (event.key === 'Enter') commitHex(event.currentTarget);
						}}
					/>
					<ColorChannelField
						class="w-[52px] shrink-0 overflow-hidden rounded-[5px] [&>input]:h-6 [&>input]:font-mono [&>input]:font-normal"
						label="不透明度"
						channel="alpha"
						value={value?.toFormat('rgb')}
						onChange={handleChange}
					/>
				</div>
			</div>

			{#if colorVariables.length > 0 || onPromoteColor}
				<div class="border-t border-hairline-soft px-3 pt-2.5 pb-3">
					<p class="mb-1.5 text-[10px] text-ink-3">変数</p>
					{#if variables && variables.variables.some((variable) => variable.type === 'color')}
						<input
							type="search"
							class="mb-1.5 h-[26px] w-full rounded-[6px] border-0 bg-field px-2 text-[11px] text-ink-1 outline-none placeholder:text-ink-3"
							aria-label="カラー変数を検索"
							placeholder="検索"
							bind:value={variableSearch}
						/>
					{/if}
					{#each colorVariables as variable (variable.id)}
						<Button
							class="flex h-7 w-full items-center gap-2 rounded-[5px] px-1.5 text-left hover:bg-field disabled:text-ink-4"
							disabled={!onPickVariable}
							onclick={() => {
								onPickVariable?.(variable.id);
								close();
							}}
						>
							<ColorSwatch
								class="size-3.5 shrink-0 rounded-[4px] border border-black/5"
								color={variable.value}
							/>
							<span class="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-1">
								{variable.name}
							</span>
							{#if value?.toString('hexa') === tryParseColor(variable.value)?.toString('hexa')}
								<Check size={12} weight="regular" class="text-accent" aria-hidden="true" />
							{/if}
						</Button>
					{/each}
					{#if onPromoteColor}
						<Button
							class="mt-1.5 h-6 w-full px-1.5 text-left text-[10.5px] font-semibold text-accent hover:bg-accent-soft"
							onclick={() => {
								onPromoteColor();
								close();
							}}
						>
							＋ この色を変数に昇格
						</Button>
					{/if}
				</div>
			{/if}
		{/snippet}
	</RowPopover>
</div>
