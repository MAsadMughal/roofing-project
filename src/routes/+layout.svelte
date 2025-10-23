<script lang="ts">
	import '../app.css';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import Header from './Header.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	// Generate breadcrumb segments from current path with friendly labels
	const segments = $derived(
		$page.url.pathname
			.split('/')
			.filter(Boolean)
			.map((segment, i, arr) => {
				// Map common paths to friendly names
				const friendlyNames: Record<string, string> = {
					'dashboard': 'Dashboard',
					'leads': 'Lead Management',
					'estimates': 'Estimates',
					'proposals': 'Proposals', 
					'jobs': 'Active Jobs',
					'members': 'Team Members',
					'rep': 'Sales Rep Portal',
					'settings': 'Settings',
					'profile': 'My Profile'
				};
				
				return {
					label: friendlyNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
					href: '/' + arr.slice(0, i + 1).join('/')
				};
			})
	);
</script>

<div class="app bg-slate-50 dark:bg-slate-900">
	<Header />

	{#if segments.length > 0}
		<div class="mx-auto w-full max-w-7xl px-6 py-4">
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link 
							href="/dashboard" 
							class="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
						>
							Home
						</Breadcrumb.Link>
					</Breadcrumb.Item>
					{#each segments as segment, i}
						<Breadcrumb.Separator class="text-slate-400 dark:text-slate-600" />
						<Breadcrumb.Item>
							{#if i === segments.length - 1}
								<Breadcrumb.Page 
									class="font-medium text-slate-800 dark:text-slate-200"
								>
									{segment.label}
								</Breadcrumb.Page>
							{:else}
								<Breadcrumb.Link 
									href={segment.href} 
									class="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
								>
									{segment.label}
								</Breadcrumb.Link>
							{/if}
						</Breadcrumb.Item>
					{/each}
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</div>
	{/if}

	<main class="mx-auto w-full max-w-7xl px-6 py-4">
		{@render children()}
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}
</style>
