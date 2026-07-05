<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	import { Button } from '$lib/components/common/Button';
	import { ColorizeIcon } from '$lib/components/icons';
	import { parseColor, type Color } from '$lib/utils/color';
	import { cn } from '$lib/utils/tailwindUtil';

	let {
		class: className,
		onChange,
		...props
	}: Omit<HTMLButtonAttributes, 'onchange' | 'children'> & {
		onChange?: (color: Color) => void;
	} = $props();

	let isEyeDropperSupported = $state(false);

	const handleClick = () => {
		if (!window || !window.EyeDropper) {
			return;
		}
		const eyeDropper = new window.EyeDropper();
		eyeDropper
			.open()
			.then(({ sRGBHex }) => {
				if (!sRGBHex) {
					isEyeDropperSupported = false;
					throw new Error(`Invalid eyeDropper Format: ${sRGBHex}`);
				}
				const parsedColor = parseColor(sRGBHex);
				onChange?.(parsedColor);
			})
			.catch((e) => {
				console.error(e);
			});
	};

	$effect(() => {
		if (!window || !window.EyeDropper) {
			return;
		}
		isEyeDropperSupported = true;
	});
</script>

{#if isEyeDropperSupported}
	<Button {...props} class={cn('', className)} onclick={handleClick}>
		<ColorizeIcon class="h-full w-full" />
	</Button>
{/if}
