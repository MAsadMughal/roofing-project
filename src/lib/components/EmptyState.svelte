<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		title: string;
		description?: string;
		icon?: any; // Component type for Lucide Icon
		children?: Snippet;
	}

	let { title, description = '', icon: Icon, children }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center py-12 px-4 text-center">
	{#if Icon}
		<div class="mb-4 flex size-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
			<Icon class="size-6 text-slate-400 dark:text-slate-500" />
		</div>
	{/if}
	
	<h3 class="text-base font-semibold text-slate-800 dark:text-slate-200">
		{title}
	</h3>
	
	{#if description}
		<p class="mt-1 max-w-sm text-sm text-muted-foreground">
			{description}
		</p>
	{/if}
	
	{#if children}
		<div class="mt-4">
			{@render children()}
		</div>
	{/if}
</div>
