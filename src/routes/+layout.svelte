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
