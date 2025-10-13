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
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    export let data: { jobs: any[]; q: string; status: string; dateFrom: string; dateTo: string };

	type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

    type Job = any;
    let jobs: Job[] = data.jobs;
    let searchText = data.q || '';
    let statusFilter: 'All' | JobStatus = (data.status as any) || 'All';
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

    function updateUrl() {
        const params = new URLSearchParams($page.url.searchParams);
        if (searchText) params.set('q', searchText); else params.delete('q');
        if (statusFilter && statusFilter !== 'All') params.set('status', statusFilter as string); else params.delete('status');
        const nextSearch = params.toString() ? `?${params.toString()}` : '';
        const currentSearch = $page.url.search;
        const path = $page.url.pathname;
        if (browser && nextSearch !== currentSearch) {
            goto(`${path}${nextSearch}`, { replaceState: true, keepFocus: true, noScroll: true });
        }
    }

    $: filtered = jobs
        .filter((j) => (statusFilter === 'All' ? true : j.status === statusFilter))
        .filter((j) =>
            searchText
                ? [j.title ?? '', j.description ?? '', `${j.first_name ?? ''} ${j.last_name ?? ''}`]
                        .join(' ')
                        .toLowerCase()
                        .includes(searchText.toLowerCase())
                : true
        )
        .toSorted((a, b) => {
            if (sortBy === 'Newest') return (String(b.created_at ?? '')).localeCompare(String(a.created_at ?? ''));
            if (sortBy === 'Oldest') return (String(a.created_at ?? '')).localeCompare(String(b.created_at ?? ''));
            if (sortBy === 'Amount') return 0;
            return (`${a.first_name ?? ''} ${a.last_name ?? ''}`).localeCompare(`${b.first_name ?? ''} ${b.last_name ?? ''}`);
        });

    $: if (browser) updateUrl();

    const columns: { key: JobStatus; title: string }[] = [
        { key: 'scheduled', title: 'Scheduled' },
        { key: 'in_progress', title: 'In Progress' },
        { key: 'completed', title: 'Completed' },
        { key: 'cancelled', title: 'Cancelled' }
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


