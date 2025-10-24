<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Phone from '@lucide/svelte/icons/phone';
	import Clock from '@lucide/svelte/icons/clock';
	import FileText from '@lucide/svelte/icons/file-text';
	import Info from '@lucide/svelte/icons/info';
	import User2 from '@lucide/svelte/icons/user-2';
	import PhoneCall from '@lucide/svelte/icons/phone-call';
	import Plus from '@lucide/svelte/icons/plus';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Calendar from '@lucide/svelte/icons/calendar';
	import DollarSign from '@lucide/svelte/icons/dollar-sign';
	import Hammer from '@lucide/svelte/icons/hammer';
	import Users from '@lucide/svelte/icons/users';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const stats = [
		{ label: 'Active Projects', value: 12, trend: 'up', color: 'text-primary', icon: Hammer },
		{ label: 'Open Leads', value: 28, trend: 'up', color: 'text-success', icon: Users },
		{ label: 'Revenue MTD', value: '$45.2K', trend: 'up', color: 'text-info', icon: DollarSign },
		{ label: 'Inspections Today', value: 8, trend: 'up', color: 'text-warning', icon: Calendar }
	];

	const upcomingInspections = [
		{
			customer: 'Sarah Lawrence',
			address: '742 Evergreen Terrace',
			time: '9:00 AM',
			type: 'Initial Assessment',
			status: 'Confirmed'
		},
		{
			customer: 'John Smith',
			address: '123 Main Street',
			time: '11:30 AM', 
			type: 'Follow-up',
			status: 'Pending'
		},
		{
			customer: 'Michael Thompson',
			address: '456 Oak Drive',
			time: '2:00 PM',
			type: 'Final Inspection',
			status: 'Confirmed'
		}
	];

	const leads = [
		{
			name: 'Fernando James',
			addressLine1: '123 Corporate Plaza, Suite 100',
			phone: '(923) 458-7323',
			source: 'Website Form',
			status: 'New Lead',
			value: '$12,500',
			priority: 'High',
			lastContact: '2 hours ago'
		},
		{
			name: 'Robert Wilson',
			addressLine1: '456 Business Center, Floor 12',
			phone: '(923) 458-7323', 
			source: 'Referral',
			status: 'Estimate Needed',
			value: '$8,750',
			priority: 'Medium',
			lastContact: '1 day ago'
		},
		{
			name: 'Maria Garcia',
			addressLine1: '789 Residential Ave',
			phone: '(923) 555-1234',
			source: 'Google Ads',
			status: 'Proposal Sent',
			value: '$15,300',
			priority: 'High',
			lastContact: '3 hours ago'
		}
	];

	function getStatusColor(status: string) {
		switch(status) {
			case 'New Lead': return 'bg-blue-100 text-blue-800';
			case 'Estimate Needed': return 'bg-yellow-100 text-yellow-800';
			case 'Proposal Sent': return 'bg-green-100 text-green-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getPriorityColor(priority: string) {
		switch(priority) {
			case 'High': return 'bg-red-100 text-red-800';
			case 'Medium': return 'bg-orange-100 text-orange-800';
			case 'Low': return 'bg-green-100 text-green-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<svelte:head>
	<title>Roofing Dashboard | CommunityCore</title>
	<meta name="description" content="Community roofing management dashboard" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="preload" as="image" href="/favicon.svg" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="flex flex-col mx-auto gap-8 px-6 py-8 max-w-[1600px]">
	<div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
				Welcome back, {$page.data.user?.firstName}
			</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">Here's what's happening with your business today</p>
		</div>

		<div class="flex gap-3">
			{#if $page.data.user?.role === 'OWNER'}
				<Button variant="outline" class="gap-2">
					<Calendar class="size-4" />
					Schedule Meeting
				</Button>
				<Button class="hover:bg-primary-dark gap-2 bg-primary text-white">
					<Plus class="size-4" />
					New Project
				</Button>
			{/if}
		</div>
	</div>

	<!-- Key Metrics -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		{#each stats as s}
			<Card class="bg-white p-6 shadow-lg transition-all hover:scale-[1.02] dark:bg-gray-800">
				<div class="flex items-center gap-4">
					<div class="flex size-12 items-center justify-center rounded-full bg-primary/10">
						<svelte:component this={s.icon} class="size-6 text-primary" />
					</div>
					<div class="flex flex-col">
						<span class="text-2xl font-bold">{s.value}</span>
						<span class="text-sm text-gray-600 dark:text-gray-400">{s.label}</span>
					</div>
					{#if s.trend === 'down'}
						<ArrowDown class={`size-5 ml-auto ${s.color}`} />
					{:else}
						<ArrowUp class={`size-5 ml-auto ${s.color}`} />
					{/if}
				</div>
			</Card>
		{/each}
	</div>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<!-- Lead Pipeline -->
		<Card class="bg-white shadow-lg lg:col-span-2 dark:bg-gray-800">
			<div class="border-b border-gray-200 px-6 py-4 flex justify-between items-center dark:border-gray-700">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Active Leads</h2>
				<Button variant="outline" size="sm">View All</Button>
			</div>

			<div class="divide-y divide-gray-200 dark:divide-gray-700">
				{#each leads as lead}
					<div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-4">
								<div class="flex size-10 items-center justify-center rounded-full bg-primary/10">
									<User2 class="size-5 text-primary" />
								</div>
								<div>
									<div class="font-semibold text-gray-900 dark:text-gray-100">{lead.name}</div>
									<div class="text-sm text-gray-600 dark:text-gray-400">{lead.addressLine1}</div>
								</div>
							</div>

							<div class="flex items-center gap-3">
								<span class={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
									{lead.status}
								</span>
								<span class={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(lead.priority)}`}>
									{lead.priority}
								</span>
								<span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{lead.value}</span>
							</div>
						</div>

						<div class="mt-4 flex items-center justify-between text-sm">
							<div class="flex items-center gap-6">
								<span class="flex items-center gap-2">
									<PhoneCall class="size-4 text-gray-500" />
									<a href={`tel:${lead.phone}`} class="hover:text-primary">{lead.phone}</a>
								</span>
								<span class="flex items-center gap-2">
									<Info class="size-4 text-gray-500" />
									<span class="text-gray-600 dark:text-gray-400">Last Contact: {lead.lastContact}</span>
								</span>
							</div>

							<div class="flex gap-3">
								<Button variant="outline" size="sm">Schedule Call</Button>
								<Button size="sm" class="bg-primary text-white hover:bg-primary-dark">
									View Details
								</Button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</Card>

		<!-- Today's Inspections -->
		<div class="flex flex-col gap-6">
			<Card class="bg-white shadow-lg dark:bg-gray-800">
				<div class="border-b border-gray-200 px-6 py-4 flex justify-between items-center dark:border-gray-700">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Today's Inspections</h2>
					<Button variant="outline" size="sm">Schedule New</Button>
				</div>

				<div class="p-4 flex flex-col gap-4">
					{#each upcomingInspections as inspection}
						<div class="rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
							<div class="flex justify-between items-start mb-2">
								<div>
									<h3 class="font-semibold">{inspection.customer}</h3>
									<p class="text-sm text-gray-600 dark:text-gray-400">{inspection.address}</p>
								</div>
								<span class="text-sm font-medium text-primary">{inspection.time}</span>
							</div>
							<div class="flex items-center justify-between mt-2">
								<span class="text-sm text-gray-600 dark:text-gray-400">{inspection.type}</span>
								<Button size="sm" variant={inspection.status === 'Confirmed' ? 'outline' : 'default'}>
									{inspection.status}
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Quick Actions -->
			<Card class="bg-white shadow-lg dark:bg-gray-800">
				<div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
				</div>
				<div class="p-4">
					<div class="flex flex-col gap-3">
						<Button class="w-full justify-start gap-3 bg-primary text-white hover:bg-primary-dark">
							<Plus class="size-4" />
							Create New Estimate
						</Button>
						<Button variant="outline" class="w-full justify-start gap-3">
							<Calendar class="size-4" />
							Schedule Inspection
						</Button>
						<Button variant="outline" class="w-full justify-start gap-3">
							<FileText class="size-4" />
							Generate Report
						</Button>
					</div>
				</div>
			</Card>
		</div>
	</div>
</div>
