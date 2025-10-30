<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as Accordion from '$lib/components/ui/accordion';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Select from '$lib/components/ui/select/select.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import Download from '@lucide/svelte/icons/download';
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import SearchIcon from '@lucide/svelte/icons/search';
	import TrashIcon from '@lucide/svelte/icons/trash'; // icon for delete

	export let data: {
		estimates: any[];
		q: string;
		status: string;
		assignments: any[];
		role?: string | null;
	};

	type EstimateStatus =
		| 'Draft'
		| 'Sent'
		| 'Viewed'
		| 'Accepted'
		| 'Declined'
		| 'Expired'
		| 'Invoiced'
		| 'Converted'
		| 'Saved';

	type Estimate = any;
	const estimates: Estimate[] = data.estimates ?? [];
	let assignments: any[] = data.assignments ?? [];
	let searchText = data.q || '';
	let statusFilter: 'All' | EstimateStatus = (data.status as any) || 'All';
	let sortBy: 'Newest' | 'Oldest' | 'Amount' | 'Customer' = 'Newest';
	let role: string | null = data.role ?? null;

	type ItemRow = { label: string; quantity: number; unitPrice: number; total?: number };
	type EstimateForm = {
		id?: number;
		items: ItemRow[];
		notes: string;
		assignmentId: string;
		isDraft: boolean;
		taxRate: number;
		discount: number;
		wasteFactor: number;
		status?: EstimateStatus;
	};

	let dialogOpen = false;
	let dialogEditMode = false;
	let dialogAssignment: any = null;
	let dialogEstimate: EstimateForm | null = null;

	let editingEstimateId: number | null = null;

	let actionLoading = false; // generic loading for all dialog actions
	let deleteLoadingById: Record<number, boolean> = {}; // per-estimate loading for delete button

	let confirmDeleteId: number | null = null;
	let confirmDeleteAssignment: any = null;

	function openNewEstimateDialog(a: any) {
		dialogEditMode = false;
		dialogAssignment = a;
		dialogEstimate = {
			items: [{ label: '', quantity: 1, unitPrice: 0 }],
			notes: '',
			assignmentId: a.id,
			isDraft: true,
			taxRate: 0,
			discount: 0,
			wasteFactor: 0
		};
		dialogOpen = true;
		editingEstimateId = null;
	}

	function openEditEstimateDialog(a: any, estimate: any) {
		dialogEditMode = true;
		dialogAssignment = a;
		dialogEstimate = {
			id: estimate.id,
			items: estimate.details?.items?.map((it) => ({
				label: it.label,
				quantity: it.quantity,
				unitPrice: it.unitPrice
			})) ?? [{ label: '', quantity: 1, unitPrice: 0 }],
			notes: estimate.notes ?? '',
			assignmentId: a.id,
			isDraft: estimate.status === 'Draft' || estimate.status === 'draft',
			taxRate: estimate.taxRate ?? 0,
			discount: estimate.discount ?? 0,
			wasteFactor: estimate.wasteFactor ?? 0,
			status: estimate.status
		};
		dialogOpen = true;
		editingEstimateId = estimate.id;
	}

	function openConfirmDelete(id: number, assignment: any) {
		confirmDeleteId = id;
		confirmDeleteAssignment = assignment;
	}

	function closeConfirmDelete() {
		confirmDeleteId = null;
		confirmDeleteAssignment = null;
	}

	async function handleDeleteEstimate(estimateId: number, assignment: any) {
		deleteLoadingById = { ...deleteLoadingById, [estimateId]: true };
		try {
			const res = await fetch(`/api/estimates/${estimateId}`, { method: 'DELETE' });
			if (res.ok) {
				await refreshAssignments();
				closeConfirmDelete();
			}
		} finally {
			deleteLoadingById = { ...deleteLoadingById, [estimateId]: false };
		}
	}

	function isAssignmentHasSavedEstimate(a: any) {
		return !!a.estimates?.find(
			(e) => e.status?.toLowerCase() === 'saved' || e.status?.toLowerCase() === 'final'
		);
	}

	function canAddSavedEstimate(a: any) {
		// Only one "Final/Saved" per assignment
		return !isAssignmentHasSavedEstimate(a);
	}

	function addItem() {
		if (dialogEstimate) {
			dialogEstimate.items = [...dialogEstimate.items, { label: '', quantity: 1, unitPrice: 0 }];
		}
	}
	function removeItem(idx: number) {
		if (dialogEstimate) {
			dialogEstimate.items = dialogEstimate.items.filter((_, i) => i !== idx);
		}
	}

	function computeSubtotal() {
		if (!dialogEstimate) return 0;
		const base = dialogEstimate.items.reduce(
			(sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0),
			0
		);
		const multiplier = 1 + Math.max(0, Number(dialogEstimate.wasteFactor) || 0) / 100;
		return base * multiplier;
	}
	function computeTaxAmount(subtotal: number) {
		if (!dialogEstimate) return 0;
		return (
			(subtotal - Number(dialogEstimate.discount || 0)) *
			(Math.max(0, Number(dialogEstimate.taxRate) || 0) / 100)
		);
	}
	function calculateTotal() {
		if (!dialogEstimate) return 0;
		const subtotal = computeSubtotal();
		const tax = computeTaxAmount(subtotal);
		return subtotal - Number(dialogEstimate.discount || 0) + tax;
	}

	async function handleSaveEstimate() {
		if (!dialogEstimate?.assignmentId || actionLoading) return;
		actionLoading = true;
		const payload: any = {
			items: dialogEstimate.items,
			notes: dialogEstimate.notes,
			assignmentId: dialogEstimate.assignmentId,
			status: dialogEstimate.isDraft ? 'draft' : 'saved',
			details: {
				taxRate: Number(dialogEstimate.taxRate || 0),
				discount: Number(dialogEstimate.discount || 0),
				wasteFactor: Number(dialogEstimate.wasteFactor || 0)
			}
		};

		let res;
		try {
			if (editingEstimateId) {
				res = await fetch(`/api/estimates/${editingEstimateId}`, {
					method: 'PUT',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(payload)
				});
			} else {
				res = await fetch('/api/estimates', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(payload)
				});
			}
			if (res.ok) {
				dialogOpen = false;
				dialogAssignment = null;
				dialogEstimate = null;
				editingEstimateId = null;
				await refreshAssignments();
			}
		} finally {
			actionLoading = false;
		}
	}

	async function handleChangeEstimateStatus(newDraft: boolean) {
		if (!editingEstimateId || !dialogEstimate || dialogEstimate.isDraft === newDraft || actionLoading) return;
		actionLoading = true;
		const payload = { ...dialogEstimate, status: newDraft ? 'draft' : 'saved', isDraft: newDraft };
		try {
			const res = await fetch(`/api/estimates/${editingEstimateId}`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (res.ok) {
				dialogEstimate.isDraft = newDraft;
				dialogEstimate.status = newDraft ? 'Draft' : 'Saved';
			}
			await refreshAssignments();
		} finally {
			actionLoading = false;
		}
	}

	async function refreshAssignments() {
		const res = await fetch('/api/estimator/assignments');
		const data = await res.json().catch(() => ({ assignments: [] }));
		if (res.ok) assignments = data.assignments ?? [];
	}

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
			case 'Saved':
				return 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200';
			default:
				return 'bg-muted text-foreground';
		}
		return '';
	}

	function formatAmount(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
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
			if (sortBy === 'Newest')
				return String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''));
			if (sortBy === 'Oldest')
				return String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''));
			if (sortBy === 'Amount') return Number(b.total_amount ?? 0) - Number(a.total_amount ?? 0);
			return `${a.first_name ?? ''} ${a.last_name ?? ''}`.localeCompare(
				`${b.first_name ?? ''} ${b.last_name ?? ''}`
			);
		});

	$: if (browser) updateUrl();
