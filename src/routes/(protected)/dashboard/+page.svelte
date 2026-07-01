<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import User2 from '@lucide/svelte/icons/user-2';
	import Plus from '@lucide/svelte/icons/plus';
	import Calendar from '@lucide/svelte/icons/calendar';
	import DollarSign from '@lucide/svelte/icons/dollar-sign';
	import Hammer from '@lucide/svelte/icons/hammer';
	import Users from '@lucide/svelte/icons/users';
	import FileText from '@lucide/svelte/icons/file-text';
	import Clock from '@lucide/svelte/icons/clock';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import MapPin from '@lucide/svelte/icons/map-pin';

	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const { data } = $props<{ data: any }>();

	const icons: Record<string, any> = {
		Hammer,
		DollarSign,
		Users,
		FileText,
		Calendar,
		Clock,
		ArrowUp
	};
</script>

<svelte:head>
	<title>Dashboard | ROOFPILOT CRM</title>
	<meta name="description" content="Roofing CRM main dashboard overview" />
</svelte:head>

<div class="mx-auto flex max-w-7xl flex-col gap-6 p-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">
				Welcome back, {$page.data.user?.firstName || 'User'}!
			</h1>
			<p class="text-muted-foreground mt-0.5 text-sm">
				{#if data.userRole === 'OWNER'}
					Overview of your business performance
				{:else if data.userRole === 'REP'}
					Your lead management and sales pipeline
				{:else if data.userRole === 'ESTIMATOR'}
					Your assignments and project progress
				{:else}
					Here's what's happening today
				{/if}
			</p>
		</div>

		<div class="flex items-center gap-2.5">
			{#if data.userRole === 'OWNER'}
				<Button variant="outline" size="sm" class="gap-2">
					<Calendar class="size-4" />
					Schedule Meeting
				</Button>
				<Button size="sm" class="gap-2 shadow-sm" onclick={() => goto('/leads?new=true')}>
					<Plus class="size-4" />
					New Lead
				</Button>
			{/if}
		</div>
	</div>

	<!-- Key Metrics Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each data.stats || [] as stat}
			<StatCard
				label={stat.label}
				value={stat.value}
				icon={icons[stat.icon] || FileText}
				colorClass="text-primary"
			/>
		{/each}
	</div>

	<!-- Dashboard Layout split panels -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Recent Activity / Leads panel -->
		<div class="space-y-4 lg:col-span-2">
			<div class="flex items-center justify-between">
				<h2 class="text-base font-semibold text-foreground">
					{#if data.userRole === 'OWNER'}
						Recent Leads
					{:else if data.userRole === 'REP'}
						My Recent Leads
					{:else if data.userRole === 'ESTIMATOR'}
						My Recent Assignments
					{/if}
				</h2>
				<Button
					variant="ghost"
					size="sm"
					class="text-xs"
					onclick={() => {
						if (data.userRole === 'OWNER') goto('/leads');
						else if (data.userRole === 'REP') goto('/rep');
						else if (data.userRole === 'ESTIMATOR') goto('/assignment-docs');
					}}
				>
					View All
				</Button>
			</div>

			<Card class="overflow-hidden border border-border bg-card shadow-xs">
				{#if data.recentActivity && data.recentActivity.length > 0}
					<div class="divide-y divide-border">
						{#each data.recentActivity as activity}
							<div
								class="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
							>
								<div class="flex min-w-0 items-center gap-3.5">
									<div
										class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-slate-50 dark:bg-slate-900"
									>
										<User2 class="text-muted-foreground size-4.5" />
									</div>
									<div class="min-w-0">
										<p class="truncate text-sm font-semibold text-foreground">{activity.title}</p>
										<p class="text-muted-foreground mt-0.5 truncate text-xs">
											{activity.customer || 'No customer'}
										</p>
										{#if activity.assignedTo}
											<p class="text-muted-foreground/80 mt-0.5 text-[10px]">
												Assigned to: {activity.assignedTo}
											</p>
										{/if}
									</div>
								</div>

								<div class="flex items-center gap-2">
									{#if activity.status}
										<StatusBadge type="lead" value={activity.status} />
									{/if}
									{#if activity.priority}
										<StatusBadge type="priority" value={activity.priority} />
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-muted-foreground py-12 text-center text-sm">
						No recent activity found.
					</div>
				{/if}
			</Card>
		</div>

		<!-- Right Sidebars: Appointments & Quick Actions -->
		<div class="space-y-6">
			<!-- Upcoming Inspections panel -->
			{#if data.userRole === 'REP' && data.upcomingInspections && data.upcomingInspections.length > 0}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h2 class="text-base font-semibold text-foreground">Today's Appointments</h2>
						<Button variant="ghost" size="sm" class="text-xs">Schedule</Button>
					</div>

					<div class="flex flex-col gap-3">
						{#each data.upcomingInspections as inspection}
							<Card
								class="hover:border-border-hover border border-border bg-card p-4 shadow-xs transition-colors"
							>
								<div class="mb-1.5 flex items-start justify-between gap-2">
									<div class="min-w-0">
										<h3 class="truncate text-sm font-semibold text-foreground">
											{inspection.customer}
										</h3>
										<p class="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
											<MapPin class="size-3 shrink-0" />
											<span class="truncate">{inspection.address}</span>
										</p>
									</div>
									<span
										class="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
									>
										{inspection.time}
									</span>
								</div>
								<div class="mt-2.5 flex items-center justify-between border-t border-border pt-2">
									<span class="text-muted-foreground text-xs">{inspection.status}</span>
									<Button size="sm" variant="outline" class="h-7 px-2.5 text-xs">View</Button>
								</div>
							</Card>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Quick Actions panel -->
			{#if data.quickActions && data.quickActions.length > 0}
				<div class="space-y-4">
					<h2 class="text-base font-semibold text-foreground">Quick Actions</h2>

					<Card class="border border-border bg-card p-4 shadow-xs">
						<div class="flex flex-col gap-2">
							{#each data.quickActions as action}
								<Button
									variant="outline"
									class="h-9 w-full justify-start gap-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
									onclick={() => goto(action.href)}
								>
									<svelte:component
										this={icons[action.icon] || FileText}
										class="text-muted-foreground size-4"
									/>
									{action.label}
								</Button>
							{/each}
						</div>
					</Card>
				</div>
			{/if}
		</div>
	</div>
</div>
