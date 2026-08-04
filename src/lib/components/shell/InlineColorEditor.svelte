<script lang="ts">
	import { ColorChannelSlider } from '#lib/components/common/ColorField/ColorPicker/ColorChannelSlider';
	import { EyeDropperButton } from '#lib/components/common/ColorField/ColorPicker/EyeDropperButton';
	import { ColorSwatch } from '#lib/components/common/ColorField/ColorSwatch';
	import { tryParseColor, type Color } from '#lib/utils/color.ts';

	let {
		value,
		disabled = false,
		onChange
	}: {
		value: string;
		disabled?: boolean;
		onChange: (value: string) => void;
	} = $props();

	const color = $derived(tryParseColor(value));
	let hexDraft = $derived(color?.toString('hex').replace(/^#/, '').toUpperCase() ?? '');
	const commit = (next: Color | null) => {
		if (!disabled && next) onChange(next.toString('rgba'));
	};
	const commitHex = () => {
		const next = tryParseColor(hexDraft.startsWith('#') ? hexDraft : `#${hexDraft}`);
		if (!next) {
			hexDraft = color?.toString('hex').replace(/^#/, '').toUpperCase() ?? '';
			return;
		}
		commit(next.withChannelValue('alpha', color?.getChannelValue('alpha') ?? 1));
	};
	const channelValue = (channel: 'hue' | 'saturation' | 'lightness'): number => {
		if (!color) return 0;
		const raw = color.toFormat('hsl').getChannelValue(channel);
		return Math.round(channel === 'hue' || raw > 1 ? raw : raw * 100);
	};
</script>

<fieldset {disabled} class="flex flex-col disabled:opacity-60">
	<div class="mb-2 flex items-center gap-1.5">
		<ColorSwatch class="h-6 min-w-0 flex-1 rounded-[5px] border border-black/5" color={value} />
		<input
			class="h-6 w-[70px] rounded-[5px] border-0 bg-field px-2 font-mono text-[11px] font-normal text-ink-1 outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)]"
			aria-label="16進数カラー値"
			bind:value={hexDraft}
			onblur={commitHex}
			onkeydown={(event) => {
				if (event.key === 'Enter') commitHex();
				if (event.key === 'Escape')
					hexDraft = color?.toString('hex').replace(/^#/, '').toUpperCase() ?? '';
			}}
		/>
		<EyeDropperButton
			class="flex size-6 shrink-0 items-center justify-center rounded-[5px] bg-field text-ink-2 hover:text-ink-1"
			aria-label="スポイト"
			onChange={commit}
		/>
	</div>
	{#if color}
		{#each [{ label: 'H', channel: 'hue' as const }, { label: 'S', channel: 'saturation' as const }, { label: 'L', channel: 'lightness' as const }] as item (item.channel)}
			<div class="mb-1.5 flex items-center gap-2 text-[9px] text-ink-3">
				<span>{item.label}</span>
				<div class="min-w-0 flex-1 [&>div]:h-1.5 [&>div]:border-0">
					<ColorChannelSlider
						label={item.label}
						channel={item.channel}
						value={color.toFormat('hsl')}
						onChange={commit}
					/>
				</div>
				<b class="w-6 text-right font-mono font-normal text-ink-1">
					{channelValue(item.channel)}
				</b>
			</div>
		{/each}
	{/if}
</fieldset>