</script>

<svelte:head>
	<title>Estimates</title>
</svelte:head>

<div class="mx-auto w-full max-w-screen-lg space-y-2">
	<h1 class="mb-6 text-3xl font-extrabold tracking-tight">Assignment Estimates</h1>

	<!-- Toolbar -->
	<div class="mb-8 flex flex-wrap items-end gap-3">
		<div class="relative min-w-64 grow">
			<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
			<Input id="search" placeholder="Search assignments..." bind:value={searchText} class="pl-9" />
		</div>
		<Select
			bind:value={statusFilter}
			class="w-40"
			items={[
				{ value: 'All', label: 'All statuses' },
				{ value: 'Draft' },
				{ value: 'Saved', label: 'Final / Saved' },
				{ value: 'Sent' },
				{ value: 'Viewed' },
				{ value: 'Accepted' },
				{ value: 'Declined' },
				{ value: 'Expired' },
				{ value: 'Invoiced' },
				{ value: 'Converted' }
			]}
		/>
		<Select
			bind:value={sortBy}
			class="w-32"
			items={[{ value: 'Newest' }, { value: 'Oldest' }, { value: 'Amount' }, { value: 'Customer' }]}
		/>
		<Button variant="outline" class="ml-auto h-10">
			<Download class="size-4" />
			Export CSV
		</Button>
	</div>

	<Accordion.Root
		type="multiple"
		class="w-full divide-y divide-border rounded-xl border bg-card shadow-sm"
	>
		{#each assignments.filter( (a) => (searchText ? (a.lead?.title + ' ' + (a.lead?.customer?.firstName ?? '') + (a.lead?.customer?.lastName ?? ''))
							.toLowerCase()
							.includes(searchText.toLowerCase()) : true) ) as a (a.id)}
			<Accordion.Item value={`a-${a.id}`} class="px-3 py-2">
				<Accordion.Trigger
					class="flex w-full items-center gap-4 rounded-lg border-0 bg-transparent px-1 py-2 transition"
				>
					<div class="flex min-w-0 grow flex-col justify-center text-left">
						<div class="truncate text-base font-medium">
							{a.lead?.title}
							<span class="text-muted-foreground ml-1 text-xs font-normal">(#{a.leadId})</span>
						</div>
						<div class="text-muted-foreground truncate text-xs">
							Customer: {a.lead?.customer?.firstName}
							{a.lead?.customer?.lastName}
						</div>
					</div>
					<span
						class="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 capitalize dark:bg-slate-800 dark:text-slate-200"
						>{a.status}</span
					>
					{#if role === 'ESTIMATOR'}
						<Button
							variant="ghost"
							aria-label="Add Estimate"
							data-testid="add-estimate"
							class="rounded-full p-2 text-primary hover:bg-primary/10 disabled:opacity-40"
							disabled={!canAddSavedEstimate(a) && isAssignmentHasSavedEstimate(a)}
							onclick={() => openNewEstimateDialog(a)}
						>
							<Plus class="size-5" />
						</Button>
					{/if}
				</Accordion.Trigger>
				<Accordion.Content class="bg-muted mt-0 rounded-b-lg px-4 py-4">
					{#if a.estimates?.length}
						<div class="">
							{#each a.estimates as e (e.id)}
								<Card.Root class="mb-3 rounded-lg border border-border shadow-none">
									<Card.Content class="flex flex-col gap-2 p-3">
										<div class="flex w-full items-center justify-between gap-2">
											<div class="truncate">
												<span class="inline-flex items-center gap-2 text-base font-semibold">
													Estimate&nbsp;E-{e.id}
													<span
														class={'ml-2 rounded-full border px-2 py-0.5 text-xs font-medium ' +
															badgeClass(e.status)}
													>
														{e.status}
													</span>
													<span class="text-muted-foreground ml-1 text-xs"
														>{new Date(e.createdAt).toLocaleString()}</span
													>
												</span>
											</div>
											<div class="flex items-center gap-2">
												{#if role === 'ESTIMATOR'}
													{#if e.status === 'Draft' || e.status === 'draft' || e.status?.toLowerCase() === 'saved' || e.status?.toLowerCase() === 'final'}
														<Button
															variant="ghost"
															size="sm"
															class="rounded-full p-2 hover:bg-primary/10"
															aria-label="Edit Estimate"
															onclick={() => openEditEstimateDialog(a, e)}
														>
															<Pencil class="size-4" />
														</Button>
														<!-- Delete button -->
														<Button
															variant="ghost"
															size="sm"
															class="rounded-full p-2 hover:text-destructive"
															aria-label="Delete Estimate"
															disabled={deleteLoadingById[e.id]}
															onclick={() => openConfirmDelete(e.id, a)}
														>
															{#if deleteLoadingById[e.id]}
																<span class="animate-spin w-4 h-4 inline-block border-2 border-muted-foreground border-t-transparent rounded-full"></span>
															{:else}
																<TrashIcon class="size-4" />
															{/if}
														</Button>
													{/if}
												{/if}
												<span class="text-lg font-semibold tabular-nums"
													>{formatAmount(Number(e.totalAmount ?? 0))}</span
												>
											</div>
										</div>
										{#if e.details?.items?.length}
											<ul
												class="text-muted-foreground mt-1 flex list-disc flex-col gap-1 pl-5 text-sm"
											>
												{#each e.details.items.slice(0, 4) as it}
													<li>
														<span class="font-medium">{it.label}</span> — {it.quantity} x {formatAmount(
															Number(it.unitPrice)
														)} = {formatAmount(Number(it.total))}
													</li>
												{/each}
												{#if e.details.items.length > 4}
													<li class="text-xs text-gray-400 italic">
														and {e.details.items.length - 4} more…
													</li>
												{/if}
											</ul>
										{:else}
											<div class="text-muted-foreground mt-1 text-xs italic">No items</div>
										{/if}
										{#if e.notes}
											<div class="mt-1 text-xs text-foreground">Notes: {e.notes}</div>
										{/if}
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					{:else}
						<div class="text-muted-foreground py-3 text-sm">
							No estimates for this assignment yet.
						</div>
					{/if}
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>

	<!-- Dialog for Add/Edit Estimate -->
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Overlay class="fixed inset-0 z-40 bg-black/30" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-0 shadow-lg"
			style="width: 100%; max-width: 36rem;"
		>
			<Dialog.Title class="flex items-center gap-2 border-b p-6 pb-2 text-lg font-semibold">
				{dialogEditMode
					? `Edit Estimate${dialogEstimate?.isDraft ? ' (Draft)' : ' (Final)'}`
					: `Create New Estimate`}
				{#if dialogAssignment}
					<span class="text-muted-foreground ml-auto text-xs font-normal">
						{dialogAssignment.lead?.title} (#{dialogAssignment.leadId})
					</span>
				{/if}
			</Dialog.Title>
			<Dialog.Description class="text-muted-foreground px-6 pt-1 pb-4 text-sm">
				{dialogEditMode
					? 'Edit your estimate details. Save as draft or final as needed. When switched to draft, you can edit all fields.'
					: 'Enter estimate items, adjustments, and set as draft or final. Assignments can have only one final estimate.'}
			</Dialog.Description>
			<div class="px-6 pb-6">
				{#if dialogEstimate}
					<!-- Items Input -->
					<div class="mb-4">
						<div class="mb-1 flex items-center justify-between">
							<span class="text-sm font-medium">Items</span>
							<Button variant="ghost" size="sm" class="px-2" onclick={addItem} disabled={actionLoading}>Add Item</Button>
						</div>
						<div class="space-y-2">
							{#each dialogEstimate.items as it, i (i)}
								<div class="bg-muted/50 grid grid-cols-12 items-center gap-2 rounded-md px-2 py-1">
									<Input class="col-span-5" placeholder="Description" bind:value={it.label} disabled={actionLoading}/>
									<Input
										class="col-span-2"
										type="number"
										min="0"
										step="1"
										bind:value={it.quantity}
										placeholder="Qty"
										disabled={actionLoading}
									/>
									<Input
										class="col-span-3"
										type="number"
										min="0"
										step="0.01"
										bind:value={it.unitPrice}
										placeholder="Unit Price"
										disabled={actionLoading}
									/>
									<div class="col-span-1 text-right text-xs font-medium">
										{formatAmount(Number(it.quantity || 0) * Number(it.unitPrice || 0))}
									</div>
									<Button
										variant="ghost"
										size="xs"
										class="text-muted-foreground hover:text-destructive px-0"
										aria-label="Remove"
										onclick={() => removeItem(i)}
										disabled={actionLoading || dialogEstimate.items.length <= 1}
									>
										&#10006;
									</Button>
								</div>
							{/each}
						</div>
					</div>
					<!-- Adjustments -->
					<div class="mb-4 grid grid-cols-3 gap-3">
						<div>
							<label for="a" class="mb-1 block text-xs">Tax Rate (%)</label>
							<Input type="number" min="0" step="0.01" bind:value={dialogEstimate.taxRate} disabled={actionLoading}/>
						</div>
						<div>
							<label for="a" class="mb-1 block text-xs">Discount ($)</label>
							<Input type="number" min="0" step="0.01" bind:value={dialogEstimate.discount} disabled={actionLoading}/>
						</div>
						<div>
							<label for="a" class="mb-1 block text-xs">Waste (%)</label>
							<Input type="number" min="0" step="0.01" bind:value={dialogEstimate.wasteFactor} disabled={actionLoading}/>
						</div>
					</div>
					<!-- Notes -->
					<div class="mb-4">
						<label for="a" class="mb-1 block text-xs">Notes (optional)</label>
						<textarea
							class="w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
							bind:value={dialogEstimate.notes}
							rows={2}
							placeholder="Enter any additional notes..."
							disabled={actionLoading}
						></textarea>
					</div>
					<!-- Summary -->
					<div class="bg-muted mb-2 rounded-lg px-4 py-2">
						<div class="grid grid-cols-2 gap-y-1 text-xs">
							<span class="text-muted-foreground">Subtotal</span>
							<span class="text-right font-medium">{formatAmount(computeSubtotal())}</span>
							<span class="text-muted-foreground">Discount</span>
							<span class="text-right font-medium"
								>-{formatAmount(Number(dialogEstimate.discount || 0))}</span
							>
							<span class="text-muted-foreground">Tax</span>
							<span class="text-right font-medium"
								>{formatAmount(computeTaxAmount(computeSubtotal()))}</span
							>
							<span class="text-muted-foreground">Total</span>
							<span class="text-right font-semibold">{formatAmount(calculateTotal())}</span>
						</div>
					</div>
					<!-- Draft/Final selection, restrictions and actions -->
					<div class="mt-5 flex items-center justify-between">
						<div class="flex items-center gap-3">
							{#if dialogEditMode}
								<Select
									bind:value={dialogEstimate.isDraft}
									class="w-40"
									items={[
										{ value: true, label: 'Draft' },
										{ value: false, label: 'Final' }
									]}
									disabled={actionLoading ||
										(!dialogEstimate?.isDraft &&
										isAssignmentHasSavedEstimate(dialogAssignment) &&
										dialogAssignment.estimates
											.find((e) => e.id === dialogEstimate.id)
											?.status?.toLowerCase() === 'saved')}
									onchange={(e) => handleChangeEstimateStatus(e.detail)}
								/>
								{#if !dialogEstimate.isDraft}
									<span class="text-muted-foreground text-xs">This is a final estimate</span>
								{/if}
								{#if dialogEstimate.isDraft}
									<span class="text-muted-foreground text-xs">You can edit all fields</span>
								{/if}
							{:else}
								<Select
									bind:value={dialogEstimate.isDraft}
									class="w-24"
									items={[
										{ value: true, label: 'Draft' },
										{ value: false, label: 'Final' }
									]}
									disabled={actionLoading || !canAddSavedEstimate(dialogAssignment)}
								/>
								{#if !canAddSavedEstimate(dialogAssignment) && !dialogEstimate.isDraft}
									<span class="text-destructive-foreground text-xs"
										>One final estimate is already present.</span
									>
								{/if}
							{/if}
						</div>
						<div class="flex gap-2">
							<Button variant="outline" onclick={() => (dialogOpen = false)} disabled={actionLoading}>Cancel</Button>
							<Button
								onclick={handleSaveEstimate}
								disabled={actionLoading || !dialogEstimate.items.length ||
									(!dialogEstimate.isDraft && !canAddSavedEstimate(dialogAssignment))}
							>
								{#if actionLoading}
									<span class="animate-spin w-4 h-4 inline-block border-2 border-muted-foreground border-t-transparent rounded-full mr-2"></span>
								{/if}
								{dialogEditMode
									? 'Save Changes'
									: `Create ${dialogEstimate.isDraft ? 'Draft' : 'Final'} Estimate`}
							</Button>
						</div>
					</div>
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Confirm Delete Dialog -->
	<Dialog.Root open={!!confirmDeleteId}>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/40" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-[96vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-lg"
		>
			<Dialog.Title class="text-lg font-semibold pb-2 flex items-center gap-2">
				<TrashIcon class="size-5 text-destructive" />
				Delete Estimate
			</Dialog.Title>
			<div class="pb-5 pt-1 text-sm">
				Are you sure you want to delete estimate
				<span class="font-medium">E-{confirmDeleteId}</span>?
				This action cannot be undone.
			</div>
			<div class="flex justify-end gap-2">
				<Button variant="outline" onclick={closeConfirmDelete} disabled={deleteLoadingById[confirmDeleteId ?? 0]}>Cancel</Button>
				<Button
					variant="destructive"
					onclick={() => confirmDeleteId && handleDeleteEstimate(confirmDeleteId, confirmDeleteAssignment)}
					disabled={deleteLoadingById[confirmDeleteId ?? 0]}
				>
					{#if deleteLoadingById[confirmDeleteId ?? 0]}
						<span class="animate-spin w-4 h-4 inline-block border-2 border-white border-t-transparent rounded-full mr-2"></span>
					{/if}
					Delete
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>
