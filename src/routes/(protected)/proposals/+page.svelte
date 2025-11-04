<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { formatAmount, toTitleCase } from '$lib/utils/proposals';
	import ProposalToolbar from '$lib/components/proposals/ProposalToolbar.svelte';
	import ProposalCard from '$lib/components/proposals/ProposalCard.svelte';
	import ProposalTable from '$lib/components/proposals/ProposalTable.svelte';
	import AssignmentsAccordion from '$lib/components/proposals/AssignmentsAccordion.svelte';
	import CreateProposalDialog from '$lib/components/proposals/CreateProposalDialog.svelte';
	import ViewEditProposalDialog from '$lib/components/proposals/ViewEditProposalDialog.svelte';

	export let data: {
		proposals: any[];
		q: string;
		status: string;
		role?: string | null;
		assignments?: any[];
	};

	type ProposalStatus = 'Draft' | 'Sent' | 'Viewed' | 'Approved' | 'Declined' | 'Expired';

	const proposals: any[] = data.proposals;
	const role: string | null = data.role ?? null;
	const serverAssignments: any[] = data.assignments ?? [];

	let searchText = data.q || '';
	let statusFilter: 'All' | ProposalStatus = (data.status as any) || 'All';
	let sortBy: 'Newest' | 'Oldest' | 'Amount' | 'Client' = 'Newest';

	async function refreshProposals() {
		if (role === 'OWNER' || role === 'REP') {
			window.location.reload();
		} else {
			const params = new URLSearchParams($page.url.searchParams);
			const resp = await fetch(`/api/proposals${params.toString() ? `?${params.toString()}` : ''}`);
			const fresh = await resp.json();
			(proposals as any).splice(0, proposals.length, ...fresh);
		}
	}

	function updateUrl() {
		const params = new URLSearchParams($page.url.searchParams);
		if (searchText) params.set('q', searchText);
		else params.delete('q');
		if (statusFilter && statusFilter !== 'All') params.set('status', statusFilter as string);
		else params.delete('status');
		const nextSearch = params.toString() ? `?${params.toString()}` : '';
		const currentSearch = $page.url.search;
		const path = $page.url.pathname;
		if (browser && nextSearch !== currentSearch) {
			goto(`${path}${nextSearch}`, { replaceState: true, keepFocus: true, noScroll: true });
		}
	}

	$: filteredProposals =
		role === 'OWNER'
			? proposals
					.filter((p) =>
						statusFilter === 'All' ? true : toTitleCase(p.status) === statusFilter
					)
					.filter((p) => {
						if (!searchText) return true;
						const customerName =
							`${p.customer?.firstName ?? ''} ${p.customer?.lastName ?? ''}`.toLowerCase();
						const leadTitle = p.assignment?.lead?.title?.toLowerCase() ?? '';
						return (
							customerName.includes(searchText.toLowerCase()) ||
							leadTitle.includes(searchText.toLowerCase())
						);
					})
					.toSorted((a, b) => {
						if (sortBy === 'Newest')
							return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
						if (sortBy === 'Oldest')
							return String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''));
						if (sortBy === 'Amount')
							return Number(b.totalAmount ?? 0) - Number(a.totalAmount ?? 0);
						return `${a.customer?.firstName ?? ''} ${a.customer?.lastName ?? ''}`.localeCompare(
							`${b.customer?.firstName ?? ''} ${b.customer?.lastName ?? ''}`
						);
					})
			: proposals
					.filter((p) =>
						statusFilter === 'All' ? true : toTitleCase(p.status) === statusFilter
					)
					.filter((p) => {
						if (!searchText) return true;
						const clientName = `${p.customer?.firstName ?? ''} ${p.customer?.lastName ?? ''}`.toLowerCase();
						const leadTitle = p.assignment?.lead?.title?.toLowerCase() ?? '';
						return (
							clientName.includes(searchText.toLowerCase()) ||
							leadTitle.includes(searchText.toLowerCase())
						);
					})
					.toSorted((a, b) => {
						if (sortBy === 'Newest')
							return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
						if (sortBy === 'Oldest')
							return String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''));
						if (sortBy === 'Amount')
							return Number(b.totalAmount ?? 0) - Number(a.totalAmount ?? 0);
						return `${a.customer?.firstName ?? ''} ${a.customer?.lastName ?? ''}`.localeCompare(
							`${b.customer?.firstName ?? ''} ${b.customer?.lastName ?? ''}`
						);
					});

	$: if (browser) updateUrl();

	// Create Proposal Dialog
	let showCreate = false;
	let creating = false;
	let dialogAssignments: Array<{ id: number; customer_name: string }> = [];
	let selectedAssignmentId: number | null = null;
	let estimates: Array<{ id: number; status: string; total_amount: number; [key: string]: any }> = [];
	let selectedEstimateId: number | null = null;
	let sendNow = false;
	let formSubject = '';
	let formContent = '';
	let selectedEstimateDetail: any = null;

	async function openCreateDialog() {
		showCreate = true;
		if (dialogAssignments.length === 0) {
			const res = await fetch('/api/rep/assignments');
			dialogAssignments = (await res.json().catch(() => [])) ?? [];
		}
	}

	async function onSelectAssignment(id: number) {
		selectedAssignmentId = id;
		selectedEstimateId = null;
		estimates = [];
		selectedEstimateDetail = null;
		if (id) {
			if (role === 'REP' && serverAssignments.length > 0) {
				const assignment = serverAssignments.find((a) => a.id === id);
				if (assignment?.estimates) {
					estimates = assignment.estimates.map((e: any) => ({
						id: e.id,
						status: e.status,
						total_amount: Number(e.total_amount ?? e.totalAmount ?? 0),
						...e
					}));
				}
			} else {
				const res = await fetch(`/api/assignments/${id}/estimates`);
				const items = (await res.json().catch(() => [])) ?? [];
				estimates = Array.isArray(items)
					? items.map((e: any) => ({
							id: e.id,
							status: e.status,
							total_amount: Number(e.total_amount ?? e.totalAmount ?? 0),
							...e
						}))
					: [];
			}
		}
	}

	$: {
		if (selectedEstimateId != null && estimates?.length) {
			const idNum = typeof selectedEstimateId === 'string' ? Number(selectedEstimateId) : selectedEstimateId;
			selectedEstimateDetail = estimates.find((e) => e.id === idNum) ?? null;
		} else {
			selectedEstimateDetail = null;
		}
	}

	$: if (selectedAssignmentId !== null) {
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
				body: JSON.stringify({
					assignment_id: selectedAssignmentId,
					estimate_id: selectedEstimateId,
					status: sendNow ? 'sent' : 'draft',
					subject: formSubject,
					content: formContent
				})
			});
			if (res.ok) {
				showCreate = false;
				await refreshProposals();
			}
		} finally {
			creating = false;
		}
	}

	// Actions
	let actionLoading: { [proposalId: number]: string | null } = {};

	async function sendProposal(p: any) {
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

	async function approveProposal(p: any) {
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

	// View/Edit Dialog
	let showViewEdit = false;
	let activeProposal: any = null;
	let editLoading = false;
	let viewSubject = '';
	let viewContent = '';
	let proposalEstimateDetail: any = null;

	async function openViewEdit(p: any) {
		activeProposal = p;
		showViewEdit = true;
		const res = await fetch(`/api/proposals/${p.id}`);
		const full = await res.json().catch(() => ({}));
		viewSubject = full?.subject ?? '';
		viewContent = full?.content ?? '';
		proposalEstimateDetail = null;
		try {
			let estimateId = full?.estimateId ?? p?.estimateId;
			let assignmentId = full?.assignmentId ?? p?.assignmentId;
			if (estimateId && assignmentId) {
				const r = await fetch(`/api/assignments/${assignmentId}/estimates`);
				const es = (await r.json().catch(() => [])) ?? [];
				const match = es.find((e: any) => e.id === estimateId);
				proposalEstimateDetail = match || null;
			}
		} catch (_err) {
			proposalEstimateDetail = null;
		}
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

	async function downloadPdf(p: any) {
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

	async function exportCSV() {
		const headers = ['ID', 'Date', 'Client', 'Amount', 'Status'];
		const rows = filteredProposals.map((p: any) => [
			p.id,
			(p.createdAt ?? '').slice(0, 10),
			`${p.customer?.firstName ?? ''} ${p.customer?.lastName ?? ''}`.trim(),
			formatAmount(Number(p.totalAmount ?? 0)),
			toTitleCase(p.status)
		]);
		const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
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

	function handleSelectAssignmentEstimate(assignmentId: number, estimateId: number) {
		selectedAssignmentId = assignmentId;
		selectedEstimateId = estimateId;
		showCreate = true;
		onSelectAssignment(assignmentId);
	}
</script>

<svelte:head>
	<title>Proposals</title>
</svelte:head>

<div class="w-full">
	<h1 class="mb-4 text-3xl font-extrabold tracking-tight">Proposals</h1>
	
	<ProposalToolbar
		bind:searchText
		bind:statusFilter
		bind:sortBy
		{role}
		onCreateClick={openCreateDialog}
		onExportClick={exportCSV}
	/>

	{#if role === 'OWNER'}
		<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredProposals as proposal (proposal.id)}
				<ProposalCard
					{proposal}
					onViewClick={openViewEdit}
					onDownloadClick={downloadPdf}
				/>
			{/each}
		</div>
		{#if filteredProposals.length === 0}
			<div class="text-slate-600 dark:text-slate-300 py-12 text-center text-sm">
				No proposals found. {searchText || statusFilter !== 'All'
					? 'Try adjusting your filters.'
					: ''}
			</div>
		{/if}
	{:else if role === 'REP'}
		<ProposalTable
			proposals={filteredProposals}
			{actionLoading}
			onSendClick={sendProposal}
			onViewClick={openViewEdit}
			onApproveClick={approveProposal}
			onDownloadClick={downloadPdf}
		/>

		<div class="text-slate-600 dark:text-slate-300 mt-3 text-xs">
			Showing {filteredProposals.length} of {proposals.length} proposals
		</div>

		<AssignmentsAccordion
			assignments={serverAssignments}
			onSelectAssignment={handleSelectAssignmentEstimate}
		/>
	{/if}
</div>

<CreateProposalDialog
	bind:open={showCreate}
	{dialogAssignments}
	{estimates}
	{selectedAssignmentId}
	{selectedEstimateId}
	{selectedEstimateDetail}
	bind:formSubject
	bind:formContent
	bind:sendNow
	{creating}
	onAssignmentChange={onSelectAssignment}
	onEstimateChange={(id) => { selectedEstimateId = id; }}
	onCreate={createProposal}
/>

<ViewEditProposalDialog
	bind:open={showViewEdit}
	{activeProposal}
	{proposalEstimateDetail}
	bind:viewSubject
	bind:viewContent
	{editLoading}
	onSave={saveDraftEdit}
/>
