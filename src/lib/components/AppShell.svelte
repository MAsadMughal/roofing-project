<script lang="ts">
	import { page, navigating } from '$app/stores';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import Sidebar from './Sidebar.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Sun, Moon, UserRound, Key, LogOut, UserPlus, ListOrdered, Menu } from '@lucide/svelte/icons';
	
	interface Props {
		children: any;
	}

	let { children }: Props = $props();

	let sidebarCollapsed = $state(false);
	let isDark = $state(false);
	let mobileMenuOpen = $state(false);

	// Load collapsed preference & theme on mount
	onMount(() => {
		if (browser) {
			const savedTheme = localStorage.getItem('theme');
			const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
				applyTheme('dark');
			} else {
				applyTheme('light');
			}

			const savedCollapsed = localStorage.getItem('sidebar_collapsed');
			if (savedCollapsed) {
				sidebarCollapsed = savedCollapsed === 'true';
			}
		}
	});

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

	function handleSidebarToggle() {
		try {
			localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed));
		} catch (e) {}
	}

	// Generate breadcrumb segments from current path with friendly labels
	const segments = $derived(
		$page.url.pathname
			.split('/')
			.filter(Boolean)
			.map((segment, i, arr) => {
				const friendlyNames: Record<string, string> = {
					'dashboard': 'Dashboard',
					'leads': 'Leads',
					'assignments': 'Assignments',
					'estimates': 'Estimates',
					'proposals': 'Proposals', 
					'jobs': 'Jobs',
					'members': 'Team Members',
					'rep': 'Sales Rep Portal',
					'settings': 'Settings',
					'profile': 'My Profile',
					'chats': 'Chats'
				};
				
				return {
					label: friendlyNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
					href: '/' + arr.slice(0, i + 1).join('/')
				};
			})
	);

	const user = $derived($page.data.user);

	function getInitial(): string {
		if (!user) return '';
		const name = (user.firstName || user.email || '').trim();
		return name ? name.charAt(0).toUpperCase() : 'U';
	}

	async function logout() {
		const res = await fetch('/api/auth/logout', { method: 'POST' });
		await goto('/login', { replaceState: true });
	}
</script>

<div class="min-h-screen bg-background text-foreground transition-all duration-300">
	<!-- Left Sidebar (Desktop) -->
	{#if user}
		<div class="hidden md:block">
			<Sidebar bind:collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
		</div>
	{/if}

	<!-- App Main Page Wrapper -->
	<div
		class="transition-all duration-300 ease-in-out"
		style="padding-left: {user ? (sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)') : '0px'};"
	>
		<!-- Sticky Top Header -->
		{#if user}
			<header
				class="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur-md"
			>
				<!-- Left: Mobile Menu Trigger + Page Breadcrumbs -->
				<div class="flex items-center gap-3">
					<button
						onclick={() => mobileMenuOpen = !mobileMenuOpen}
						class="flex size-9 items-center justify-center rounded-lg border border-border bg-card md:hidden hover:bg-slate-50 transition-colors"
						aria-label="Toggle mobile navigation menu"
					>
						<Menu class="size-5" />
					</button>

					<!-- Breadcrumbs (Desktop) -->
					<Breadcrumb.Root class="hidden sm:block">
						<Breadcrumb.List class="flex items-center gap-1.5 text-sm text-muted-foreground">
							<Breadcrumb.Item>
								<Breadcrumb.Link href="/dashboard" class="hover:text-foreground">App</Breadcrumb.Link>
							</Breadcrumb.Item>
							{#each segments as seg, idx}
								<Breadcrumb.Separator />
								<Breadcrumb.Item>
									{#if idx === segments.length - 1}
										<span class="font-semibold text-foreground">{seg.label}</span>
									{:else}
										<Breadcrumb.Link href={seg.href} class="hover:text-foreground">{seg.label}</Breadcrumb.Link>
									{/if}
								</Breadcrumb.Item>
							{/each}
						</Breadcrumb.List>
					</Breadcrumb.Root>
				</div>

				<!-- Right Actions: Theme + User Account -->
				<div class="flex items-center gap-3">
					<!-- Theme Toggle -->
					<button
						onclick={toggleTheme}
						class="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95"
						aria-label="Toggle theme"
					>
						{#if isDark}
							<Sun class="size-4.5 text-amber-500" />
						{:else}
							<Moon class="size-4.5 text-indigo-600" />
						{/if}
					</button>

					<!-- User account dropdown menu -->
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<div
									{...props}
									class="flex size-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-600 text-sm font-semibold text-white shadow-xs transition-transform select-none hover:scale-105 active:scale-95"
								>
									{getInitial()}
								</div>
							{/snippet}
						</DropdownMenu.Trigger>

						<DropdownMenu.Content
							class="min-w-56 rounded-xl border border-border shadow-md"
							align="end"
						>
							<DropdownMenu.Label class="mb-1 font-bold">My Account</DropdownMenu.Label>
							<DropdownMenu.Group>
								<DropdownMenu.Item
									onclick={() => goto('/change-password')}
									class="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground"
								>
									<Key class="size-4" />
									<span>Change Password</span>
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={logout}
									class="flex items-center gap-2 cursor-pointer text-red-500 hover:text-red-600"
								>
									<LogOut class="size-4" />
									<span>Sign Out</span>
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</header>
		{/if}

		<!-- Main Page Content Space -->
		<main class="w-full min-h-[calc(100vh-56px)] bg-slate-50/50 dark:bg-slate-900/10">
			{@render children()}
		</main>
	</div>
</div>

<!-- Page Transition Loading Indicator -->
{#if $navigating}
	<div class="progress-bar-top" transition:fade={{ duration: 150 }}></div>
{/if}

<!-- Mobile Navigation Overlay Drawer -->
{#if mobileMenuOpen && user}
	<!-- Backdrop overlay blur -->
	<button
		onclick={() => mobileMenuOpen = false}
		class="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs md:hidden"
		aria-label="Close navigation panel"
	></button>

	<div class="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar md:hidden transition-transform shadow-2xl">
		<Sidebar collapsed={false} onToggle={() => mobileMenuOpen = false} />
	</div>
{/if}

<style>
	.progress-bar-top {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		z-index: 99999;
		background: linear-gradient(90deg, #2563eb 0%, #6366f1 50%, #2563eb 100%);
		background-size: 200% 100%;
		animation: loading-bar 1.5s infinite linear;
	}

	@keyframes loading-bar {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>

