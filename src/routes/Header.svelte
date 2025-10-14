<script lang="ts">
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';

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
console.log($page.data)
	function getInitial(): string {
		const u = $page.data.user;
		if (!u) return '';
		const name = (u.firstName || u.email || '').trim();
		return name ? name.charAt(0).toUpperCase() : 'U';
	}

	async function logout() {
		const res = await fetch('/api/auth/logout', { method: 'POST' });
		// Ensure Set-Cookie is applied before we refresh data and navigate
		await invalidateAll();
		await goto('/login', { replaceState: true });
	}
</script>

<header class="sticky top-0 z-40 w-full border-b bg-background">
	<div class="mx-auto w-full max-w-7xl px-4">
		<div class="flex h-14 items-center justify-between">
			<div class="flex items-center gap-6">
				<a href="/" class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">LOGO</a>
				<nav class="flex items-center gap-2">
					{#if $page.data.user}
						{#each links.filter((l) => l.href !== '/leads' || $page.data.user?.role === 'OWNER') as link}
							<a
								href={link.href}
								class={`${navigationMenuTriggerStyle()} relative h-14 px-3 text-sm font-semibold ${isActive(link.href) ? 'underline decoration-2 underline-offset-[14px]' : ''}`}
							>
								{link.label}
							</a>
						{/each}
					{/if}
				</nav>
			</div>

			<div class="flex items-center gap-3">
				{#if $page.data.user}
					<div class="flex size-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
						{getInitial()}
					</div>
					<button class="text-sm font-semibold underline underline-offset-4" on:click={logout}>Logout</button>
				{:else}
					<a href="/login" class="text-sm font-semibold underline underline-offset-4">Login</a>
					<a href="/signup" class="text-sm font-semibold underline underline-offset-4">Sign up</a>
				{/if}
			</div>
		</div>
	</div>
</header>
