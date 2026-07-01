<script lang="ts">
	interface Props {
		progress: number;
		class?: string;
		showText?: boolean;
	}

	let { progress = 0, class: className = '', showText = false }: Props = $props();
	
	const pct = $derived(Math.min(100, Math.max(0, Number(progress) || 0)));
</script>

<div class="w-full space-y-1 {className}">
	{#if showText}
		<div class="flex items-center justify-between text-xs font-semibold text-muted-foreground">
			<span>Progress</span>
			<span>{pct}%</span>
		</div>
	{/if}
	<div class="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
		<div
			class="h-full rounded-full bg-primary transition-all duration-500 ease-out"
			style="width: {pct}%"
		></div>
	</div>
</div>
