<script lang="ts">
	import { goto } from '$app/navigation';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Select from '$lib/components/ui/select';
	import StatCard from '$lib/components/StatCard.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	import {
		AlertCircle,
		Calendar,
		CheckCircle2,
		Clock,
		DollarSign,
		Eye,
		FileText,
		Filter,
		Grid3x3,
		LayoutGrid,
		List,
		MapPin,
		Plus,
		Search,
		TrendingUp,
		User2,
		Users
	} from '@lucide/svelte/icons';

	const { data } = $props<{ data: any }>();

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
		s
			? new Date(s).toLocaleDateString(undefined, {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				})
			: '-';
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
					`${job.customer?.firstName || ''} ${job.customer?.lastName || ''}`
						.toLowerCase()
						.includes(query) ||
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

	const statusOrder = ['scheduled', 'in_progress', 'completed', 'pending_payment', 'cancelled'];

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
	<title>Jobs Management | ROOFPILOT CRM</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl space-y-6 p-6">
	<!-- Page Title Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">Active Jobs</h1>
			<p class="text-muted-foreground mt-0.5 text-sm">
				Manage projects, track task progression, and monitor work status
			</p>
		</div>
		<Button size="sm" onclick={openNewJob} class="shrink-0 gap-2 shadow-sm">
			<Plus class="size-4" />
			New Job
		</Button>
	</div>

	<!-- Statistics Summary Row -->
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
		<StatCard
			label="Total Jobs"
			value={data.stats?.total || 0}
			icon={FileText}
			colorClass="text-slate-500"
		/>
		<StatCard
			label="Scheduled"
			value={data.stats?.scheduled || 0}
			icon={Calendar}
			colorClass="text-blue-500"
		/>
		<StatCard
			label="In Progress"
			value={data.stats?.inProgress || 0}
			icon={Clock}
			colorClass="text-amber-500"
		/>
		<StatCard
			label="Completed"
			value={data.stats?.completed || 0}
			icon={CheckCircle2}
			colorClass="text-emerald-500"
		/>
		<StatCard
			label="Pending Pay"
			value={data.stats?.pendingPayment || 0}
			icon={DollarSign}
			colorClass="text-violet-500"
		/>
		<StatCard
			label="High Priority"
			value={data.stats?.highPriority || 0}
			icon={AlertCircle}
			colorClass="text-red-500"
		/>
		<StatCard
			label="Revenue"
			value={currency(data.stats?.totalRevenue || 0)}
			icon={TrendingUp}
			colorClass="text-emerald-500"
		/>
	</div>

	<!-- Filter Controls & View Switching -->
	<div
		class="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between"
	>
		<!-- Active Filters -->
		<div class="flex flex-1 flex-wrap items-center gap-3">
			<div class="relative w-full max-w-xs sm:w-64">
				<Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					class="h-9 pl-9 text-sm"
					placeholder="Search details..."
					bind:value={searchText}
					onkeydown={(e) => e.key === 'Enter' && applyFilters()}
				/>
			</div>

			<Select.Root type="single" bind:value={statusFilter}>
				<Select.Trigger class="h-9 min-w-[130px] text-sm">
					{statusOptions.find((o) => o.value === statusFilter)?.label || 'All Statuses'}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						{#each statusOptions as opt}
							<Select.Item value={opt.value} class="text-sm">{opt.label}</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>

			<Select.Root type="single" bind:value={priorityFilter}>
				<Select.Trigger class="h-9 min-w-[130px] text-sm">
					{priorityOptions.find((o) => o.value === priorityFilter)?.label || 'All Priorities'}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						{#each priorityOptions as opt}
							<Select.Item value={opt.value} class="text-sm">{opt.label}</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>

			<Button
				variant="outline"
				size="sm"
				onclick={() => (showFilters = !showFilters)}
				class="h-9 gap-1.5"
			>
				<Filter class="size-4" /> Filters
			</Button>

			<Button size="sm" onclick={applyFilters} class="h-9">Apply</Button>

			{#if statusFilter !== 'all' || priorityFilter !== 'all' || searchText || dateFrom || dateTo}
				<Button
					variant="ghost"
					size="sm"
					onclick={clearFilters}
					class="text-muted-foreground h-9 hover:text-foreground">Clear</Button
				>
			{/if}
		</div>

		<!-- View Switch Toggle buttons -->
		<div
			class="flex items-center gap-1 self-start rounded-lg bg-slate-100 p-1 sm:self-auto dark:bg-slate-800"
		>
			<Button
				variant={currentView === 'kanban' ? 'secondary' : 'ghost'}
				size="icon"
				class="size-8 rounded-md"
				onclick={() => changeView('kanban')}
				title="Kanban Board View"
			>
				<LayoutGrid class="size-4" />
			</Button>
			<Button
				variant={currentView === 'list' ? 'secondary' : 'ghost'}
				size="icon"
				class="size-8 rounded-md"
				onclick={() => changeView('list')}
				title="List View"
			>
				<List class="size-4" />
			</Button>
			<Button
				variant={currentView === 'grid' ? 'secondary' : 'ghost'}
				size="icon"
				class="size-8 rounded-md"
				onclick={() => changeView('grid')}
				title="Grid Cards View"
			>
				<Grid3x3 class="size-4" />
			</Button>
		</div>
	</div>

	<!-- Date filters expanded panel -->
	{#if showFilters}
		<Card class="border border-border bg-slate-50/50 p-4 dark:bg-slate-900/30">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="space-y-1.5">
					<label for="date-from" class="text-muted-foreground text-xs font-semibold"
						>Date From</label
					>
					<Input id="date-from" type="date" bind:value={dateFrom} class="h-9" />
				</div>
				<div class="space-y-1.5">
					<label for="date-to" class="text-muted-foreground text-xs font-semibold">Date To</label>
					<Input id="date-to" type="date" bind:value={dateTo} class="h-9" />
				</div>
			</div>
		</Card>
	{/if}

	<!-- View render block -->
	<div class="mt-4">
		{#if currentView === 'kanban'}
			<!-- Kanban Board View (Scrollable horizontally) -->
			<div class="scrollbar-thin flex gap-4 overflow-x-auto pb-6">
				{#each statusOrder as status}
					{#if statusFilter === 'all' || statusFilter === status}
						{@const columnJobs = jobsByStatus()[status] || []}

						<div
							class="flex h-fit w-72 shrink-0 flex-col rounded-xl border border-border bg-slate-50/50 md:w-80 dark:bg-slate-900/10"
						>
							<!-- Column Header -->
							<div
								class="flex items-center justify-between rounded-t-xl border-b border-border bg-card/40 p-4"
							>
								<div class="flex items-center gap-2">
									<StatusBadge type="job" value={status} />
									<Badge
										variant="secondary"
										class="bg-slate-200/50 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
									>
										{columnJobs.length}
									</Badge>
								</div>
							</div>

							<!-- Scrollable card body container -->
							<div
								class="custom-scrollbar max-h-[calc(100vh-360px)] min-h-[300px] space-y-3 overflow-y-auto p-3"
							>
								{#each columnJobs as job (job.id)}
									{@const customer = job.customer}

									<Card
										class="group cursor-pointer border border-border bg-card p-4 transition-all hover:border-slate-300 hover:shadow-xs dark:hover:border-slate-700"
										role="button"
										tabindex={0}
										onclick={() => selectJob(job.id)}
										onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectJob(job.id)}
									>
										<div class="space-y-3">
											<!-- Card top badges -->
											<div class="flex items-start justify-between gap-2">
												<h3
													class="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary"
												>
													{job.title}
												</h3>
												{#if job.priority}
													<StatusBadge type="priority" value={job.priority} class="shrink-0" />
												{/if}
											</div>

											<!-- Details metadata rows -->
											<div class="space-y-1.5">
												{#if customer}
													<div class="text-muted-foreground flex items-center gap-2 text-xs">
														<User2 class="size-3.5 shrink-0" />
														<span class="truncate">{customer.firstName} {customer.lastName}</span>
													</div>
												{/if}

												{#if job.scheduledDate}
													<div class="text-muted-foreground flex items-center gap-2 text-xs">
														<Calendar class="size-3.5 shrink-0" />
														<span>{fmtDateShort(job.scheduledDate)}</span>
													</div>
												{/if}
											</div>

											<!-- Progress Bar -->
											{#if job.progress !== undefined}
												<ProgressBar progress={job.progress} showText={true} />
											{/if}

											<!-- Card footer values -->
											<div
												class="mt-2 flex items-center justify-between border-t border-border/60 pt-2.5"
											>
												{#if job.amount}
													<span class="text-sm font-bold text-foreground">
														{currency(job.amount)}
													</span>
												{:else}
													<span></span>
												{/if}

												<Button
													variant="ghost"
													size="sm"
													class="h-7 gap-1 px-2.5 text-xs hover:bg-slate-100"
													onclick={(e) => {
														e.stopPropagation();
														viewJob(job);
													}}
												>
													<Eye class="size-3" /> View
												</Button>
											</div>
										</div>
									</Card>
								{/each}

								{#if columnJobs.length === 0}
									<EmptyState title="No Jobs" description="No jobs scheduled in this phase yet." />
								{/if}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{:else if currentView === 'list'}
			<!-- List View Table design -->
			<Card class="overflow-hidden border border-border shadow-xs">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="border-b border-border bg-slate-50/50 dark:bg-slate-900/30">
							<tr>
								<th
									class="text-muted-foreground px-5 py-3 text-left text-xs font-semibold tracking-wider uppercase"
									>Job Details</th
								>
								<th
									class="text-muted-foreground px-5 py-3 text-left text-xs font-semibold tracking-wider uppercase"
									>Customer</th
								>
								<th
									class="text-muted-foreground px-5 py-3 text-left text-xs font-semibold tracking-wider uppercase"
									>Status</th
								>
								<th
									class="text-muted-foreground px-5 py-3 text-left text-xs font-semibold tracking-wider uppercase"
									>Priority</th
								>
								<th
									class="text-muted-foreground px-5 py-3 text-left text-xs font-semibold tracking-wider uppercase"
									>Scheduled</th
								>
								<th
									class="text-muted-foreground px-5 py-3 text-left text-xs font-semibold tracking-wider uppercase"
									>Progress</th
								>
								<th
									class="text-muted-foreground px-5 py-3 text-left text-xs font-semibold tracking-wider uppercase"
									>Amount</th
								>
								<th
									class="text-muted-foreground w-16 px-5 py-3 text-left text-xs font-semibold tracking-wider uppercase"
								></th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border bg-card">
							{#each filteredJobs() as job (job.id)}
								{@const customer = job.customer}
								<tr
									class="group cursor-pointer transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/10"
									onclick={() => selectJob(job.id)}
								>
									<td class="px-5 py-3.5">
										<div
											class="text-sm font-semibold text-foreground transition-colors group-hover:text-primary"
										>
											{job.title}
										</div>
										{#if job.description}
											<div class="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
												{job.description}
											</div>
										{/if}
									</td>
									<td class="px-5 py-3.5 text-sm">
										{#if customer}
											<div class="flex items-center gap-2">
												<User2 class="text-muted-foreground size-4" />
												<span>{customer.firstName} {customer.lastName}</span>
											</div>
										{:else}
											<span class="text-muted-foreground">-</span>
										{/if}
									</td>
									<td class="px-5 py-3.5">
										<StatusBadge type="job" value={job.status} />
									</td>
									<td class="px-5 py-3.5">
										{#if job.priority}
											<StatusBadge type="priority" value={job.priority} />
										{:else}
											<span class="text-muted-foreground">-</span>
										{/if}
									</td>
									<td class="text-muted-foreground px-5 py-3.5 text-sm">
										{#if job.scheduledDate}
											<div class="flex items-center gap-2">
												<Calendar class="size-4" />
												<span>{fmtDateShort(job.scheduledDate)}</span>
											</div>
										{:else}
											<span>-</span>
										{/if}
									</td>
									<td class="px-5 py-3.5">
										{#if job.progress !== undefined}
											<div class="flex min-w-[120px] items-center gap-3">
												<ProgressBar progress={job.progress} class="flex-1" />
												<span class="text-muted-foreground w-8 text-xs font-semibold"
													>{job.progress}%</span
												>
											</div>
										{:else}
											<span class="text-muted-foreground">-</span>
										{/if}
									</td>
									<td class="px-5 py-3.5 text-sm font-bold text-foreground">
										{currency(job.amount || 0)}
									</td>
									<td class="px-5 py-3.5 text-right">
										<Button
											variant="ghost"
											size="icon"
											class="size-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
											onclick={(e) => {
												e.stopPropagation();
												viewJob(job);
											}}
										>
											<Eye class="text-muted-foreground size-4" />
										</Button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if filteredJobs().length === 0}
					<EmptyState title="No Jobs Found" description="No active projects match your filters." />
				{/if}
			</Card>
		{:else if currentView === 'grid'}
			<!-- Grid View Card Layout -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each filteredJobs() as job (job.id)}
					{@const customer = job.customer}
					<Card
						class="group cursor-pointer border border-border bg-card p-5 transition-all hover:border-slate-300 hover:shadow-sm dark:hover:border-slate-700"
						onclick={() => selectJob(job.id)}
					>
						<div class="space-y-4">
							<div class="flex items-start justify-between gap-2">
								<h3
									class="line-clamp-2 text-base font-semibold text-foreground transition-colors group-hover:text-primary"
								>
									{job.title}
								</h3>
								{#if job.priority}
									<StatusBadge type="priority" value={job.priority} />
								{/if}
							</div>

							<div class="flex flex-wrap items-center gap-2">
								<StatusBadge type="job" value={job.status} />
							</div>

							<div class="space-y-2.5 border-t border-border/60 pt-1.5">
								{#if customer}
									<div class="text-muted-foreground flex items-center gap-2 text-xs">
										<User2 class="size-4 shrink-0" />
										<span>{customer.firstName} {customer.lastName}</span>
									</div>
								{/if}

								{#if job.address}
									<div class="text-muted-foreground flex items-center gap-2 text-xs">
										<MapPin class="size-4 shrink-0" />
										<span class="truncate">{job.address}</span>
									</div>
								{/if}

								{#if job.scheduledDate}
									<div class="text-muted-foreground flex items-center gap-2 text-xs">
										<Calendar class="size-4 shrink-0" />
										<span>{fmtDate(job.scheduledDate)}</span>
									</div>
								{/if}
							</div>

							{#if job.progress !== undefined}
								<ProgressBar progress={job.progress} showText={true} />
							{/if}

							<div class="mt-2 flex items-center justify-between border-t border-border/60 pt-3">
								<span class="text-base font-bold text-foreground">
									{currency(job.amount || 0)}
								</span>

								<Button
									variant="ghost"
									size="sm"
									class="h-8 gap-1.5 px-3 text-xs hover:bg-slate-100"
									onclick={(e) => {
										e.stopPropagation();
										viewJob(job);
									}}
								>
									<Eye class="size-3.5" /> Details
								</Button>
							</div>
						</div>
					</Card>
				{/each}
			</div>

			{#if filteredJobs().length === 0}
				<EmptyState
					title="No Jobs Found"
					description="Try editing your search filters or add a new job."
				/>
			{/if}
		{/if}
	</div>
</div>
