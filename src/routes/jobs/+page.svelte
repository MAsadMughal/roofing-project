<script lang="ts">
    import Button from '$lib/components/ui/button/button.svelte';
    import Input from '$lib/components/ui/input/input.svelte';
    import Card from '$lib/components/ui/card/card.svelte';
    import Table from '$lib/components/ui/table/table.svelte';
    import Select from '$lib/components/ui/select/select.svelte';
    import SearchIcon from '@lucide/svelte/icons/search';
	import Plus from '@lucide/svelte/icons/plus';
	import Play from '@lucide/svelte/icons/play';
	import Check from '@lucide/svelte/icons/check';
	import DollarSign from '@lucide/svelte/icons/dollar-sign';
	import Eye from '@lucide/svelte/icons/eye';
	import Calendar from '@lucide/svelte/icons/calendar';
	import User2 from '@lucide/svelte/icons/user-2';

	type JobStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Pending Payment';

	type Job = {
		id: string;
		title: string;
		customer: string;
		address: string;
		assignee?: string;
		date: string; // YYYY-MM-DD
		amount: number;
		status: JobStatus;
	};

	const initialJobs: Job[] = [
		{ id: 'j-1', title: 'Roof Inspection', customer: 'John Doe', address: '123 Main St', assignee: 'Sarah L.', date: '2025-10-02', amount: 250, status: 'Scheduled' },
		{ id: 'j-2', title: 'Shingle Repair', customer: 'Mike Taylor', address: '44 Oak Ave', assignee: 'Alex P.', date: '2025-10-01', amount: 1200, status: 'In Progress' },
		{ id: 'j-3', title: 'Full Re-roof', customer: 'Emma Brown', address: '8 Pine Rd', assignee: 'Team A', date: '2025-09-30', amount: 9800, status: 'Pending Payment' },
		{ id: 'j-4', title: 'Gutter Installation', customer: 'James Smith', address: '77 Lake Blvd', assignee: 'Chris R.', date: '2025-09-28', amount: 2100, status: 'Completed' }
	];

	let jobs: Job[] = initialJobs.slice();
	let searchText = '';
	let statusFilter: 'All' | JobStatus = 'All';
	let sortBy: 'Newest' | 'Oldest' | 'Amount' | 'Customer' = 'Newest';
	let viewMode: 'Board' | 'Table' = 'Board';

	function formatAmount(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
	}

	function advance(job: Job) {
		if (job.status === 'Scheduled') job.status = 'In Progress';
		else if (job.status === 'In Progress') job.status = 'Completed';
		else if (job.status === 'Completed') job.status = 'Pending Payment';
		else if (job.status === 'Pending Payment') job.status = 'Completed';
	}

	$: filtered = jobs
		.filter((j) => (statusFilter === 'All' ? true : j.status === statusFilter))
		.filter((j) =>
			searchText
				? [j.title, j.customer, j.address, j.assignee ?? '']
						.join(' ')
						.toLowerCase()
						.includes(searchText.toLowerCase())
				: true
		)
		.toSorted((a, b) => {
			if (sortBy === 'Newest') return b.date.localeCompare(a.date);
			if (sortBy === 'Oldest') return a.date.localeCompare(b.date);
			if (sortBy === 'Amount') return b.amount - a.amount;
			return a.customer.localeCompare(b.customer);
		});

	const columns: { key: JobStatus; title: string }[] = [
		{ key: 'Scheduled', title: 'Scheduled' },
		{ key: 'In Progress', title: 'In Progress' },
		{ key: 'Completed', title: 'Completed' },
		{ key: 'Pending Payment', title: 'Pending Payment' }
	];
</script>

<svelte:head>
	<title>Jobs</title>
</svelte:head>

