<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<div class="animate-pulse rounded-xl border border-border bg-card p-5 space-y-4 {className}">
	<div class="flex items-center justify-between">
		<div class="h-4 w-1/3 rounded-sm bg-slate-200 dark:bg-slate-800"></div>
		<div class="size-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
	</div>
	<div class="h-6 w-1/2 rounded-sm bg-slate-200 dark:bg-slate-800"></div>
</div>
