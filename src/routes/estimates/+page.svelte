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
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    export let data: { estimates: any[]; q: string; status: string };

	type EstimateStatus = 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Declined' | 'Expired' | 'Invoiced' | 'Converted';

    type Estimate = any;
    const estimates: Estimate[] = data.estimates;

    let searchText = data.q || '';
    let statusFilter: 'All' | EstimateStatus = (data.status as any) || 'All';
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

    $: filtered = estimates
        .filter((e) => (statusFilter === 'All' ? true : e.status === statusFilter))
        .filter((e) =>
            searchText
                ? [`${e.first_name ?? ''} ${e.last_name ?? ''}`]
                        .join(' ')
                        .toLowerCase()
                        .includes(searchText.toLowerCase())
                : true
        )
        .toSorted((a, b) => {
            if (sortBy === 'Newest') return (String(b.created_at ?? '')).localeCompare(String(a.created_at ?? ''));
            if (sortBy === 'Oldest') return (String(a.created_at ?? '')).localeCompare(String(b.created_at ?? ''));
            if (sortBy === 'Amount') return (Number(b.total_amount ?? 0)) - (Number(a.total_amount ?? 0));
            return (`${a.first_name ?? ''} ${a.last_name ?? ''}`).localeCompare(`${b.first_name ?? ''} ${b.last_name ?? ''}`);
        });

    $: if (browser) updateUrl();

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