<div class="w-full">
	<h1 class="text-3xl font-extrabold tracking-tight mb-4">JOBS</h1>

	<!-- Toolbar -->
	<div class="flex flex-wrap items-center gap-3 mb-4">
    <div class="relative grow min-w-64">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search jobs..." bind:value={searchText} class="pl-9" />
    </div>
    <Select bind:value={statusFilter} items={[{value:'All',label:'All statuses'},{value:'Scheduled'},{value:'In Progress'},{value:'Completed'},{value:'Pending Payment'}]} />
    <Select bind:value={sortBy} items={[{value:'Newest'},{value:'Oldest'},{value:'Amount'},{value:'Customer'}]} />
		<div class="ml-auto flex items-center gap-2 rounded-md border p-1">
			<Button variant={viewMode === 'Board' ? 'default' : 'ghost'} class="h-8" on:click={() => (viewMode = 'Board')}>Board</Button>
			<Button variant={viewMode === 'Table' ? 'default' : 'ghost'} class="h-8" on:click={() => (viewMode = 'Table')}>Table</Button>
		</div>
		<Button class="h-10">
			<Plus class="size-4" />
			New Job
		</Button>
	</div>

	{#if viewMode === 'Board'}
		<!-- Board View -->
        <div class="grid grid-cols-1 md:grid-cols-2  gap-4">
			{#each columns as col}
                <Card>
					<div class="px-4 py-3 font-semibold">{col.title}</div>
					<div class="h-px bg-border"></div>
					<div class="p-3 space-y-3 min-h-32">
						{#each filtered.filter((j) => j.status === col.key) as job}
                            <Card class="border bg-background p-3">
								<div class="flex items-start justify-between gap-3">
									<div>
										<div class="font-semibold">{job.title}</div>
										<div class="text-xs text-muted-foreground flex items-center gap-1">
											<User2 class="size-3.5" /> {job.customer}
										</div>
									</div>
									<div class="text-xs font-semibold">{formatAmount(job.amount)}</div>
								</div>
								<div class="mt-2 flex items-center justify-between text-xs text-muted-foreground">
									<div class="flex items-center gap-1"><Calendar class="size-3.5" /> {job.date}</div>
									<div>{job.assignee}</div>
								</div>
								<div class="mt-3 flex items-center gap-2">
									<Button variant="outline" class="h-8">
										<Eye class="size-4" />
										View
									</Button>
									{#if job.status === 'Scheduled'}
										<Button class="h-8" on:click={() => advance(job)}>
											<Play class="size-4" />
											Start
										</Button>
									{:else if job.status === 'In Progress'}
										<Button class="h-8" on:click={() => advance(job)}>
											<Check class="size-4" />
											Complete
										</Button>
									{:else if job.status === 'Completed'}
										<Button variant="outline" class="h-8" on:click={() => advance(job)}>
											<DollarSign class="size-4" />
											Invoice
										</Button>
									{:else}
										<Button class="h-8" on:click={() => advance(job)}>
											<Check class="size-4" />
											Mark Paid
										</Button>
									{/if}
								</div>
                            </Card>
						{/each}
						{#if filtered.filter((j) => j.status === col.key).length === 0}
							<div class="text-xs text-muted-foreground">No jobs</div>
						{/if}
					</div>
                </Card>
			{/each}
		</div>
	{:else}
		<!-- Table View -->
        <Table>
				<thead class="bg-muted/50 text-left">
					<tr>
						<th class="px-4 py-3 font-medium">Title</th>
						<th class="px-4 py-3 font-medium">Customer</th>
						<th class="px-4 py-3 font-medium">Date</th>
						<th class="px-4 py-3 font-medium">Assignee</th>
						<th class="px-4 py-3 font-medium text-right">Amount</th>
						<th class="px-4 py-3 font-medium">Status</th>
						<th class="px-4 py-3 font-medium text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as job}
						<tr class="border-t">
							<td class="px-4 py-3 font-semibold">{job.title}</td>
							<td class="px-4 py-3">{job.customer}</td>
							<td class="px-4 py-3">{job.date}</td>
							<td class="px-4 py-3">{job.assignee}</td>
							<td class="px-4 py-3 text-right">{formatAmount(job.amount)}</td>
							<td class="px-4 py-3">{job.status}</td>
							<td class="px-4 py-3 text-right">
								<div class="flex justify-end gap-2">
									<Button variant="outline" class="h-8"><Eye class="size-4" /> View</Button>
									<Button class="h-8" on:click={() => advance(job)}>
										{#if job.status === 'Scheduled'}<Play class="size-4" />{:else}<Check class="size-4" />{/if}
										Advance
									</Button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
        </Table>
	{/if}

	<div class="mt-3 text-xs text-muted-foreground">Showing {filtered.length} of {jobs.length} jobs</div>
</div>


