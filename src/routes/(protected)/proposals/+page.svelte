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
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import * as Dialog from '$lib/components/ui/dialog';
    export let data: { proposals: any[]; q: string; status: string };

	type ProposalStatus = 'Draft' | 'Sent' | 'Viewed' | 'Approved' | 'Declined' | 'Expired';

    type Proposal = {
        id: number;
        assignment_id: number;
        estimate_id: number;
        status: string;
        created_at?: string;
        sent_at?: string;
        total_amount?: number;
        first_name?: string;
        last_name?: string;
    };
    const proposals: Proposal[] = data.proposals;

    let searchText = data.q || '';
    let statusFilter: 'All' | ProposalStatus = (data.status as any) || 'All';
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

    // Helper to refresh proposals list after an action
    async function refreshProposals() {
        const params = new URLSearchParams($page.url.searchParams);
        const resp = await fetch(`/api/proposals${params.toString() ? `?${params.toString()}` : ''}`);
        const fresh = await resp.json();
        (proposals as any).splice(0, proposals.length, ...fresh);
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

    function toTitleCase(s: string) {
        const t = (s || '').toLowerCase();
        return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
    }

    $: filtered = proposals
        .filter((p) => (statusFilter === 'All' ? true : toTitleCase(p.status) === statusFilter))
        .filter((p) => (searchText ? [`${p.first_name ?? ''} ${p.last_name ?? ''}`].join(' ').toLowerCase().includes(searchText.toLowerCase()) : true))
        .toSorted((a, b) => {
            if (sortBy === 'Newest') return (String(b.created_at ?? '')).localeCompare(String(a.created_at ?? ''));
            if (sortBy === 'Oldest') return (String(a.created_at ?? '')).localeCompare(String(b.created_at ?? ''));
            if (sortBy === 'Amount') return (Number(b.total_amount ?? 0)) - (Number(a.total_amount ?? 0));
            return (`${a.first_name ?? ''} ${a.last_name ?? ''}`).localeCompare(`${b.first_name ?? ''} ${b.last_name ?? ''}`);
        });

    $: if (browser) updateUrl();

    // Create proposal dialog state
    let showCreate = false;
    let creating = false;
    let assignments: Array<{ id: number; customer_name: string }> = [];
    let selectedAssignmentId: number | null = null;
    let estimates: Array<{ id: number; status: string; total_amount: number }> = [];
    let selectedEstimateId: number | null = null;
    let sendNow = false; // if true -> status sent, else draft
    let formSubject = '';
    let formContent = '';

    async function openCreateDialog() {
        showCreate = true;
        if (assignments.length === 0) {
            const res = await fetch('/api/rep/assignments');
            assignments = (await res.json().catch(() => [])) ?? [];
        }
    }

    async function onSelectAssignment(id: number) {
        selectedAssignmentId = id;
        selectedEstimateId = null;
        estimates = [];
        if (id) {
            const res = await fetch(`/api/assignments/${id}/estimates`);
            estimates = (await res.json().catch(() => [])) ?? [];
        }
    }

    $: if (selectedAssignmentId !== null) {
        // react to selection changes and load estimates
        onSelectAssignment(Number(selectedAssignmentId));
    }

    async function createProposal() {
        if (!selectedAssignmentId) return;
        if (!selectedEstimateId) return;
        creating = true;
        try {
            const res = await fetch('/api/proposals', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ assignment_id: selectedAssignmentId, estimate_id: selectedEstimateId, status: sendNow ? 'sent' : 'draft', subject: formSubject, content: formContent })
            });
            if (res.ok) {
                showCreate = false;
                await refreshProposals();
            }
        } finally {
            creating = false;
        }
    }

    // --- Proposal Actions Implementation ---

    let actionLoading: { [proposalId: number]: string | null } = {}; // For button loading state by action ('send', 'approve', 'decline')

    // Send - move status to 'Sent'
    async function sendProposal(p: Proposal) {
        actionLoading[p.id] = 'send';
        try {
            const res = await fetch(`/api/proposals/${p.id}/actions/send`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' }
            });
            if (res.ok) {
                await refreshProposals();
            }
        } finally {
            actionLoading[p.id] = null;
        }
    }

    // Approve - move status to 'Approved'
    async function approveProposal(p: Proposal) {
        actionLoading[p.id] = 'approve';
        try {
            const res = await fetch(`/api/proposals/${p.id}/actions/approve`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' }
            });
            if (res.ok) {
                await refreshProposals();
            }
        } finally {
            actionLoading[p.id] = null;
        }
    }

    // Decline - move status to 'Declined'
    async function declineProposal(p: Proposal) {
        if (!confirm("Are you sure you want to decline this proposal?")) return;
        actionLoading[p.id] = 'decline';
        try {
            const res = await fetch(`/api/proposals/${p.id}/actions/decline`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' }
            });
            if (res.ok) {
                await refreshProposals();
            }
        } finally {
            actionLoading[p.id] = null;
        }
    }

    // View/Edit within dialog
    let showViewEdit = false;
    let activeProposal: Proposal | null = null;
    let editLoading = false;
    let viewSubject = '';
    let viewContent = '';

    async function openViewEdit(p: Proposal) {
        activeProposal = p;
        showViewEdit = true;
        const res = await fetch(`/api/proposals/${p.id}`);
        const full = await res.json().catch(() => ({}));
        viewSubject = full?.subject ?? '';
        viewContent = full?.content ?? '';
    }

    async function saveDraftEdit() {
        if (!activeProposal) return;
        editLoading = true;
        try {
            const res = await fetch(`/api/proposals/${activeProposal.id}`, {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ subject: viewSubject, content: viewContent })
            });
            if (res.ok) {
                showViewEdit = false;
                await refreshProposals();
            }
        } finally {
            editLoading = false;
        }
    }

    // Download PDF for the proposal
    async function downloadPdf(p: Proposal) {
        try {
            const res = await fetch(`/api/proposals/${p.id}/pdf`);
            if (!res.ok) throw new Error('Failed to fetch PDF');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `proposal-${p.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 500);
        } catch (err) {
            alert('Failed to download PDF');
        }
    }

    // --- CSV Export ---
    async function exportCSV() {
        // Generate CSV headers
        const headers = ['ID', 'Date', 'Client', 'Amount', 'Status'];
        const rows = filtered.map((p) => [
            p.id,
            (p.created_at ?? '').slice(0, 10),
            `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
            formatAmount(Number(p.total_amount ?? 0)),
            toTitleCase(p.status)
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'proposals.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
    }
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
        <Select class="min-w-40" bind:value={statusFilter} items={[{value:'All',label:'All statuses'},{value:'Draft'},{value:'Sent'},{value:'Viewed'},{value:'Approved'},{value:'Declined'},{value:'Expired'}]} />
        <Select class="min-w-40" bind:value={sortBy} items={[{value:'Newest'},{value:'Oldest'},{value:'Amount'},{value:'Client'}]} />
		<Button class="ml-auto h-10" onclick={openCreateDialog}>
			<Plus class="size-4" />
			New Proposal
		</Button>
		<Button variant="outline" class="h-10" onclick={exportCSV}>
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
					<td class="px-4 py-3 font-semibold">{p.id}</td>
					<td class="px-4 py-3">{(p.created_at ?? '').slice(0, 10)}</td>
					<td class="px-4 py-3">{`${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()}</td>
					<td class="px-4 py-3 text-right">{formatAmount(Number(p.total_amount ?? 0))}</td>
					<td class="px-4 py-3">
						<span class={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${badgeClass(toTitleCase(p.status) as ProposalStatus)}`}>{toTitleCase(p.status)}</span>
					</td>
					<td class="px-4 py-3 text-right">
						<div class="flex justify-end gap-2">
							{#if toTitleCase(p.status) === 'Draft'}
								<Button variant="outline" class="h-8" onclick={() => sendProposal(p)} disabled={actionLoading[p.id] === 'send'}>
									{#if actionLoading[p.id] === 'send'}
										<span class="animate-spin mr-1">⏳</span>
									{/if}
									<Send class="size-4" />
									Send
								</Button>
							{/if}
                            <Button variant="outline" class="h-8" onclick={() => openViewEdit(p)}>
								<Eye class="size-4" />
                                {toTitleCase(p.status) === 'Draft' ? 'Edit' : 'View'}
							</Button>
							{#if toTitleCase(p.status) === 'Viewed' || toTitleCase(p.status) === 'Sent'}
								<Button class="h-8" onclick={() => approveProposal(p)} disabled={actionLoading[p.id] === 'approve'}>
									{#if actionLoading[p.id] === 'approve'}
										<span class="animate-spin mr-1">⏳</span>
									{/if}
									<Check class="size-4" />
									Approve
								</Button>
							{/if}
							{#if toTitleCase(p.status) !== 'Declined' && toTitleCase(p.status) !== 'Expired' && toTitleCase(p.status) !== 'Approved'}
								<Button variant="destructive" class="h-8" onclick={() => declineProposal(p)} disabled={actionLoading[p.id] === 'decline'}>
									{#if actionLoading[p.id] === 'decline'}
										<span class="animate-spin mr-1">⏳</span>
									{/if}
									<X class="size-4" />
									Decline
								</Button>
							{/if}
							<Button variant="outline" class="h-8" onclick={() => downloadPdf(p)}>
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

<!-- Create Proposal Dialog -->
<Dialog.Root bind:open={showCreate}>
    <Dialog.Content class="max-w-md">
        <Dialog.Header>
            <Dialog.Title>Create Proposal</Dialog.Title>
            <Dialog.Description>Select assignment and finalized estimate</Dialog.Description>
        </Dialog.Header>
        <div class="space-y-4 py-2">
            <div>
                <div class="mb-1 text-sm font-medium">Assignment</div>
                <Select class="w-full" bind:value={selectedAssignmentId} items={assignments.map(a => ({ value: String(a.id), label: `${a.customer_name} (#${a.id})` }))} />
            </div>
            <div>
                <div class="mb-1 text-sm font-medium">Estimate</div>
                <Select class="w-full" bind:value={selectedEstimateId} items={estimates.map(e => ({ value: String(e.id), label: `#${e.id} • ${e.status} • $${Number(e.total_amount ?? 0).toFixed(2)}` }))} />
            </div>
            <div>
                <div class="mb-1 text-sm font-medium">Subject</div>
                <Input placeholder="Subject" bind:value={formSubject} />
            </div>
            <div>
                <div class="mb-1 text-sm font-medium">Content</div>
                <textarea class="min-h-40 w-full rounded border p-3 bg-background" bind:value={formContent} placeholder="Write proposal details..."></textarea>
            </div>
            <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" bind:checked={sendNow} />
                Send now (final)
            </label>
        </div>
        <Dialog.Footer class="mt-4 flex justify-end gap-2">
            <Dialog.Close>
                <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button disabled={creating || !selectedAssignmentId || !selectedEstimateId} onclick={createProposal}>{creating ? 'Creating...' : 'Create'}</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<!-- View/Edit Proposal Dialog -->
<Dialog.Root bind:open={showViewEdit}>
    <Dialog.Content class="max-w-2xl">
        <Dialog.Header>
            <Dialog.Title>{toTitleCase(activeProposal?.status ?? '') === 'Draft' ? 'Edit Proposal' : 'View Proposal'}</Dialog.Title>
            <Dialog.Description>
                {toTitleCase(activeProposal?.status ?? '') === 'Draft' ? 'You can edit the content while status is Draft' : 'Read-only'}
            </Dialog.Description>
        </Dialog.Header>
        <div class="space-y-4 py-2">
            <div>
                <div class="mb-1 text-sm font-medium">Subject</div>
                {#if toTitleCase(activeProposal?.status ?? '') === 'Draft'}
                    <Input placeholder="Subject" bind:value={viewSubject} />
                {:else}
                    <div class="rounded border p-2 text-sm">{viewSubject}</div>
                {/if}
            </div>
            <div>
                <div class="mb-1 text-sm font-medium">Content</div>
                {#if toTitleCase(activeProposal?.status ?? '') === 'Draft'}
                    <textarea class="min-h-60 w-full rounded border p-3 bg-background" bind:value={viewContent} placeholder="Write proposal details..."></textarea>
                {:else}
                    <div class="rounded border p-3 whitespace-pre-wrap text-sm">{viewContent}</div>
                {/if}
            </div>
        </div>
        <Dialog.Footer class="mt-4 flex justify-end gap-2">
            <Dialog.Close>
                <Button variant="outline">Close</Button>
            </Dialog.Close>
            {#if toTitleCase(activeProposal?.status ?? '') === 'Draft'}
                <Button onclick={saveDraftEdit} disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</Button>
            {/if}
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

