<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
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
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	export let data: any;

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
	<title>Dashboard | Roofing Software</title>
	<meta name="description" content="Your personalized dashboard" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="flex flex-col gap-8 px-4 py-8">
	<!-- Header -->
	<div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
				Welcome back, {$page.data.user?.firstName}!
			</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">
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

		<div class="flex gap-3">
			{#if data.userRole === 'OWNER'}
				<Button variant="outline" class="gap-2">
					<Calendar class="size-4" />
					Schedule Meeting
				</Button>
				<Button class="hover:bg-primary-dark gap-2 bg-primary text-white" onclick={() => goto('/leads?new=true')}>
					<Plus class="size-4" />
					New Lead
				</Button>
			{/if}
		</div>
	</div>

	<!-- Key Metrics -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
		{#each data.stats as stat}
			<Card class="bg-white p-6 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] dark:bg-gray-800">
				<div class="flex items-center gap-4">
					<div class="flex size-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
						<svelte:component this={icons[stat.icon] || FileText} class="size-6 text-indigo-600 dark:text-indigo-400" />
					</div>
					<div class="flex flex-1 flex-col">
						<span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</span>
						<span class="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
					</div>
				</div>
			</Card>
		{/each}
	</div>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<!-- Recent Activity / Leads -->
		<Card class="bg-white shadow-lg lg:col-span-2 dark:bg-gray-800">
			<div class="border-b border-gray-200 px-6 py-4 flex justify-between items-center dark:border-gray-700">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
					{#if data.userRole === 'OWNER'}
						Recent Leads
					{:else if data.userRole === 'REP'}
						My Recent Leads
					{:else if data.userRole === 'ESTIMATOR'}
						My Recent Assignments
					{/if}
				</h2>
				<Button variant="outline" size="sm" onclick={() => {
					if (data.userRole === 'OWNER') goto('/leads');
					else if (data.userRole === 'REP') goto('/rep');
					else if (data.userRole === 'ESTIMATOR') goto('/assignment-docs');
				}}>
					View All
				</Button>
			</div>

			{#if data.recentActivity && data.recentActivity.length > 0}
				<div class="divide-y divide-gray-200 dark:divide-gray-700">
					{#each data.recentActivity as activity}
						<div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-4">
									<div class="flex size-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
										<User2 class="size-5 text-indigo-600 dark:text-indigo-400" />
									</div>
									<div>
										<div class="font-semibold text-gray-900 dark:text-gray-100">{activity.title}</div>
										<div class="text-sm text-gray-600 dark:text-gray-400">
											{activity.customer || 'No customer'}
										</div>
										{#if activity.assignedTo}
											<div class="text-xs text-gray-500">Assigned to: {activity.assignedTo}</div>
										{/if}
									</div>
								</div>

								<div class="flex items-center gap-3">
									{#if activity.status}
										<span class="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
											{activity.status}
										</span>
									{/if}
									{#if activity.priority}
										<span class="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
											{activity.priority}
										</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="p-12 text-center">
					<p class="text-gray-500 dark:text-gray-400">No recent activity</p>
				</div>
			{/if}
		</Card>

		<!-- Right Sidebar -->
		<div class="flex flex-col gap-6">
			<!-- Upcoming Inspections (REP only) -->
			{#if data.userRole === 'REP' && data.upcomingInspections && data.upcomingInspections.length > 0}
				<Card class="bg-white shadow-lg dark:bg-gray-800">
					<div class="border-b border-gray-200 px-6 py-4 flex justify-between items-center dark:border-gray-700">
						<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Today's Appointments</h2>
						<Button variant="outline" size="sm">Schedule</Button>
					</div>

					<div class="p-4 flex flex-col gap-4">
						{#each data.upcomingInspections as inspection}
							<div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
								<div class="flex justify-between items-start mb-2">
									<div>
										<h3 class="font-semibold text-gray-900 dark:text-gray-100">{inspection.customer}</h3>
										<p class="text-sm text-gray-600 dark:text-gray-400">{inspection.address}</p>
									</div>
									<span class="text-sm font-medium text-indigo-600 dark:text-indigo-400">{inspection.time}</span>
								</div>
								<div class="flex items-center justify-between mt-2">
									<span class="text-sm text-gray-600 dark:text-gray-400">{inspection.status}</span>
									<Button size="sm" variant="outline">View</Button>
								</div>
							</div>
						{/each}
					</div>
				</Card>
			{/if}

			<!-- Quick Actions -->
			{#if data.quickActions && data.quickActions.length > 0}
				<Card class="bg-white shadow-lg dark:bg-gray-800">
					<div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
						<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
					</div>
					<div class="p-4">
						<div class="flex flex-col gap-3">
							{#each data.quickActions as action}
								<Button 
									class="w-full justify-start gap-3 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700" 
									onclick={() => goto(action.href)}
								>
									<svelte:component this={icons[action.icon] || FileText} class="size-4" />
									{action.label}
								</Button>
							{/each}
						</div>
					</div>
				</Card>
			{/if}
		</div>
	</div>
</div>
