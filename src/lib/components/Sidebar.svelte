<script lang="ts">
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import {
		LayoutDashboard,
		Users,
		CalendarDays,
		Briefcase,
		FileSpreadsheet,
		FileSignature,
		HardHat,
		FileText,
		MessageSquare,
		LogOut,
		ChevronLeft,
		ChevronRight,
		UserRound
	} from '@lucide/svelte/icons';

	interface Props {
		collapsed?: boolean;
		onToggle?: () => void;
	}

	let { collapsed = $bindable(false), onToggle }: Props = $props();

	const user = $derived($page.data.user);
	const userRole = $derived(user?.role || '');

	const links = [
		{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
		{ label: 'Leads', href: '/leads', icon: Users, ownerOnly: true },
		{ label: 'Assignments', href: '/assignments', icon: CalendarDays, ownerOnly: true },
		{ label: 'Sales Rep Portal', href: '/rep', icon: UserRound, repOnly: true },
		{ label: 'Site Docs', href: '/assignment-docs', icon: FileText, estimatorOnly: true },
		{ label: 'Estimates', href: '/estimates', icon: FileSpreadsheet },
		{ label: 'Proposals', href: '/proposals', icon: FileSignature },
		{ label: 'Active Jobs', href: '/jobs', icon: HardHat },
		{ label: 'Team Members', href: '/members', icon: Users, ownerOnly: true },
		{ label: 'Chats', href: '/chats', icon: MessageSquare, badgeKey: 'unreadChatCount' }
	];

	const visibleLinks = $derived(
		links.filter((l) => {
			if (l.ownerOnly && userRole !== 'OWNER') return false;
			if (l.repOnly && userRole !== 'REP') return false;
			if (l.estimatorOnly && userRole !== 'ESTIMATOR') return false;
			return true;
		})
	);

	function isActive(href: string) {
		return $page.url.pathname === href;
	}

	async function logout() {
		const res = await fetch('/api/auth/logout', { method: 'POST' });
		await invalidateAll();
		await goto('/login', { replaceState: true });
	}
</script>

<aside
	class="fixed top-0 bottom-0 left-0 z-50 flex h-full flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out {collapsed
		? 'w-[68px]'
		: 'w-[240px]'}"
>
	<!-- Branding / Logo Header -->
	<div class="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
		<a
			href="/dashboard"
			class="flex items-center gap-2.5 overflow-hidden transition-opacity hover:opacity-90"
		>
			<img
				src="https://i.postimg.cc/BZ2cNHkd/logo.png"
				alt="ROOFPILOT Logo"
				class="h-8 w-auto shrink-0 drop-shadow-xs"
			/>
			{#if !collapsed}
				<span
					class="text-base font-bold tracking-tight text-foreground transition-opacity duration-200"
				>
					ROOFPILOT
				</span>
			{/if}
		</a>

		{#if !collapsed}
			<button
				onclick={() => {
					collapsed = true;
					if (onToggle) onToggle();
				}}
				class="flex size-7 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar transition-colors hover:bg-sidebar-accent"
				aria-label="Collapse sidebar"
			>
				<ChevronLeft class="text-muted-foreground size-4" />
			</button>
		{/if}
	</div>

	<!-- Navigation Group -->
	<nav class="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
		{#each visibleLinks as link}
			{@const active = isActive(link.href)}
			{@const Icon = link.icon}
			{@const badgeCount = link.badgeKey ? $page.data[link.badgeKey] : 0}

			<a
				href={link.href}
				class="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all {active
					? 'bg-primary text-primary-foreground shadow-xs'
					: 'hover:bg-sidebar-accent hover:text-foreground'}"
			>
				<Icon class="size-4 shrink-0 transition-transform group-hover:scale-105" />

				{#if !collapsed}
					<span class="flex-1 truncate">{link.label}</span>

					{#if badgeCount > 0}
						<span
							class="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm"
						>
							{badgeCount > 99 ? '99+' : badgeCount}
						</span>
					{/if}
				{/if}

				{#if collapsed}
					<!-- Simple hover tooltip for collapsed sidebar links -->
					<div
						class="pointer-events-none absolute left-14 z-50 rounded-md bg-slate-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
					>
						{link.label}
					</div>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Sidebar footer user actions -->
	<div class="space-y-2 border-t border-sidebar-border p-3">
		{#if collapsed}
			<button
				onclick={() => {
					collapsed = false;
					if (onToggle) onToggle();
				}}
				class="flex w-full items-center justify-center rounded-lg border border-sidebar-border bg-sidebar p-2 transition-colors hover:bg-sidebar-accent"
				aria-label="Expand sidebar"
			>
				<ChevronRight class="text-muted-foreground size-4" />
			</button>
		{/if}

		<button
			onclick={logout}
			class="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
		>
			<LogOut class="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
			{#if !collapsed}
				<span>Sign Out</span>
			{/if}
		</button>
	</div>
</aside>
