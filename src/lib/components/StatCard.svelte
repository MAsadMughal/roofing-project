<script lang="ts">
	interface Props {
		label: string;
		value: string | number;
		icon?: any;
		colorClass?: string;
	}

	let { label, value, icon: Icon, colorClass = 'text-primary' }: Props = $props();
</script>

<div class="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
	<div class="flex items-start justify-between gap-2 min-w-0">
		<div class="min-w-0 flex-1 space-y-1">
			<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
			<p class="text-lg font-bold tracking-tight text-foreground truncate">{value}</p>
		</div>
		
		{#if Icon}
			<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
				<Icon class="size-4 {colorClass}" />
			</div>
		{/if}
	</div>
</div>
