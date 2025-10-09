<script lang="ts">
    import Button from '$lib/components/ui/button/button.svelte';
    import Input from '$lib/components/ui/input/input.svelte';
    import Table from '$lib/components/ui/table/table.svelte';
    import Select from '$lib/components/ui/select/select.svelte';
    import SearchIcon from '@lucide/svelte/icons/search';
	import Plus from '@lucide/svelte/icons/plus';
	import Download from '@lucide/svelte/icons/download';
	import Send from '@lucide/svelte/icons/send-horizontal';
	import Eye from '@lucide/svelte/icons/eye';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import FileText from '@lucide/svelte/icons/file-text';

	type ProposalStatus = 'Draft' | 'Sent' | 'Viewed' | 'Approved' | 'Declined' | 'Expired';

	type Proposal = {
		id: string;
		number: string;
		date: string; // ISO YYYY-MM-DD
		client: string;
		amount: number;
		status: ProposalStatus;
	};

	const proposals: Proposal[] = [
		{ id: 'p-201', number: 'PR-201', date: '2025-10-02', client: 'Sarah Lee', amount: 7450, status: 'Draft' },
		{ id: 'p-202', number: 'PR-202', date: '2025-10-01', client: 'John Doe', amount: 5200, status: 'Sent' },
		{ id: 'p-203', number: 'PR-203', date: '2025-09-30', client: 'James Smith', amount: 9800, status: 'Viewed' },
		{ id: 'p-204', number: 'PR-204', date: '2025-09-29', client: 'Emma Brown', amount: 4100, status: 'Approved' },
		{ id: 'p-205', number: 'PR-205', date: '2025-09-28', client: 'Mike Taylor', amount: 3675, status: 'Declined' },
		{ id: 'p-206', number: 'PR-206', date: '2025-09-27', client: 'Olivia Green', amount: 2650, status: 'Expired' }
	];

	let searchText = '';
	let statusFilter: 'All' | ProposalStatus = 'All';
	let sortBy: 'Newest' | 'Oldest' | 'Amount' | 'Client' = 'Newest';

	function badgeClass(status: ProposalStatus) {
		switch (status) {
			case 'Draft':
				return 'bg-muted text-foreground';
			case 'Sent':
				return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
			case 'Viewed':
				return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300';
			case 'Approved':
				return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
			case 'Declined':
				return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
			case 'Expired':
				return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
		}
	}

	function formatAmount(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
	}

	$: filtered = proposals
		.filter((p) => (statusFilter === 'All' ? true : p.status === statusFilter))
		.filter((p) => (searchText ? [p.number, p.client].join(' ').toLowerCase().includes(searchText.toLowerCase()) : true))
		.toSorted((a, b) => {
			if (sortBy === 'Newest') return b.date.localeCompare(a.date);
			if (sortBy === 'Oldest') return a.date.localeCompare(b.date);
			if (sortBy === 'Amount') return b.amount - a.amount;
			return a.client.localeCompare(b.client);
		});

	function sendProposal(p: Proposal) { console.log('Send', p.id); }
	function viewProposal(p: Proposal) { console.log('View', p.id); }
	function approveProposal(p: Proposal) { console.log('Approve', p.id); }
	function declineProposal(p: Proposal) { console.log('Decline', p.id); }
</script>

<svelte:head>
	<title>Proposals</title>
</svelte:head>

<div class="w-full">
	<h1 class="text-3xl font-extrabold tracking-tight mb-4">PROPOSALS</h1>

	<!-- Toolbar -->
	<div class="flex flex-wrap items-center gap-3 mb-4">
    <div class="relative grow min-w-64">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search proposals..." bind:value={searchText} class="pl-9" />
    </div>
    <Select bind:value={statusFilter} items={[{value:'All',label:'All statuses'},{value:'Draft'},{value:'Sent'},{value:'Viewed'},{value:'Approved'},{value:'Declined'},{value:'Expired'}]} />
    <Select bind:value={sortBy} items={[{value:'Newest'},{value:'Oldest'},{value:'Amount'},{value:'Client'}]} />
		<Button class="ml-auto h-10">
			<Plus class="size-4" />
			New Proposal
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
					<th class="px-4 py-3 font-medium">Client</th>
					<th class="px-4 py-3 font-medium text-right">Amount</th>
					<th class="px-4 py-3 font-medium">Status</th>
					<th class="px-4 py-3 font-medium text-right">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filtered as p}
					<tr class="border-t">
						<td class="px-4 py-3 font-semibold">{p.number}</td>
						<td class="px-4 py-3">{p.date}</td>
						<td class="px-4 py-3">{p.client}</td>
						<td class="px-4 py-3 text-right">{formatAmount(p.amount)}</td>
						<td class="px-4 py-3">
							<span class={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${badgeClass(p.status)}`}>{p.status}</span>
						</td>
						<td class="px-4 py-3 text-right">
							<div class="flex justify-end gap-2">
								<Button variant="outline" class="h-8" on:click={() => sendProposal(p)}>
									<Send class="size-4" />
									Send
								</Button>
								<Button variant="outline" class="h-8" on:click={() => viewProposal(p)}>
									<Eye class="size-4" />
									View
								</Button>
								{#if p.status === 'Viewed' || p.status === 'Sent'}
									<Button class="h-8" on:click={() => approveProposal(p)}>
										<Check class="size-4" />
										Approve
									</Button>
								{/if}
								{#if p.status !== 'Declined' && p.status !== 'Expired'}
									<Button variant="destructive" class="h-8" on:click={() => declineProposal(p)}>
										<X class="size-4" />
										Decline
									</Button>
								{/if}
								<Button variant="outline" class="h-8">
									<FileText class="size-4" />
									PDF
								</Button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
    </Table>

	<div class="mt-3 text-xs text-muted-foreground">Showing {filtered.length} of {proposals.length} proposals</div>
</div>


