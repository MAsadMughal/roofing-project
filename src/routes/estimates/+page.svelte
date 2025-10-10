<script lang="ts">
    import Button from '$lib/components/ui/button/button.svelte';
    import Input from '$lib/components/ui/input/input.svelte';
    import Select from '$lib/components/ui/select/select.svelte';
    import Table from '$lib/components/ui/table/table.svelte';
    import Download from '@lucide/svelte/icons/download';
    import Eye from '@lucide/svelte/icons/eye';
    import FileCheck from '@lucide/svelte/icons/file-check';
    import FileX from '@lucide/svelte/icons/file-x';
    import Plus from '@lucide/svelte/icons/plus';
    import SearchIcon from '@lucide/svelte/icons/search';
    import Send from '@lucide/svelte/icons/send-horizontal';

	type EstimateStatus = 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Declined' | 'Expired' | 'Invoiced' | 'Converted';

	type Estimate = {
		id: string;
		number: string;
		date: string; // ISO YYYY-MM-DD
		customer: string;
		amount: number; // USD
		status: EstimateStatus;
	};

	const estimates: Estimate[] = [
		{ id: 'e-101', number: 'EST-101', date: '2025-10-02', customer: 'John Doe', amount: 1250, status: 'Draft' },
		{ id: 'e-102', number: 'EST-102', date: '2025-10-01', customer: 'Mike Taylor', amount: 5200, status: 'Sent' },
		{ id: 'e-103', number: 'EST-103', date: '2025-09-30', customer: 'Sarah Lee', amount: 8300, status: 'Viewed' },
		{ id: 'e-104', number: 'EST-104', date: '2025-09-29', customer: 'James Smith', amount: 2400, status: 'Accepted' },
		{ id: 'e-105', number: 'EST-105', date: '2025-09-28', customer: 'Emma Brown', amount: 3100, status: 'Declined' },
		{ id: 'e-106', number: 'EST-106', date: '2025-09-27', customer: 'Oliver Gray', amount: 4100, status: 'Invoiced' },
		{ id: 'e-107', number: 'EST-107', date: '2025-09-26', customer: 'Ava Wilson', amount: 9600, status: 'Converted' },
		{ id: 'e-108', number: 'EST-108', date: '2025-09-25', customer: 'Lucas Green', amount: 1500, status: 'Expired' }
	];

	let searchText = '';
	let statusFilter: 'All' | EstimateStatus = 'All';
	let sortBy: 'Newest' | 'Oldest' | 'Amount' | 'Customer' = 'Newest';

	function badgeClass(status: EstimateStatus) {
		switch (status) {
			case 'Draft':
				return 'bg-muted text-foreground';
			case 'Sent':
				return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
			case 'Viewed':
				return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300';
			case 'Accepted':
				return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
			case 'Declined':
				return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
			case 'Expired':
				return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
			case 'Invoiced':
				return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
			case 'Converted':
				return 'bg-muted text-muted-foreground';
		}
	}

	function formatAmount(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
	}

	$: filtered = estimates
		.filter((e) => (statusFilter === 'All' ? true : e.status === statusFilter))
		.filter((e) =>
			searchText
				? [e.number, e.customer].join(' ').toLowerCase().includes(searchText.toLowerCase())
				: true
		)
		.toSorted((a, b) => {
			if (sortBy === 'Newest') return b.date.localeCompare(a.date);
			if (sortBy === 'Oldest') return a.date.localeCompare(b.date);
			if (sortBy === 'Amount') return b.amount - a.amount;
			return a.customer.localeCompare(b.customer);
		});

	function sendEstimate(e: Estimate) {
		console.log('Send', e.id);
	}
	function viewEstimate(e: Estimate) {
		console.log('View', e.id);
	}
	function convertEstimate(e: Estimate) {
		console.log('Convert', e.id);
	}
</script>

<svelte:head>
	<title>Estimates</title>
</svelte:head>

<div class="w-full">
	<h1 class="text-3xl font-extrabold tracking-tight mb-4">ESTIMATES</h1>

	<!-- Toolbar -->
	<div class="flex flex-wrap items-center gap-3 mb-4">
    <div class="relative grow min-w-64">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search estimates..." bind:value={searchText} class="pl-9" />
    </div>
    <Select bind:value={statusFilter} items={[{value:'All',label:'All statuses'},{value:'Draft'},{value:'Sent'},{value:'Viewed'},{value:'Accepted'},{value:'Declined'},{value:'Expired'},{value:'Invoiced'},{value:'Converted'}]} />
    <Select bind:value={sortBy} items={[{value:'Newest'},{value:'Oldest'},{value:'Amount'},{value:'Customer'}]} />
		<Button class="ml-auto h-10">
			<Plus class="size-4" />
			New Estimate
		</Button>
		<Button variant="outline" class="h-10">
			<Download class="size-4" />
			Export CSV
		</Button>
	</div>

	<!-- Table -->
    <Table>
			<thead class="bg-muted/50 text-left">
				<tr>
					<th class="px-4 py-3 font-medium">Number</th>
					<th class="px-4 py-3 font-medium">Date</th>
					<th class="px-4 py-3 font-medium">Customer</th>
					<th class="px-4 py-3 font-medium text-right">Amount</th>
					<th class="px-4 py-3 font-medium">Status</th>
					<th class="px-4 py-3 font-medium text-right">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filtered as est}
					<tr class="border-t">
						<td class="px-4 py-3 font-semibold">{est.number}</td>
						<td class="px-4 py-3">{est.date}</td>
						<td class="px-4 py-3">{est.customer}</td>
						<td class="px-4 py-3 text-right">{formatAmount(est.amount)}</td>
						<td class="px-4 py-3">
							<span class={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${badgeClass(est.status)}`}>{est.status}</span>
						</td>
						<td class="px-4 py-3 text-right">
							<div class="flex justify-end gap-2">
								<Button variant="outline" class="h-8" on:click={() => sendEstimate(est)}>
									<Send class="size-4" />
									Send
								</Button>
								<Button variant="outline" class="h-8" on:click={() => viewEstimate(est)}>
									<Eye class="size-4" />
									View
								</Button>
								{#if est.status === 'Accepted'}
									<Button class="h-8" on:click={() => convertEstimate(est)}>
										<FileCheck class="size-4" />
										Convert
									</Button>
								{:else if est.status === 'Declined'}
									<Button variant="destructive" class="h-8">
										<FileX class="size-4" />
										Archive
									</Button>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
    </Table>

	<div class="mt-3 text-xs text-muted-foreground">Showing {filtered.length} of {estimates.length} estimates</div>
</div>


