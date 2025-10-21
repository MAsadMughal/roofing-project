<script lang="ts">
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
	import { navigating, page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { fade } from 'svelte/transition';
	import { UserRound, Key, LogOut, UserPlus, ListOrdered, Sun, Moon } from '@lucide/svelte/icons';

	let isDark = false;

	function applyTheme(theme: 'light' | 'dark') {
		const root = document.documentElement;
		if (theme === 'dark') {
			root.classList.add('dark');
			root.style.colorScheme = 'dark';
			isDark = true;
		} else {
			root.classList.remove('dark');
			root.style.colorScheme = 'light';
			isDark = false;
		}
		try {
			localStorage.setItem('theme', theme);
		} catch (e) {}
	}

	function toggleTheme() {
		applyTheme(isDark ? 'light' : 'dark');
	}

	const links = [
		{ label: 'DASHBOARD', href: '/' },
		{ label: 'LEADS', href: '/leads', ownerOnly: true },
		{ label: 'SALES REP', href: '/rep', repOnly: true },
		{ label: 'ESTIMATES', href: '/estimates' },
		{ label: 'PROPOSALS', href: '/proposals' },
		{ label: 'JOBS', href: '/jobs' },
		{ label: 'MEMBERS', href: '/members', ownerOnly: true }
	];

	function isActive(path: string) {
		return $page.url.pathname === path;
	}
	console.log($page.data);
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

<header
	class="sticky top-0 z-40 w-full border-b border-slate-200 font-sans shadow-sm backdrop-blur-md transition-all "
>
	<div class="mx-auto w-full  px-4">
		<div class="flex h-16 items-center justify-between">
			<!-- Left: Logo + Nav -->
			<div class="flex items-center gap-6">
				<img
					alt="Company Logo"
					src="https://dcassetcdn.com/design_img/3656568/47349/47349_20884214_3656568_d2aa512e_image.png"
					class="h-10 w-auto drop-shadow-sm"
				/>

				<nav class="hidden items-center gap-5 md:flex">
					{#if $page.data.user}
						{#each links.filter((l) => (!l.ownerOnly || $page.data.user?.role === 'OWNER') && (!l.repOnly || $page.data.user?.role === 'REP')) as link}
							<a
								href={link.href}
								class={`relative px-3 py-2 text-[15px] font-medium tracking-wide transition-all hover:text-indigo-400 ${
									isActive(link.href)
										? 'font-semibold text-indigo-400 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-gradient-to-r after:from-indigo-400 after:to-violet-400 after:content-[""]'
										: 'text-slate-600 dark:text-slate-200 hover:text-indigo-400'
								}`}
							>
								{link.label}
							</a>
						{/each}
					{/if}
				</nav>
			</div>

			<!-- Right: Actions -->
			<div class="flex items-center gap-3">
				<button
					aria-label="Toggle theme"
					onclick={toggleTheme}
					class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
				>
					{#if isDark}
						<Sun class="h-4 w-4" />
					{:else}
						<Moon class="h-4 w-4" />
					{/if}
				</button>
				{#if $page.data.user}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<div
									{...props}
									class="flex size-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white shadow-md transition-transform select-none hover:scale-105 active:scale-95"
								>
									{getInitial()}
								</div>
							{/snippet}
						</DropdownMenu.Trigger>

						<DropdownMenu.Content
							class="min-w-56 rounded-xl border border-slate-200 bg-white/90 shadow-lg backdrop-blur-md"
							align="end"
						>
							<DropdownMenu.Label class="mb-1 font-semibold text-slate-800"
								>My Account</DropdownMenu.Label
							>
							<DropdownMenu.Group>
								<DropdownMenu.Item
									class="flex items-center gap-2 text-slate-700 hover:text-indigo-600"
								>
									<UserRound class="h-4 w-4 text-slate-500" />
									<span>View Profile</span>
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() => goto('/change-password')}
									class="flex items-center gap-2 text-slate-700 hover:text-indigo-600"
								>
									<Key class="h-4 w-4 text-slate-500" />
									<span>Change Password</span>
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() => logout()}
									class="flex items-center gap-2 text-red-600 hover:text-red-700"
								>
									<LogOut class="h-4 w-4" />
									<span>Sign Out</span>
								</DropdownMenu.Item>
							</DropdownMenu.Group>

							<DropdownMenu.Separator class="my-1 border-slate-200" />

							<DropdownMenu.Group>
								<DropdownMenu.Label class="mb-1 font-semibold text-slate-800"
									>Organization</DropdownMenu.Label
								>
								<DropdownMenu.Item
									onclick={() => goto('/members')}
									class="flex items-center gap-2 text-slate-700 hover:text-indigo-600"
								>
									<UserPlus class="h-4 w-4 text-slate-500" />
									<span>Invite Members</span>
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() => goto('/leads')}
									class="flex items-center gap-2 text-slate-700 hover:text-indigo-600"
								>
									<ListOrdered class="h-4 w-4 text-slate-500" />
									<span>View Assigned Leads</span>
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{:else}
					<Button href="/login" class="bg-indigo-600 cursor-pointer text-white hover:bg-indigo-500">Login</Button>
					<Button href="/signup" variant="outline" class="border-indigo-600 cursor-pointer hover:bg-transparent hover:text-indigo-600 text-indigo-600 ">
						Signup
					</Button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Page Loading Bar -->
	{#if $navigating}
		<div class="progress-line" transition:fade></div>
	{:else}
		<div class="progress-line complete" transition:fade></div>
	{/if}
</header>

<style>
	.progress-line {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 3px;
		background-color: #007aff;
		width: 0;
		animation: progress 1.4s ease-in-out forwards;
	}

	@keyframes progress {
		0% {
			width: 0;
		}
		100% {
			width: 100%;
		}
	}

	.complete {
		animation: none;
		width: 100%;
		opacity: 1;
		animation: fadeOut 0.5s ease 0.1s forwards;
	}

	@keyframes fadeOut {
		to {
			opacity: 0;
		}
	}
</style>
