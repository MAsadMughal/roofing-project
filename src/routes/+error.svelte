<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	export let status: number | null = null; // optional, pass the HTTP status if available
	export let message: string | null = null; // optional custom message
	import { afterNavigate } from '$app/navigation';
	let canGoBack = false;

	// Check if history length allows going back
	afterNavigate(() => {
		canGoBack = history.length > 1;
	});

	function goBack() {
		if (history.length > 1) history.back();
		else window.location.href = '/'; // fallback
	}
</script>

<section
	class="flex min-h-screen items-center justify-center bg-white transition-colors dark:bg-slate-900"
>
	<Card class="mx-4 w-full max-w-2xl rounded-2xl shadow-lg">
		<CardContent class="p-10 md:p-12">
			<div class="flex flex-col items-center gap-8 md:flex-row">
				<div
					class="flex-shrink-0 text-6xl leading-none font-extrabold text-slate-800 md:text-7xl dark:text-slate-100"
				>
					<span class="block">404</span>
				</div>

				<div class="flex-1">
					<h1 class="text-2xl font-semibold text-slate-900 md:text-3xl dark:text-white">
						Page not found
					</h1>
					<p class="mt-2 text-sm text-slate-600 md:text-base dark:text-slate-300">
						{#if message}
							{@html message}
						{:else}
							The page you are looking for doesn't exist or has been moved.
						{/if}
					</p>

					<div class="mt-6 flex flex-wrap gap-3">
						<!-- Back button: adjust href to your router usage (sveltekit uses <a href="/">) -->
						<Button
							class="inline-flex items-center gap-2"
							onclick={goBack}
							disabled={!canGoBack}
							variant="outline"
						>
							<ArrowLeft class="h-4 w-4" />
							Go Back 
						</Button>

						<a href="/support" class="inline-flex">
							<Button variant="ghost">Contact support</Button>
						</a>
					</div>

					{#if status}
						<p class="mt-4 text-xs text-slate-500 dark:text-slate-400">Error code: {status}</p>
					{/if}
				</div>
			</div>
		</CardContent>
	</Card>
</section>

<style>
	/* Minimal extra styling (use Tailwind for most) */
	:global(.card) {
		/* if your shadcn Card adds these classes, keep this block empty */
	}
</style>
