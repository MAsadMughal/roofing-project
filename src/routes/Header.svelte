<script lang="ts">
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
	import { page } from '$app/stores';

	const links = [
		{ label: 'DASHBOARD', href: '/' },
		{ label: 'LEADS', href: '/leads' },
		{ label: 'ESTIMATES', href: '/estimates' },
		{ label: 'PROPOSALS', href: '/proposals' },
		{ label: 'JOBS', href: '/jobs' }
	];

	function isActive(path: string) {
		return $page.url.pathname === path;
	}
</script>

<header class="sticky top-0 z-40 w-full border-b bg-background">
	<div class="mx-auto w-full max-w-7xl px-4">
		<div class="flex h-14 items-center justify-between">
			<div class="flex items-center gap-6">
				<a href="/" class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">LOGO</a>
				<nav class="flex items-center gap-2">
					{#each links as link}
						<a
							href={link.href}
							class={`${navigationMenuTriggerStyle()} relative h-14 px-3 text-sm font-semibold ${isActive(link.href) ? 'underline decoration-2 underline-offset-[14px]' : ''}`}
						>
							{link.label}
						</a>
					{/each}
				</nav>
			</div>

			<div class="flex items-center gap-3">
				<div class="flex size-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
					A
				</div>
			</div>
		</div>
	</div>
</header>
