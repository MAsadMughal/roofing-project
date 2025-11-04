<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import {
		Calendar,
		Eye,
		Plus,
		User2,
		Search,
		Filter,
		Grid3x3,
		List,
		LayoutGrid,
		TrendingUp,
		Clock,
		CheckCircle2,
		AlertCircle,
		DollarSign,
		Users,
		MapPin,
		Phone,
		Mail,
		ArrowRight,
		MoreVertical,
		Edit,
		Trash2,
		FileText,
		Image as ImageIcon
	} from '@lucide/svelte/icons';

	const { data } = $props();

	// Status configuration
	const STATUS_META: Record<string, { title: string; color: string; bgColor: string }> = {
		scheduled: { title: 'Scheduled', color: 'text-blue-700', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
		in_progress: { title: 'In Progress', color: 'text-yellow-700', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
		completed: { title: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100 dark:bg-green-900/30' },
		pending_payment: { title: 'Pending Payment', color: 'text-violet-700', bgColor: 'bg-violet-100 dark:bg-violet-900/30' },
		cancelled: { title: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' }
	};

	// Priority configuration
	const PRIORITY_META: Record<string, { title: string; color: string; bgColor: string }> = {
		high: { title: 'High', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
		medium: { title: 'Medium', color: 'text-yellow-700', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
		low: { title: 'Low', color: 'text-gray-700', bgColor: 'bg-gray-100 dark:bg-gray-900/30' }
	};

	// View types
	type ViewType = 'kanban' | 'list' | 'grid';
	let currentView = $state<ViewType>((data.filters?.view as ViewType) || 'kanban');

	// Filters
	let searchText = $state(data.filters?.q || '');
	let statusFilter = $state(data.filters?.status || 'all');
	let priorityFilter = $state(data.filters?.priority || 'all');
	let dateFrom = $state(data.filters?.dateFrom || '');
	let dateTo = $state(data.filters?.dateTo || '');
	let showFilters = $state(false);

	// Selected job for details
	let selectedJobId: string | null = $state(null);

	// Utilities
	const currency = (n: number = 0) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
	const fmtDate = (s?: string | null) =>
		s ? new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
	const fmtDateShort = (s?: string | null) =>
		s ? new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-';

	// Filtered and sorted jobs
	const filteredJobs = $derived(() => {
		let result = [...(data.jobs || [])];

		// Search filter
		if (searchText) {
			const query = searchText.toLowerCase();
			result = result.filter(
				(job) =>
					job.title?.toLowerCase().includes(query) ||
					job.description?.toLowerCase().includes(query) ||
					`${job.customer?.firstName || ''} ${job.customer?.lastName || ''}`.toLowerCase().includes(query) ||
					job.address?.toLowerCase().includes(query)
			);
		}

		// Status filter
		if (statusFilter && statusFilter !== 'all') {
			result = result.filter((job) => job.status === statusFilter);
		}

		// Priority filter
		if (priorityFilter && priorityFilter !== 'all') {
			result = result.filter((job) => job.priority === priorityFilter);
		}

		// Date filters
		if (dateFrom) {
			result = result.filter((job) => {
				const jobDate = job.scheduledDate || job.startDate;
				return jobDate ? new Date(jobDate) >= new Date(dateFrom) : false;
			});
		}
		if (dateTo) {
			result = result.filter((job) => {
				const jobDate = job.scheduledDate || job.startDate;
				return jobDate ? new Date(jobDate) <= new Date(dateTo) : false;
			});
		}

		return result;
	});

	// Group jobs by status for Kanban view
	const jobsByStatus = $derived(() => {
		type JobArray = ReturnType<typeof filteredJobs>;
		const grouped: Record<string, JobArray> = {
			scheduled: [],
			in_progress: [],
			completed: [],
			pending_payment: [],
			cancelled: []
		};

		filteredJobs().forEach((job) => {
			const status = job.status || 'scheduled';
			if (grouped[status]) {
				grouped[status] = [...grouped[status], job];
			}
		});

		return grouped;
	});

	// Apply filters
	function applyFilters() {
		const params = new URLSearchParams();
		if (searchText) params.set('q', searchText);
		if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
		if (priorityFilter && priorityFilter !== 'all') params.set('priority', priorityFilter);
		if (dateFrom) params.set('dateFrom', dateFrom);
		if (dateTo) params.set('dateTo', dateTo);
		if (currentView) params.set('view', currentView);

		goto(`/jobs?${params.toString()}`, { invalidateAll: true });
	}

	function changeView(view: ViewType) {
		currentView = view;
		applyFilters();
	}

	function clearFilters() {
		searchText = '';
		statusFilter = 'all';
		priorityFilter = 'all';
		dateFrom = '';
		dateTo = '';
		applyFilters();
	}

	function selectJob(jobId: string) {
		selectedJobId = selectedJobId === jobId ? null : jobId;
	}

	function viewJob(job: any) {
		goto(`/jobs/${job.id}`);
	}

	function openNewJob() {
		goto('/jobs/new');
	}

	// Status options for filter
	const statusOptions = [
		{ value: 'all', label: 'All Statuses' },
		{ value: 'scheduled', label: 'Scheduled' },
		{ value: 'in_progress', label: 'In Progress' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'pending_payment', label: 'Pending Payment' },
		{ value: 'cancelled', label: 'Cancelled' }
	];

	// Priority options for filter
	const priorityOptions = [
		{ value: 'all', label: 'All Priorities' },
		{ value: 'high', label: 'High' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'low', label: 'Low' }
	];
</script>

<svelte:head>
	<title>Jobs - Project Management</title>
</svelte:head>

<div class="w-full space-y-6 px-2 md:px-0 pt-2">
	<!-- Header with Stats -->
	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<h1 class="text-3xl font-bold tracking-tight">Jobs</h1>
			<Button class="!rounded-full shadow-sm" onclick={openNewJob}>
				<Plus class="mr-2 size-4" /> New Job
			</Button>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
			<Card class="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-blue-600 dark:text-blue-400 font-medium">Total</p>
						<p class="text-2xl font-bold text-blue-900 dark:text-blue-100">{data.stats?.total || 0}</p>
					</div>
					<FileText class="size-8 text-blue-500 opacity-60" />
				</div>
			</Card>

			<Card class="p-4 bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/20 border-sky-200 dark:border-sky-800">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-sky-600 dark:text-sky-400 font-medium">Scheduled</p>
						<p class="text-2xl font-bold text-sky-900 dark:text-sky-100">{data.stats?.scheduled || 0}</p>
					</div>
					<Calendar class="size-8 text-sky-500 opacity-60" />
				</div>
			</Card>

			<Card class="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-yellow-600 dark:text-yellow-400 font-medium">In Progress</p>
						<p class="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{data.stats?.inProgress || 0}</p>
					</div>
					<Clock class="size-8 text-yellow-500 opacity-60" />
				</div>
			</Card>

			<Card class="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-green-600 dark:text-green-400 font-medium">Completed</p>
						<p class="text-2xl font-bold text-green-900 dark:text-green-100">{data.stats?.completed || 0}</p>
					</div>
					<CheckCircle2 class="size-8 text-green-500 opacity-60" />
				</div>
			</Card>

			<Card class="p-4 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 border-violet-200 dark:border-violet-800">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-violet-600 dark:text-violet-400 font-medium">Pending Payment</p>
						<p class="text-2xl font-bold text-violet-900 dark:text-violet-100">{data.stats?.pendingPayment || 0}</p>
					</div>
					<DollarSign class="size-8 text-violet-500 opacity-60" />
				</div>
			</Card>

			<Card class="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-red-600 dark:text-red-400 font-medium">High Priority</p>
						<p class="text-2xl font-bold text-red-900 dark:text-red-100">{data.stats?.highPriority || 0}</p>
					</div>
					<AlertCircle class="size-8 text-red-500 opacity-60" />
				</div>
			</Card>

			<Card class="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Revenue</p>
						<p class="text-xl font-bold text-emerald-900 dark:text-emerald-100">
							{currency(data.stats?.totalRevenue || 0)}
						</p>
					</div>
					<TrendingUp class="size-8 text-emerald-500 opacity-60" />
				</div>
			</Card>
		</div>
	</div>

	<!-- Filters and View Toggle -->
	<div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
		<div class="flex flex-wrap items-center gap-3 flex-1">
			<!-- Search -->
			<div class="relative flex-1 min-w-[200px] max-w-md">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
				<Input
					class="pl-10 rounded-full bg-gray-50 dark:bg-gray-800  focus:ring-2 focus:ring-sky-400"
					placeholder="Search jobs, customer, address..."
					bind:value={searchText}
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
				/>
			</div>

			<!-- Status Filter -->
			<Select.Root type="single" bind:value={statusFilter}>
				<Select.Trigger class="min-w-[140px]">
					{statusOptions.find((o) => o.value === statusFilter)?.label || 'All Statuses'}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						{#each statusOptions as opt}
							<Select.Item value={opt.value}>{opt.label}</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>

			<!-- Priority Filter -->
			<Select.Root type="single" bind:value={priorityFilter}>
				<Select.Trigger class="min-w-[140px]">
					{priorityOptions.find((o) => o.value === priorityFilter)?.label || 'All Priorities'}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						{#each priorityOptions as opt}
							<Select.Item value={opt.value}>{opt.label}</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>

			<!-- Filter Toggle -->
			<Button variant="outline" size="sm" onclick={() => (showFilters = !showFilters)}>
				<Filter class="mr-2 size-4" /> Filters
			</Button>

			<!-- Apply Filters -->
			<Button size="sm" onclick={applyFilters}>Apply</Button>
			{#if statusFilter !== 'all' || priorityFilter !== 'all' || searchText || dateFrom || dateTo}
				<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
			{/if}
		</div>

		<!-- View Toggle -->
		<div class="flex items-center gap-2">
			<Button
				variant={currentView === 'kanban' ? 'default' : 'outline'}
				size="sm"
				onclick={() => changeView('kanban')}
			>
				<LayoutGrid class="size-4" />
			</Button>
			<Button
				variant={currentView === 'list' ? 'default' : 'outline'}
				size="sm"
				onclick={() => changeView('list')}
			>
				<List class="size-4" />
			</Button>
			<Button
				variant={currentView === 'grid' ? 'default' : 'outline'}
				size="sm"
				onclick={() => changeView('grid')}
			>
				<Grid3x3 class="size-4" />
			</Button>
		</div>
	</div>

		<!-- Advanced Filters -->
		{#if showFilters}
			<Card class="p-4 bg-gray-50 dark:bg-gray-900/50">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="date-from" class="text-sm font-medium mb-2 block">Date From</label>
						<Input id="date-from" type="date" bind:value={dateFrom} class="w-full" />
					</div>
					<div>
						<label for="date-to" class="text-sm font-medium mb-2 block">Date To</label>
						<Input id="date-to" type="date" bind:value={dateTo} class="w-full" />
					</div>
				</div>
			</Card>
		{/if}

	<!-- Jobs Display -->
	<div class="mt-6">
		{#if currentView === 'kanban'}
			<!-- Kanban Board View -->
			<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
				{#each Object.entries(jobsByStatus()) as [status, jobs]}
					{#if statusFilter === 'all' || statusFilter === status}
						<Card class="flex flex-col h-fit bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800">
							<div class="p-4 border-b border-gray-200 dark:border-gray-800">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										{#if STATUS_META[status]}
											<span
												class="px-2 py-1 rounded-full text-xs font-semibold {STATUS_META[status].bgColor} {STATUS_META[status].color}"
											>
												{STATUS_META[status].title}
											</span>
										{/if}
											<Badge class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{jobs.length}</Badge>
									</div>
								</div>
							</div>
							<div class="p-2 space-y-3 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto">
								{#each jobs as job (job.id)}
									{@const customer = job.customer}
									<Card
										class="p-4 bg-white dark:bg-gray-800 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-sky-500"
										role="button"
										tabindex={0}
										onclick={() => selectJob(job.id)}
										onkeydown={(e) => e.key === 'Enter' || e.key === ' ' ? selectJob(job.id) : null}
									>
										<div class="space-y-2">
											<div class="flex items-start justify-between">
												<h3 class="font-semibold text-sm line-clamp-2 flex-1">{job.title}</h3>
												{#if job.priority && PRIORITY_META[job.priority]}
													<Badge
														class="text-xs {PRIORITY_META[job.priority].bgColor} {PRIORITY_META[job.priority].color}"
													>
														{PRIORITY_META[job.priority].title}
													</Badge>
												{/if}
											</div>

											{#if customer}
												<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
													<User2 class="size-3" />
													<span>{customer.firstName} {customer.lastName}</span>
												</div>
											{/if}

											{#if job.scheduledDate}
												<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
													<Calendar class="size-3" />
													<span>{fmtDateShort(job.scheduledDate)}</span>
					</div>
				{/if}

											{#if job.progress !== undefined}
												<div class="space-y-1">
													<div class="flex items-center justify-between text-xs">
														<span class="text-gray-600 dark:text-gray-400">Progress</span>
														<span class="font-medium">{job.progress}%</span>
													</div>
													<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
														<div
															class="bg-sky-500 h-2 rounded-full transition-all duration-300"
															style="width: {Number(job.progress) || 0}%"
														></div>
													</div>
												</div>
			{/if}

											{#if job.amount}
												<div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
													{currency(job.amount)}
								</div>
						{/if}

											<div class="flex items-center gap-2 pt-2">
												<Button
													variant="ghost"
													size="sm"
													class="flex-1 text-xs"
													onclick={(e) => {
														e.stopPropagation();
														viewJob(job);
													}}
												>
													<Eye class="size-3 mr-1" /> View
												</Button>
											</div>
					</div>
									</Card>
								{/each}
								{#if jobs.length === 0}
									<div class="text-center py-8 text-sm text-gray-400">No jobs in this status</div>
				{/if}
			</div>
		</Card>
					{/if}
				{/each}
			</div>

		{:else if currentView === 'list'}
			<!-- List View -->
			<Card class="overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50 dark:bg-gray-900/50 border-b">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
									Job
								</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
									Customer
								</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
									Status
								</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
									Priority
								</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
									Date
								</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
									Progress
								</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
									Amount
								</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 dark:divide-gray-800">
							{#each filteredJobs() as job (job.id)}
								{@const customer = job.customer}
								<tr
									class="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
									role="button"
									tabindex={0}
									onclick={() => selectJob(job.id)}
									onkeydown={(e) => e.key === 'Enter' || e.key === ' ' ? selectJob(job.id) : null}
								>
									<td class="px-6 py-4">
										<div class="font-semibold">{job.title}</div>
										{#if job.description}
											<div class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
												{job.description}
											</div>
										{/if}
									</td>
									<td class="px-6 py-4">
										{#if customer}
											<div class="flex items-center gap-2">
												<User2 class="size-4 text-gray-400" />
												<span>{customer.firstName} {customer.lastName}</span>
											</div>
										{:else}
											<span class="text-gray-400">No customer</span>
										{/if}
									</td>
									<td class="px-6 py-4">
										{#if STATUS_META[job.status]}
											<Badge
												class="{STATUS_META[job.status].bgColor} {STATUS_META[job.status].color}"
											>
												{STATUS_META[job.status].title}
											</Badge>
										{/if}
									</td>
									<td class="px-6 py-4">
										{#if job.priority && PRIORITY_META[job.priority]}
											<Badge
												class="{PRIORITY_META[job.priority].bgColor} {PRIORITY_META[job.priority].color}"
											>
												{PRIORITY_META[job.priority].title}
											</Badge>
										{:else}
											<span class="text-gray-400">-</span>
										{/if}
									</td>
									<td class="px-6 py-4 text-sm">
										{#if job.scheduledDate}
											<div class="flex items-center gap-2">
												<Calendar class="size-4 text-gray-400" />
												<span>{fmtDateShort(job.scheduledDate)}</span>
											</div>
										{:else}
											<span class="text-gray-400">-</span>
										{/if}
									</td>
									<td class="px-6 py-4">
										{#if job.progress !== undefined}
											<div class="flex items-center gap-2 min-w-[120px]">
													<div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
														<div
															class="bg-sky-500 h-2 rounded-full transition-all"
															style="width: {Number(job.progress) || 0}%"
														></div>
						</div>
												<span class="text-xs font-medium w-8">{job.progress}%</span>
					</div>
										{:else}
											<span class="text-gray-400">-</span>
										{/if}
									</td>
									<td class="px-6 py-4 font-semibold">{currency(job.amount || 0)}</td>
									<td class="px-6 py-4">
										<Button
											variant="ghost"
											size="sm"
											onclick={(e) => {
												e.stopPropagation();
												viewJob(job);
											}}
										>
											<Eye class="size-4" />
										</Button>
									</td>
								</tr>
				{/each}
						</tbody>
					</table>
				</div>
				{#if filteredJobs().length === 0}
					<div class="py-24 text-center text-gray-400">No jobs found</div>
				{/if}
		</Card>

		{:else if currentView === 'grid'}
			<!-- Grid View -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{#each filteredJobs() as job (job.id)}
					{@const customer = job.customer}
					<Card
						class="p-5 hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-sky-500"
						role="button"
						tabindex={0}
						onclick={() => selectJob(job.id)}
						onkeydown={(e) => e.key === 'Enter' || e.key === ' ' ? selectJob(job.id) : null}
					>
						<div class="space-y-3">
							<div class="flex items-start justify-between">
								<h3 class="font-semibold text-lg line-clamp-2 flex-1">{job.title}</h3>
								{#if job.priority && PRIORITY_META[job.priority]}
									<Badge
										class="text-xs {PRIORITY_META[job.priority].bgColor} {PRIORITY_META[job.priority].color}"
									>
										{PRIORITY_META[job.priority].title}
									</Badge>
								{/if}
							</div>

							{#if STATUS_META[job.status]}
								<Badge class="{STATUS_META[job.status].bgColor} {STATUS_META[job.status].color}">
									{STATUS_META[job.status].title}
								</Badge>
							{/if}

							{#if customer}
								<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
									<User2 class="size-4" />
									<span>{customer.firstName} {customer.lastName}</span>
								</div>
							{/if}

							{#if job.address}
								<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
									<MapPin class="size-4" />
									<span class="line-clamp-1">{job.address}</span>
								</div>
							{/if}

							{#if job.scheduledDate}
								<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
									<Calendar class="size-4" />
									<span>{fmtDate(job.scheduledDate)}</span>
								</div>
							{/if}

							{#if job.progress !== undefined}
								<div class="space-y-1">
									<div class="flex items-center justify-between text-xs">
										<span class="text-gray-600 dark:text-gray-400">Progress</span>
										<span class="font-medium">{job.progress}%</span>
									</div>
									<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
										<div
											class="bg-sky-500 h-2 rounded-full transition-all"
											style="width: {Number(job.progress) || 0}%"
										></div>
									</div>
								</div>
							{/if}

							{#if job.amount}
								<div class="text-lg font-bold text-gray-900 dark:text-gray-100">
									{currency(job.amount)}
								</div>
							{/if}

							{#if job.crewDetails}
								<div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
									<Users class="size-4" />
									<span>{job.crewDetails}</span>
								</div>
							{/if}

							<div class="flex items-center gap-2 pt-2 border-t">
								<Button
									variant="ghost"
									size="sm"
									class="flex-1"
									onclick={(e) => {
										e.stopPropagation();
										viewJob(job);
									}}
								>
									<Eye class="size-4 mr-1" /> View Details
								</Button>
							</div>
					</div>
					</Card>
				{/each}
			</div>
			{#if filteredJobs().length === 0}
				<div class="py-24 text-center text-gray-400">No jobs found</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
