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
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const stats = [
		{ label: 'Active Projects', value: 3, trend: 'down', color: 'text-primary' },
		{ label: 'Proposals', value: 5, trend: 'up', color: 'text-success' },
		{ label: 'Outstanding Invoices', value: 6, trend: 'up', color: 'text-info' }
	];

	const todays = [
		{ icon: Phone, text: 'Client Follow-up: Sarah Lawrence' },
		{ icon: Clock, text: '9:00 AM – Site Inspection: John Smith Property' },
		{ icon: FileText, text: 'Proposal Due: Michael Thompson Project' }
	];

	const leads = [
		{
			name: 'Fernando James',
			addressLine1: '123 Corporate Plaza, Suite 100',
			phone: '(923) 458-7323',
			source: 'Strategic Outreach Campaign (Oct 1, 2025)',
			isNew: true
		},
		{
			name: 'Robert Wilson',
			addressLine1: '456 Business Center, Floor 12',
			phone: '(923) 458-7323',
			source: 'LinkedIn Referral (Oct 1, 2025)',
			isNew: true
		}
	];

	function pad2(n: number) {
		return n.toString().padStart(2, '0');
	}
</script>

<svelte:head>
	<title>Enterprise Dashboard | CommunityCore</title>
	<meta name="description" content="Enterprise community management dashboard" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="preload" as="image" href="/favicon.svg" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="flex flex-col mx-auto gap-8 px-4 py-8">
	<div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
		<h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
			Enterprise Dashboard
		</h1>

		{#if $page.data.user?.role === 'OWNER'}
			<Button class="hover:bg-primary-dark gap-2 bg-primary text-white" href="/members">
				<Plus class="size-4" />
				Add Team Members
			</Button>
		{/if}
	</div>

	<!-- Key Metrics -->
	<div class="grid grid-cols-3 gap-6">
		{#each stats as s}
			<Card class="bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800">
				<div class="flex w-full flex-col items-center justify-center gap-3">
					<div class="flex items-center gap-3 font-mono text-6xl font-bold">
						{pad2(s.value)}
						{#if s.trend === 'down'}
							<ArrowDown class={`size-8 ${s.color}`} />
						{:else}
							<ArrowUp class={`size-8 ${s.color}`} />
						{/if}
					</div>
					<Separator class="my-3 w-1/2 opacity-20" />
					<div class="text-lg font-medium text-gray-600 dark:text-gray-300">
						{s.label}
					</div>
				</div>
			</Card>
		{/each}
	</div>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<!-- Lead Pipeline - Takes up full height on left -->
		<Card class="bg-white shadow-lg lg:col-span-2 lg:row-span-2 dark:bg-gray-800">
			<div class="border-b border-gray-200 px-8 py-6 dark:border-gray-700">
				<h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">Lead Pipeline</h2>
			</div>

			<div class="divide-y divide-gray-200 dark:divide-gray-700">
				{#each leads as lead}
					<div class="p-6">
						<div class="rounded-xl bg-gray-50 shadow-sm dark:bg-gray-900/50">
							<!-- Contact Info -->
							<div class="flex items-center justify-between p-6">
								<div class="flex items-center gap-4">
									<div class="flex size-12 items-center justify-center rounded-full bg-primary/10">
										<User2 class="size-6 text-primary" />
									</div>
									<div>
										<div class="text-base font-semibold text-gray-900 dark:text-gray-100">
											{lead.name}
										</div>
										<div class="text-sm text-gray-600 dark:text-gray-400">{lead.addressLine1}</div>
									</div>
								</div>

								<div class="flex items-center gap-3">
									{#if lead.isNew}
										<span
											class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
										>
											NEW OPPORTUNITY
										</span>
									{/if}
								</div>
							</div>

							<!-- Actions -->
							<div
								class="flex flex-col gap-4 border-t border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between dark:border-gray-700"
							>
								<div class="flex items-center gap-3 text-sm">
									<PhoneCall class="size-4 text-gray-500" />
									<a
										href={`tel:${lead.phone}`}
										class="hover:text-primary-dark font-medium text-primary">{lead.phone}</a
									>
								</div>

								<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
									<Info class="size-4" />
									<span>{lead.source}</span>
								</div>

								<div class="flex items-center gap-3">
									<Button
										variant="outline"
										class="h-9 border-primary text-primary hover:bg-primary hover:text-white"
									>
										<Plus class="mr-2 size-4" />
										Add to Pipeline
									</Button>
									<Button class="hover:bg-primary-dark h-9 bg-primary text-white">
										View Details
										<ChevronRight class="ml-2 size-4" />
									</Button>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</Card>

		<!-- Today's Agenda - Right side top -->
		<Card class="bg-white shadow-lg dark:bg-gray-800">
			<div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Today's Agenda</h2>
			</div>
			<div class="p-6">
				<div class="flex flex-col gap-4">
					{#each todays as item}
						<div class="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
							<item.icon class="size-6 text-primary" />
							<span class="text-base text-gray-700 dark:text-gray-300">{item.text}</span>
						</div>
					{/each}
				</div>
			</div>
		</Card>

		<!-- Quick Actions - Right side bottom -->
		<Card class="bg-white shadow-lg dark:bg-gray-800">
			<div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
			</div>
			<div class="p-6">
				<div class="flex flex-col gap-3">
					<Button class="w-full justify-start gap-3">
						<Plus class="size-4" />
						Create New Project
					</Button>
					<Button variant="outline" class="w-full justify-start gap-3">
						<FileText class="size-4" />
						Generate Report
					</Button>
					<Button variant="outline" class="w-full justify-start gap-3">
						<Phone class="size-4" />
						Schedule Call
					</Button>
				</div>
			</div>
		</Card>
	</div>
</div>
