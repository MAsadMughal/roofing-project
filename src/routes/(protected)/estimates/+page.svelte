<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as Accordion from '$lib/components/ui/accordion';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import Select from '$lib/components/ui/select/select.svelte';
	import Download from '@lucide/svelte/icons/download';
	import Pencil from '@lucide/svelte/icons/pencil';
	import SearchIcon from '@lucide/svelte/icons/search';
	import TrashIcon from '@lucide/svelte/icons/trash';

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
	let actionLoading = false;
	let deleteLoadingById: Record<number, boolean> = {};
	let confirmDeleteId: number | null = null;
	let confirmDeleteAssignment: any = null;

	let summarySubtotal: number = 0;
	let summaryTax: number = 0;
	let summaryTotal: number = 0;

	let expandEstimateDetails: any = null; // For viewing full details as modal

	$: {
		if (dialogEstimate) {
			const items = dialogEstimate.items ?? [];
			const base = items.reduce(
				(sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0),
				0
			);
			const waste = Math.max(0, Number(dialogEstimate.wasteFactor) || 0) / 100;
			const subtotal = base * (1 + waste);
			const discount = Number(dialogEstimate.discount || 0);
			const taxRate = Math.max(0, Number(dialogEstimate.taxRate) || 0) / 100;
			const tax = (subtotal - discount) * taxRate;
			const total = subtotal - discount + tax;

			summarySubtotal = subtotal;
			summaryTax = tax;
			summaryTotal = total;
		} else {
			summarySubtotal = 0;
			summaryTax = 0;
			summaryTotal = 0;
		}
	}

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
		editingEstimateId = null;
		dialogOpen = true;
	}

	function openEditEstimateDialog(a: any, estimate: any) {
		dialogEditMode = true;
		dialogAssignment = a;
		dialogEstimate = {
			id: estimate.id,
			items: estimate.details?.items?.map((it: any) => ({
				label: it.label,
				quantity: it.quantity,
				unitPrice: it.unitPrice
			})) ?? [{ label: '', quantity: 1, unitPrice: 0 }],
			notes: estimate.notes ?? '',
			assignmentId: a.id,
			isDraft: estimate.status === 'Draft' || estimate.status === 'draft',
			taxRate: estimate.details?.taxRate ?? estimate.taxRate ?? 0,
			discount: estimate.details?.discount ?? estimate.discount ?? 0,
			wasteFactor: estimate.details?.wasteFactor ?? estimate.wasteFactor ?? 0,
			status: estimate.status
		};
		editingEstimateId = estimate.id;
		dialogOpen = true;
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
			(e: any) => e.status?.toLowerCase() === 'saved' || e.status?.toLowerCase() === 'final'
		);
	}

	function canAddSavedEstimate(a: any) {
		return !isAssignmentHasSavedEstimate(a);
	}

	function addItem() {
		if (dialogEstimate) {
			dialogEstimate = {
				...dialogEstimate,
				items: [...dialogEstimate.items, { label: '', quantity: 1, unitPrice: 0 }]
			};
		}
	}
	function removeItem(idx: number) {
		if (dialogEstimate) {
			dialogEstimate = {
				...dialogEstimate,
				items: dialogEstimate.items.filter((_, i) => i !== idx)
			};
		}
	}

	function handleItemInput(idx: number, key: keyof ItemRow, value: string | number) {
		if (dialogEstimate) {
			let newItems = dialogEstimate.items.map((item, i) => {
				if (i === idx) {
					if (key === 'quantity') {
						return { ...item, [key]: Number(value) };
					}
					if (key === 'unitPrice') {
						return { ...item, [key]: Number(value) };
					}
					return { ...item, [key]: value };
				}
				return item;
			});
			dialogEstimate = { ...dialogEstimate, items: newItems };
		}
	}

	function handleFieldInput(key: 'taxRate' | 'discount' | 'wasteFactor', value: string | number) {
		if (dialogEstimate) {
			dialogEstimate = { ...dialogEstimate, [key]: Number(value) };
		}
	}

	function computeSubtotal() {
		if (!dialogEstimate) return 0;
		const base = (dialogEstimate.items ?? []).reduce(
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
			items: dialogEstimate.items.map((it) => ({
				...it,
				quantity: Number(it.quantity) || 0,
				unitPrice: Number(it.unitPrice) || 0
			})),
			notes: dialogEstimate.notes,
			assignmentId: dialogEstimate.assignmentId,
			status: dialogEstimate.isDraft ? 'draft' : 'saved',
			taxRate: Number(dialogEstimate.taxRate || 0),
			discount: Number(dialogEstimate.discount || 0),
			wasteFactor: Number(dialogEstimate.wasteFactor || 0),
			details: {
				items: dialogEstimate.items.map((it) => ({
					...it,
					quantity: Number(it.quantity) || 0,
					unitPrice: Number(it.unitPrice) || 0,
					total: Number(it.quantity) * Number(it.unitPrice)
				})),
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
		if (
			!editingEstimateId ||
			!dialogEstimate ||
			dialogEstimate.isDraft === newDraft ||
			actionLoading
		)
			return;
		actionLoading = true;

		const payload = {
			...dialogEstimate,
			status: newDraft ? 'draft' : 'saved',
			isDraft: newDraft,
			taxRate: Number(dialogEstimate.taxRate || 0),
			discount: Number(dialogEstimate.discount || 0),
			wasteFactor: Number(dialogEstimate.wasteFactor || 0),
			details: {
				items: dialogEstimate.items.map((it) => ({
					...it,
					quantity: Number(it.quantity) || 0,
					unitPrice: Number(it.unitPrice) || 0,
					total: Number(it.quantity) * Number(it.unitPrice)
				})),
				taxRate: Number(dialogEstimate.taxRate || 0),
				discount: Number(dialogEstimate.discount || 0),
				wasteFactor: Number(dialogEstimate.wasteFactor || 0)
			}
		};
		try {
			const res = await fetch(`/api/estimates/${editingEstimateId}`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (res.ok) {
				dialogEstimate = {
					...dialogEstimate,
					isDraft: newDraft,
					status: newDraft ? 'Draft' : 'Saved'
				};
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

	$: filteredEstimates =
		role === 'OWNER'
			? estimates
					.filter((e: any) => (statusFilter === 'All' ? true : e.status === statusFilter))
					.filter((e: any) =>
						searchText
							? [
									`${e.customer?.firstName ?? ''} ${e.customer?.lastName ?? ''}`,
									e.assignment?.lead?.title ?? ''
								]
									.join(' ')
									.toLowerCase()
									.includes(searchText.toLowerCase())
							: true
					)
					.toSorted((a, b) => {
						if (sortBy === 'Newest')
							return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
						if (sortBy === 'Oldest')
							return String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''));
						if (sortBy === 'Amount') return Number(b.totalAmount ?? 0) - Number(a.totalAmount ?? 0);
						return `${a.customer?.firstName ?? ''} ${a.customer?.lastName ?? ''}`.localeCompare(
							`${b.customer?.firstName ?? ''} ${b.customer?.lastName ?? ''}`
						);
					})
			: [];

	$: if (browser) updateUrl();
</script>

<svelte:head>
	<title>Estimates</title>
</svelte:head>

<!-- Unified section header across pages -->
<section class="sticky top-0 z-30 w-full bg-background/95 shadow-md shadow-muted dark:shadow-md dark:bg-background/80">
	<div class="mx-auto flex max-w-5xl flex-col gap-3 border-b border-border px-4 pt-7 pb-5 md:px-2">
		<div class="flex flex-row items-center justify-between gap-2">
			<div class="flex items-center gap-3">
				<div class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-primary/10">
					<Download class="size-7 opacity-70" />
				</div>
				<h1 class="text-3xl font-extrabold leading-none tracking-tight md:text-4xl">Estimates</h1>
			</div>
			<Button
				variant="default"
				class="ml-auto hidden md:flex h-11 items-center gap-2 rounded-full px-5 font-semibold tracking-wide border border-border shadow"
			>
				<Download class="size-5" />
				Export CSV
			</Button>
		</div>
		<div class="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
			<div class="relative flex-1 min-w-0">
				<SearchIcon class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					id="search"
					placeholder={role === 'OWNER' ? 'Search estimates...' : 'Search assignments...'}
					bind:value={searchText}
					class="bg-muted/80 w-full rounded-full pl-9 font-medium shadow-input focus:ring-primary focus:outline-none"
				/>
			</div>
			<div class="flex gap-2 flex-wrap">
				<Select
					bind:value={statusFilter}
					class="w-40 rounded-full border border-border bg-card shadow"
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
					class="w-36 rounded-full border border-border bg-card shadow"
					items={[
						{ value: 'Newest' },
						{ value: 'Oldest' },
						{ value: 'Amount' },
						{ value: 'Customer' }
					]}
				/>
			</div>
		</div>
	</div>
</section>

<div class="mx-auto w-full max-w-5xl space-y-8 px-2 pt-8 pb-10 md:px-0">

	{#if role === 'OWNER'}
		<!-- Modern card grid for owner -->
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredEstimates as estimate (estimate.id)}
				<Card.Root
					class="group relative rounded-2xl border border-border/85 bg-background/90 p-0 shadow-lg hover:ring-2 hover:ring-primary/30 focus-within:ring-2 transition-all"
				>
					<button
						tabindex="0"
						type="button"
						onclick={() => (expandEstimateDetails = estimate)}
						class="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-primary/60 rounded-2xl"
						aria-label="View estimate details"
					></button>
					<Card.Header class="bg-muted/80 flex flex-col gap-1 p-5 pb-3">
						<div class="flex items-center justify-between gap-4">
							<div>
								<Card.Title class="flex items-center gap-2 text-[1.12rem] font-semibold">
									<span class="inline-block rounded bg-primary/10 px-2 py-0.5 font-mono text-[0.88rem] tracking-tight text-primary">
										E-{estimate.id}
									</span>
								</Card.Title>
								<Card.Description class="text-muted-foreground mt-1 text-xs font-medium">
									{new Date(estimate.createdAt).toLocaleDateString('en-US', {
										year: 'numeric',
										month: 'short',
										day: 'numeric',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</Card.Description>
							</div>
							<span
								class={'rounded-full border px-2 py-0.5 text-xs font-bold tracking-wide ' +
									badgeClass(estimate.status)}
							>
								{estimate.status}
							</span>
						</div>
					</Card.Header>
					<Card.Content class="space-y-4 bg-background/70 px-5 pt-3 pb-6">
						<div class="flex items-center justify-between border-b border-border pb-2">
							<span class="text-muted-foreground text-sm font-medium">Total</span>
							<span class="text-xl font-bold text-foreground tabular-nums">
								{formatAmount(estimate.totalAmount)}
							</span>
						</div>
						{#if estimate.assignment}
						<div class="flex items-center gap-2">
							<div class="bg-muted/70 rounded px-2 py-0.5 font-mono text-xs text-primary/90 mr-1">#{estimate.assignment.id}</div>
							<div class="truncate font-medium text-sm">{estimate.assignment.lead?.title}</div>
						</div>
						{/if}
						{#if estimate.customer}
							<div class="flex items-center gap-2">
								<div class="font-semibold text-foreground/90 text-sm">{estimate.customer.firstName} {estimate.customer.lastName}</div>
								{#if estimate.customer.email}
									<div class="text-muted-foreground/70 text-xs">{estimate.customer.email}</div>
								{/if}
							</div>
						{/if}
						{#if estimate.details?.items?.length}
							<ul class="divide-y divide-border text-xs">
								{#each estimate.details.items.slice(0, 3) as item}
									<li class="flex items-center justify-between py-1 first:pt-0 last:pb-0">
										<span class="truncate text-foreground/90">{item.label}</span>
										<span class="tabular-nums">{formatAmount(Number(item.total ?? 0))}</span>
									</li>
								{/each}
								{#if estimate.details.items.length > 3}
									<li class="text-muted-foreground text-xs italic">...and {estimate.details.items.length - 3} more items</li>
								{/if}
							</ul>
						{/if}
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
		{#if filteredEstimates.length === 0}
			<div class="mx-auto text-muted-foreground/80 bg-muted rounded-lg py-16 text-center text-base font-medium max-w-xl shadow-sm">
				No estimates found.
				{#if searchText || statusFilter !== 'All'}
					<br />
					Try adjusting your filters.
				{/if}
			</div>
		{/if}
	{:else if role === 'ESTIMATOR' || role === 'REP'}
		<!-- Accordion with new consistent style for estimator/rep, items clickable -->
		<Accordion.Root
			type="multiple"
			class="w-full divide-y divide-border rounded-2xl border shadow-lg bg-background/90"
		>
			{#each assignments.filter( (a) =>
				(searchText
					? (
						(a.lead?.title ?? '') + ' ' +
						(a.lead?.customer?.firstName ?? '') +
						' ' + (a.lead?.customer?.lastName ?? '')
					).toLowerCase().includes(searchText.toLowerCase())
					: true)
			) as a (a.id)}
				<Accordion.Item value={`a-${a.id}`}>
					<Accordion.Trigger
						class="flex w-full items-center gap-4 rounded-lg border-0 bg-transparent px-4 py-4 transition hover:bg-primary/5"
					>
						<div class="flex-1 min-w-0 flex flex-col justify-center text-left">
							<div class="flex items-center gap-2 text-[1.08rem] font-medium tracking-tight whitespace-nowrap">
								<span class="truncate">{a.lead?.title}</span>
								<span class="text-muted-foreground ml-2 font-mono text-xs font-normal">#{a.leadId}</span>
							</div>
							<div class="text-muted-foreground truncate text-xs font-normal">
								Customer: <span class="font-semibold">
									{a.lead?.customer?.firstName} {a.lead?.customer?.lastName}
								</span>
							</div>
						</div>
						<span class="shrink-0 rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-700 capitalize dark:bg-slate-900 dark:text-slate-100">
							{a.status}
						</span>
					</Accordion.Trigger>
					<Accordion.Content class="bg-muted/40 mt-0 rounded-b-lg px-6 py-6">
						{#if a.estimates?.length}
							<div class="flex flex-col gap-4">
								{#each a.estimates as e (e.id)}
									<Card.Root
										class="relative mb-0 overflow-hidden rounded-xl border border-primary/10 bg-background/70 px-0 py-0 shadow-sm transition-all group"
									>
										<button
											tabindex="0"
											type="button"
											onclick={() => (expandEstimateDetails = e)}
											class="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-primary/60 rounded-xl"
											style="background:transparent"
											aria-label="View estimate details"
										></button>
										<Card.Content class="flex flex-row gap-3 items-center px-6 py-3 relative z-0">
											<div class="grow min-w-0">
												<div class="flex gap-3 items-center flex-wrap">
													<span class="rounded bg-primary/10 px-2 py-0.5 font-mono text-[0.93rem] text-primary font-bold">
														E-{e.id}
													</span>
													<span
														class={'rounded-full border px-2 py-0.5 text-xs font-bold tracking-wide ' +
															badgeClass(e.status)}
													>
														{e.status}
													</span>
													<span class="text-muted-foreground ml-1 text-xs whitespace-nowrap">
														{new Date(e.createdAt).toLocaleString()}
													</span>
													<span class="tabular-nums ml-3 text-base font-semibold text-foreground/90">
														{formatAmount(Number(e.totalAmount ?? 0))}
													</span>
												</div>
												{#if e.details?.items?.length}
													<ul class="text-muted-foreground mt-1 flex flex-col gap-1 pl-2 text-xs">
														{#each e.details.items.slice(0, 3) as it}
															<li>
																<span class="font-medium text-foreground/90">{it.label}</span>
																{' '} – {it.quantity} × {formatAmount(it.unitPrice)} = 
																<span class="text-primary-700 dark:text-primary-300 font-bold"> {formatAmount(Number(it.total))}</span>
															</li>
														{/each}
														{#if e.details.items.length > 3}
															<li class="italic">
																... and {e.details.items.length - 3} more
															</li>
														{/if}
													</ul>
												{:else}
													<div class="text-muted-foreground mt-1 text-xs italic">No items</div>
												{/if}
												{#if e.notes}
													<div class="bg-muted/60 mt-1 rounded px-2 py-1 text-xs text-foreground/90">
														Notes: {e.notes}
													</div>
												{/if}
											</div>
											{#if role === 'ESTIMATOR'}
												<div class="flex flex-col gap-1 min-w-fit">
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
														<Button
															variant="ghost"
															size="sm"
															class="hover:text-destructive rounded-full p-2"
															aria-label="Delete Estimate"
															disabled={deleteLoadingById[e.id]}
															onclick={() => openConfirmDelete(e.id, a)}
														>
															{#if deleteLoadingById[e.id]}
																<span
																	class="border-muted-foreground inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
																></span>
															{:else}
																<TrashIcon class="size-4" />
															{/if}
														</Button>
													{/if}
												</div>
											{/if}
										</Card.Content>
									</Card.Root>
								{/each}
							</div>
						{:else}
							<div class="text-muted-foreground py-3 text-base italic">No estimates for this assignment yet.</div>
						{/if}
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	{/if}

	<!-- Full Estimate Details Modal (readonly) -->
	<Dialog.Root open={!!expandEstimateDetails} onOpenChange={(open) => {
		if (!open) {
			expandEstimateDetails = null;
		}
	}}>
		{#if expandEstimateDetails}
			<Dialog.Overlay class="fixed inset-0 z-40 bg-black/40" />
			<Dialog.Content
				class="fixed top-1/2 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border bg-background shadow-2xl max-h-[96vh] p-0"
				style="width: 100%; max-width: 38rem;"
			>
				<div class="pb-2 border-b border-border bg-primary/5 px-7 pt-7 pb-3 flex flex-row items-center gap-3">
					<Download class="text-primary size-7 shrink-0" />
					<h2 class="text-[1.55rem] font-bold tracking-tight">
						Estimate E-{expandEstimateDetails.id}
					</h2>
					<span class="ml-auto text-xs font-bold rounded-full border px-3 py-0.5 {badgeClass(expandEstimateDetails.status)}">
						{expandEstimateDetails.status}
					</span>
				</div>
				<div class="px-7 py-5 space-y-4">
					<div class="flex flex-col md:flex-row gap-6">
						<div class="flex-1">
							<div class="mb-1 text-muted-foreground/80 uppercase font-semibold text-[0.93rem]">Created</div>
							<div class="text-base font-medium">
								{new Date(expandEstimateDetails.createdAt).toLocaleString()}
							</div>
						</div>
						{#if expandEstimateDetails.assignment}
						<div class="flex-1">
							<div class="mb-1 text-muted-foreground/80 uppercase font-semibold text-[0.93rem]">Assignment</div>
							<div class="mb-1 font-semibold">
								#{expandEstimateDetails.assignment.id} &bull; {expandEstimateDetails.assignment.lead?.title}
							</div>
							<div class="text-muted-foreground/90 text-xs">
								Lead: #{expandEstimateDetails.assignment.lead?.id}
								{#if expandEstimateDetails.assignment.status}
									<span class="mx-1">&bull;</span>
									<span class="bg-muted rounded px-2 py-0.5 capitalize">
										{expandEstimateDetails.assignment.status}
									</span>
								{/if}
							</div>
							{#if expandEstimateDetails.assignment.lead?.source}
								<div class="text-muted-foreground/70 text-xs">Source: {expandEstimateDetails.assignment.lead.source}</div>
							{/if}
						</div>
						{/if}
					</div>
					{#if expandEstimateDetails.customer}
					<div class="border-t border-dashed border-border pt-3">
						<div class="mb-1 text-muted-foreground/80 uppercase font-semibold text-[0.93rem]">Customer</div>
						<div class="font-semibold text-base">{expandEstimateDetails.customer.firstName} {expandEstimateDetails.customer.lastName}</div>
						{#if expandEstimateDetails.customer.email}
							<div class="text-muted-foreground text-xs">{expandEstimateDetails.customer.email}</div>
						{/if}
						{#if expandEstimateDetails.customer.phone}
							<div class="text-muted-foreground text-xs">{expandEstimateDetails.customer.phone}</div>
						{/if}
					</div>
					{/if}
					{#if expandEstimateDetails.assignment && (expandEstimateDetails.assignment.assignedTo || expandEstimateDetails.assignment.estimator)}
						<div class="border-t border-dashed border-border pt-3">
							<div class="mb-1 text-muted-foreground/80 uppercase font-semibold text-[0.93rem]">Team</div>
							<div class="flex flex-row flex-wrap gap-5 text-sm">
								{#if expandEstimateDetails.assignment.assignedTo}
								<div>
									<span class="font-medium">Rep:</span>
									<span class="font-semibold">{expandEstimateDetails.assignment.assignedTo.firstName} {expandEstimateDetails.assignment.assignedTo.lastName}</span>
								</div>
								{/if}
								{#if expandEstimateDetails.assignment.estimator}
								<div>
									<span class="font-medium">Estimator:</span>
									<span class="font-semibold">{expandEstimateDetails.assignment.estimator.firstName} {expandEstimateDetails.assignment.estimator.lastName}</span>
								</div>
								{/if}
							</div>
						</div>
					{/if}
					<!-- Items -->
					{#if expandEstimateDetails.details?.items?.length}
						<div class="border-t border-dashed border-border pt-4">
							<div class="mb-1 text-muted-foreground/80 uppercase font-semibold text-[0.93rem]">Estimate Items</div>
							<table class="w-full border rounded-xl bg-muted/60 overflow-x-auto text-sm mb-2">
								<thead>
									<tr class="border-b border-border text-left">
										<th class="p-2 font-bold">Item</th>
										<th class="p-2 font-bold">Qty</th>
										<th class="p-2 font-bold">Unit</th>
										<th class="p-2 font-bold text-right">Total</th>
									</tr>
								</thead>
								<tbody>
									{#each expandEstimateDetails.details.items as it}
										<tr class="border-b border-border last:border-b-0">
											<td class="p-2">{it.label}</td>
											<td class="p-2">{it.quantity}</td>
											<td class="p-2">{formatAmount(Number(it.unitPrice))}</td>
											<td class="p-2 text-right font-semibold">{formatAmount(Number(it.total ?? 0))}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
					<!-- Summary -->
					<div class="grid grid-cols-2 gap-2 border-t border-dashed border-border pt-4 text-sm">
						<span class="text-muted-foreground/80">Subtotal</span>
						<span class="text-right font-semibold text-foreground">{formatAmount(Number(expandEstimateDetails.details?.items?.reduce((sum:any,it:any)=>sum+Number(it.total||0),0)||0) * (1+((expandEstimateDetails.details?.wasteFactor||0)/100)))}</span>
						<span class="text-muted-foreground/80">Discount</span>
						<span class="text-right text-red-600 font-semibold">
							-{formatAmount(Number(expandEstimateDetails.details?.discount||0))}
						</span>
						<span class="text-muted-foreground/80">Tax</span>
						<span class="text-right font-semibold">
							{formatAmount(
								((Number(expandEstimateDetails.details?.items?.reduce((sum:any,it:any)=>sum+Number(it.total||0),0)||0) * (1+((expandEstimateDetails.details?.wasteFactor||0)/100)) -
								Number(expandEstimateDetails.details?.discount||0))
								*
								(Number(expandEstimateDetails.details?.taxRate||0)/100)
								)
							)}
						</span>
						<span class="text-muted-foreground/80">Waste</span>
						<span class="text-right">{expandEstimateDetails.details?.wasteFactor
							? `${Number(expandEstimateDetails.details?.wasteFactor).toFixed(2)}%`
							: '0%'
						}</span>
						<span class="text-muted-foreground/80">Total</span>
						<span class="text-right font-bold text-primary text-lg">
							{formatAmount(Number(expandEstimateDetails.totalAmount || 0))}
						</span>
					</div>
					<!-- Notes -->
					{#if expandEstimateDetails.notes}
						<div class="border-t border-dashed border-border pt-3">
							<div class="mb-1 text-muted-foreground/80 uppercase font-semibold text-[0.93rem]">Notes</div>
							<p class="text-base">{expandEstimateDetails.notes}</p>
						</div>
					{/if}
				</div>
				<div class="border-t border-border px-7 py-4 bg-muted/40 flex justify-end gap-2">
					<Button
						variant="outline"
						class="rounded-full px-5 font-medium"
						onclick={() => (expandEstimateDetails = null)}
					>
						Close
					</Button>
				</div>
			</Dialog.Content>
		{/if}
	</Dialog.Root>

	<!-- Dialog for Add/Edit Estimate -->
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Overlay class="fixed inset-0 z-40 bg-black/40" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 h-[94vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-background shadow-2xl"
			style="width: 100%; max-width: 37rem;"
		>
			<Dialog.Title class="flex items-center gap-2 border-b px-7 pt-7 pb-1 text-2xl font-bold tracking-tight">
				{dialogEditMode
					? `Edit Estimate ${dialogEstimate?.isDraft ? '(Draft)' : '(Final)'}`
					: `Create Estimate`}
				{#if dialogAssignment}
					<span class="text-muted-foreground ml-auto text-xs font-semibold">
						{dialogAssignment.lead?.title} (#{dialogAssignment.leadId})
					</span>
				{/if}
			</Dialog.Title>
			<Dialog.Description class="text-muted-foreground px-7 pt-1 pb-3 text-[0.97rem] font-normal">
				{dialogEditMode
					? 'You may only mark one final estimate per assignment. Switch to draft to edit fully.'
					: 'Add estimate items, waste, discount and tax. There can only be one final estimate per assignment.'}
			</Dialog.Description>
			<div class="px-7 pb-7">
				{#if dialogEstimate}
					<div class="mb-5">
						<div class="mb-1 flex items-center justify-between">
							<span class="text-muted-foreground/90 text-sm font-semibold uppercase">Items</span>
							<Button
								variant="ghost"
								size="sm"
								class="rounded-full px-3 font-semibold hover:bg-primary/10"
								onclick={addItem}
								disabled={actionLoading}
							>
								Add Item
							</Button>
						</div>
						<div class="space-y-2">
							{#each dialogEstimate.items as it, i (i)}
								<div class="border border-border/75 bg-muted/60 rounded-xl px-2 py-2 grid grid-cols-12 items-center gap-2">
									<Input
										class="col-span-5 rounded-lg"
										placeholder="Description"
										value={it.label}
										disabled={actionLoading}
										oninput={(e: any) => handleItemInput(i, 'label', e.target.value)}
									/>
									<Input
										class="col-span-2 rounded-lg"
										type="number"
										min="0"
										step="1"
										value={it.quantity}
										placeholder="Qty"
										disabled={actionLoading}
										oninput={(e: any) => handleItemInput(i, 'quantity', e.target.value)}
									/>
									<Input
										class="col-span-3 rounded-lg"
										type="number"
										min="0"
										step="0.01"
										value={it.unitPrice}
										placeholder="Unit Price"
										disabled={actionLoading}
										oninput={(e: any) => handleItemInput(i, 'unitPrice', e.target.value)}
									/>
									<div class="col-span-1 text-right text-xs font-medium text-foreground/90 pr-1">
										{formatAmount(Number(it.quantity || 0) * Number(it.unitPrice || 0))}
									</div>
									<Button
										variant="ghost"
										size="sm"
										class="text-muted-foreground hover:text-destructive rounded-full px-0"
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
					<div class="mb-5 grid grid-cols-3 gap-5">
						<div>
							<label class="text-muted-foreground/80 mb-1 block text-xs font-medium">Tax Rate (%)</label>
							<Input
								type="number"
								min="0"
								step="0.01"
								value={dialogEstimate.taxRate}
								disabled={actionLoading}
								oninput={(e: any) => handleFieldInput('taxRate', e.target.value)}
								class="rounded-lg"
							/>
						</div>
						<div>
							<label class="text-muted-foreground/80 mb-1 block text-xs font-medium">Discount ($)</label>
							<Input
								type="number"
								min="0"
								step="0.01"
								value={dialogEstimate.discount}
								disabled={actionLoading}
								oninput={(e: any) => handleFieldInput('discount', e.target.value)}
								class="rounded-lg"
							/>
						</div>
						<div>
							<label class="text-muted-foreground/80 mb-1 block text-xs font-medium">Waste (%)</label>
							<Input
								type="number"
								min="0"
								step="0.01"
								value={dialogEstimate.wasteFactor}
								disabled={actionLoading}
								oninput={(e: any) => handleFieldInput('wasteFactor', e.target.value)}
								class="rounded-lg"
							/>
						</div>
					</div>
					<!-- Notes -->
					<div class="mb-5">
						<label class="text-muted-foreground/80 mb-1 block text-xs font-medium">Notes (optional)</label>
						<textarea
							class="bg-muted/70 w-full resize-none rounded-lg border px-3 py-2 text-sm shadow-inner focus:ring-2 focus:ring-primary focus:outline-none"
							bind:value={dialogEstimate.notes}
							rows={2}
							placeholder="Enter any additional notes"
							disabled={actionLoading}
						></textarea>
					</div>
					<!-- Summary -->
					<div class="bg-muted mb-3 flex flex-col gap-2 rounded-xl border border-border/85 px-6 py-4">
						<div class="grid grid-cols-2 gap-y-1 text-xs">
							<span class="text-muted-foreground/80">Subtotal</span>
							<span class="text-right font-semibold text-foreground">{formatAmount(summarySubtotal)}</span>
							<span class="text-muted-foreground/80">Discount</span>
							<span class="text-right font-semibold text-red-500/80">-{formatAmount(Number(dialogEstimate.discount || 0))}</span>
							<span class="text-muted-foreground/80">Tax</span>
							<span class="text-right font-semibold text-green-600/90 dark:text-green-300/90">{formatAmount(summaryTax)}</span>
							<span class="text-muted-foreground/80">Total</span>
							<span class="text-right text-lg font-bold text-primary">{formatAmount(summaryTotal)}</span>
						</div>
						<div class="mt-1 grid grid-cols-2 gap-y-1 text-xs">
							<span class="text-muted-foreground">Waste</span>
							<span class="text-right font-medium">
								{dialogEstimate.wasteFactor
									? `${Number(dialogEstimate.wasteFactor).toFixed(2)}%`
									: '0%'}
							</span>
						</div>
					</div>
					<!-- Draft/Final select + actions -->
					<div class="mt-6 flex flex-col md:flex-row md:items-center items-end justify-between gap-3">
						<div class="flex items-center gap-3">
							{#if dialogEditMode}
								<Select
									bind:value={dialogEstimate.isDraft}
									class="w-40 rounded-full border border-border/60 bg-background"
									items={[
										{ value: true, label: 'Draft' },
										{ value: false, label: 'Final' }
									]}
									disabled={actionLoading ||
										(!dialogEstimate?.isDraft &&
											isAssignmentHasSavedEstimate(dialogAssignment) &&
											dialogAssignment?.estimates
												.find((e: any) => e.id === dialogEstimate?.id!)
												?.status?.toLowerCase() === 'saved')}
									onchange={(e: any) => handleChangeEstimateStatus(e.detail)}
								/>
								{#if !dialogEstimate.isDraft}
									<span class="text-muted-foreground text-xs">This is <b>final</b> and locked.</span>
								{:else}
									<span class="text-muted-foreground text-xs">Editable draft.</span>
								{/if}
							{:else}
								<Select
									bind:value={dialogEstimate.isDraft}
									class="w-28 rounded-full border border-border/60 bg-background"
									items={[
										{ value: true, label: 'Draft' },
										{ value: false, label: 'Final' }
									]}
									disabled={actionLoading || !canAddSavedEstimate(dialogAssignment)}
								/>
								{#if !canAddSavedEstimate(dialogAssignment) && !dialogEstimate.isDraft}
									<span class="text-destructive-foreground text-xs">One final already present.</span>
								{/if}
							{/if}
						</div>
						<div class="mt-1 flex gap-2">
							<Button
								variant="outline"
								class="rounded-full border px-4"
								onclick={() => (dialogOpen = false)}
								disabled={actionLoading}
							>
								Cancel
							</Button>
							<Button
								class="rounded-full px-5"
								onclick={handleSaveEstimate}
								disabled={actionLoading ||
									!dialogEstimate.items.length ||
									(!dialogEstimate.isDraft && !canAddSavedEstimate(dialogAssignment))}
							>
								{#if actionLoading}
									<span class="border-muted-foreground mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
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
			class="fixed top-1/2 left-1/2 z-50 w-[98vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-8 shadow-2xl"
		>
			<Dialog.Title class="flex items-center gap-2 pb-2 text-lg font-semibold">
				<TrashIcon class="text-destructive size-5" />
				Delete Estimate
			</Dialog.Title>
			<div class="pt-1 pb-5 text-base font-medium text-foreground/90">
				Are you sure you want to delete <span class="text-destructive font-semibold"
					>E-{confirmDeleteId}</span
				>?<br />
				<span class="text-muted-foreground/80 mt-1 block text-sm"
					>This action cannot be undone.</span
				>
			</div>
			<div class="mt-4 flex justify-end gap-2">
				<Button
					variant="outline"
					class="rounded-full px-5"
					onclick={closeConfirmDelete}
					disabled={deleteLoadingById[confirmDeleteId ?? 0]}>Cancel</Button
				>
				<Button
					variant="destructive"
					class="rounded-full px-5"
					onclick={() =>
						confirmDeleteId && handleDeleteEstimate(confirmDeleteId, confirmDeleteAssignment)}
					disabled={deleteLoadingById[confirmDeleteId ?? 0]}
				>
					{#if deleteLoadingById[confirmDeleteId ?? 0]}
						<span
							class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></span>
					{/if}
					Delete
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>
