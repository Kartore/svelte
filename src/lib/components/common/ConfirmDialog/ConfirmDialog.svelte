<script lang="ts">
	import { AlertDialog } from 'bits-ui';

	let {
		open = $bindable(false),
		title,
		description,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		danger = false,
		onConfirm
	}: {
		open?: boolean;
		title: string;
		description: string;
		confirmLabel?: string;
		cancelLabel?: string;
		danger?: boolean;
		onConfirm: () => void | Promise<void>;
	} = $props();

	const confirm = () => {
		open = false;
		void onConfirm();
	};
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Portal>
		<AlertDialog.Overlay class="fixed inset-0 z-50 bg-gray-950/35 backdrop-blur-[1px]" />
		<AlertDialog.Content
			class="fixed top-1/2 left-1/2 z-[60] w-[min(26rem,calc(100vw-1.5rem))] -translate-1/2 rounded-lg border border-gray-300 bg-white p-4 shadow-xl shadow-gray-950/20 outline-none"
		>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<AlertDialog.Title class="font-montserrat text-base font-semibold text-gray-950">
						{title}
					</AlertDialog.Title>
					<AlertDialog.Description class="text-xs leading-5 text-gray-500">
						{description}
					</AlertDialog.Description>
				</div>

				<div class="flex justify-end gap-2">
					<AlertDialog.Cancel
						class="h-9 cursor-pointer rounded-md px-3 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-gray-900"
					>
						{cancelLabel}
					</AlertDialog.Cancel>
					<AlertDialog.Action
						class={danger
							? 'h-9 cursor-pointer rounded-md bg-red-700 px-3 text-xs font-semibold text-white transition-colors hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700'
							: 'h-9 cursor-pointer rounded-md bg-gray-950 px-3 text-xs font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-950'}
						onclick={confirm}
					>
						{confirmLabel}
					</AlertDialog.Action>
				</div>
			</div>
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
