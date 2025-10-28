<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as Accordion from '$lib/components/ui/accordion';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Select from '$lib/components/ui/select/select.svelte';
	import Download from '@lucide/svelte/icons/download';
	import Plus from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
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
		| 'Converted';

	type Estimate = any;
	const estimates: Estimate[] = data.estimates;
	let assignments: any[] = data.assignments ?? [];
	let searchText = data.q || '';
	let statusFilter: 'All' | EstimateStatus = (data.status as any) || 'All';
	let sortBy: 'Newest' | 'Oldest' | 'Amount' | 'Customer' = 'Newest';
	let showNewEstimateForm = false;
	let selectedAssignment: any = null;
	let isDraft = true;
	let role: string | null = data.role ?? null;
	// Types
	type ItemRow = { label: string; quantity: number; unitPrice: number };
	type NewEstimateForm = {
		items: ItemRow[];
		notes: string;
		assignmentId: string;
		isDraft: boolean;
		taxRate: number;
		discount: number;
		wasteFactor: number; // percent
	};

	// Flexible estimate form data
	let newEstimate: NewEstimateForm = {
		items: [{ label: '', quantity: 1, unitPrice: 0 }],
		notes: '',
		assignmentId: '',
		isDraft: true,
		taxRate: 0,
		discount: 0,
		wasteFactor: 0
	};
	console.log('role', role);

	function startNewEstimate() {
		if (!selectedAssignment) {
			alert('Please select an assignment first');
			return;
		}
		newEstimate.assignmentId = selectedAssignment.id;
		newEstimate.isDraft = isDraft;
		showNewEstimateForm = true;
	}

	// Itemized calculator rows
	function addItem() {
		newEstimate.items = [...newEstimate.items, { label: '', quantity: 1, unitPrice: 0 }];
	}
	function removeItem(index: number) {
		newEstimate.items = newEstimate.items.filter((_, i) => i !== index);
	}

	function computeSubtotal() {
		const base = newEstimate.items.reduce(
			(sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0),
			0
		);
		const multiplier = 1 + Math.max(0, Number(newEstimate.wasteFactor) || 0) / 100;
		return base * multiplier;
	}
	function computeTaxAmount(subtotal: number) {
		return (
			(subtotal - Number(newEstimate.discount || 0)) *
			(Math.max(0, Number(newEstimate.taxRate) || 0) / 100)
		);
	}
	function calculateTotal() {
		const subtotal = computeSubtotal();
		const tax = computeTaxAmount(subtotal);
		return subtotal - Number(newEstimate.discount || 0) + tax;
	}

	async function handleNewEstimate() {
		if (!newEstimate.assignmentId) return;
		const items = newEstimate.items;
		const res = await fetch('/api/estimates', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				assignmentId: newEstimate.assignmentId,
				items,
				notes: newEstimate.notes,
				status: newEstimate.isDraft ? 'draft' : 'saved',
				taxRate: Number(newEstimate.taxRate || 0),
				discount: Number(newEstimate.discount || 0),
				wasteFactor: Number(newEstimate.wasteFactor || 0)
			})
		});
		if (res.ok) {
			showNewEstimateForm = false;
			selectedAssignment = null;
			await refreshAssignments();
			newEstimate = {
				items: [{ label: '', quantity: 1, unitPrice: 0 }],
				notes: '',
				assignmentId: '',
				isDraft: true,
				taxRate: 0,
				discount: 0,
				wasteFactor: 0
			};
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
		}
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
			return `${a.first_name ?? ''} ${b.last_name ?? ''}`.localeCompare(
				`${b.first_name ?? ''} ${b.last_name ?? ''}`
			);
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
	<h1 class="mb-4 text-3xl font-extrabold tracking-tight">Estimates</h1>

	<!-- Assignment Selection -->
	{#if !showNewEstimateForm && role === 'ESTIMATOR'}
		<Card.Root class="mb-6">
			<Card.Header>
				<Card.Title>Create New Estimate</Card.Title>
				<Card.Description>Select an assignment and estimate type to begin</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<div>
						<label for="assignment" class="mb-2 block text-sm font-medium">Select Assignment</label>
						<Select
							bind:value={selectedAssignment}
							class="w-full"
							items={data?.assignments?.map((a) => ({
								value: a,
								label: `${a.title} - ${a.customer_name}`
							}))}
						/>
					</div>
					<fieldset>
						<legend class="mb-2 block text-sm font-medium">Estimate Type</legend>
						<div class="flex gap-4">
							<label for="a" class="flex items-center gap-2">
								<input type="radio" name="estimate-type" bind:group={isDraft} value={true} />
								Draft
							</label>
							<label for="a" class="flex items-center gap-2">
								<input type="radio" name="estimate-type" bind:group={isDraft} value={false} />
								Final
							</label>
						</div>
					</fieldset>
					<Button class="w-full" onclick={startNewEstimate} disabled={!selectedAssignment}>
						<Plus class="mr-2 size-4" />
						Create {isDraft ? 'Draft' : 'Final'} Estimate
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Toolbar -->
	<div class="mb-4 flex flex-wrap items-center gap-3">
		<div class="relative min-w-64 grow">
			<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
			<label for="search" class="sr-only">Search estimates</label>
			<Input id="search" placeholder="Search estimates..." bind:value={searchText} class="pl-9" />
		</div>
		<label for="status-filter" class="sr-only">Filter by status</label>
		<Select
			bind:value={statusFilter}
			class="w-40"
			items={[
				{ value: 'All', label: 'All statuses' },
				{ value: 'Draft' },
				{ value: 'Sent' },
				{ value: 'Viewed' },
				{ value: 'Accepted' },
				{ value: 'Declined' },
				{ value: 'Expired' },
				{ value: 'Invoiced' },
				{ value: 'Converted' }
			]}
		/>
		<label for="sort-by" class="sr-only">Sort by</label>
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

	{#if showNewEstimateForm}
		<div class="mb-8 grid gap-6 py-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Estimate Calculator</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="overflow-auto">
						<div class="mb-2 grid grid-cols-12 items-center gap-2 text-sm font-medium">
							<div class="col-span-6">Item</div>
							<div class="col-span-2 text-right">Qty</div>
							<div class="col-span-2 text-right">Unit Price</div>
							<div class="col-span-2 text-right">Total</div>
						</div>
						{#each newEstimate.items as it, i}
							<div class="mb-2 grid grid-cols-12 items-center gap-2">
								<Input class="col-span-6" bind:value={it.label} placeholder="Description" />
								<Input
									class="col-span-2 text-right"
									type="number"
									min="0"
									step="0.01"
									bind:value={it.quantity}
								/>
								<Input
									class="col-span-2 text-right"
									type="number"
									min="0"
									step="0.01"
									bind:value={it.unitPrice}
								/>
								<div class="col-span-2 text-right text-sm">
									{formatAmount(Number(it.quantity || 0) * Number(it.unitPrice || 0))}
								</div>
								<div class="col-span-12 flex justify-end">
									<Button variant="outline" size="sm" onclick={() => removeItem(i)}>Remove</Button>
								</div>
							</div>
						{/each}
						<div class="mt-2"><Button variant="outline" onclick={addItem}>Add Item</Button></div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Adjustments</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="grid grid-cols-3 gap-3">
						<div>
							<label for="a" class="mb-1 block text-xs">Tax Rate (%)</label>
							<Input type="number" min="0" step="0.01" bind:value={newEstimate.taxRate} />
						</div>
						<div>
							<label for="a" class="mb-1 block text-xs">Discount ($)</label>
							<Input type="number" min="0" step="0.01" bind:value={newEstimate.discount} />
						</div>
						<div>
							<label for="a" class="mb-1 block text-xs">Waste Factor (%)</label>
							<Input type="number" min="0" step="0.01" bind:value={newEstimate.wasteFactor} />
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Notes</Card.Title>
				</Card.Header>
				<Card.Content>
					<textarea
						bind:value={newEstimate.notes}
						class="h-32 w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
						placeholder="Enter any additional notes..."
					></textarea>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Summary</Card.Title>
				</Card.Header>
				<Card.Content>
					{#key `${newEstimate.taxRate}-${newEstimate.discount}-${newEstimate.wasteFactor}-${newEstimate.items.length}`}
						<div class="grid grid-cols-2 gap-2 text-sm">
							<div class="text-muted-foreground">Subtotal</div>
							<div class="text-right font-medium">{formatAmount(computeSubtotal())}</div>
							<div class="text-muted-foreground">Discount</div>
							<div class="text-right font-medium">
								-{formatAmount(Number(newEstimate.discount || 0))}
							</div>
							<div class="text-muted-foreground">Tax</div>
							<div class="text-right font-medium">
								{formatAmount(computeTaxAmount(computeSubtotal()))}
							</div>
							<div class="text-muted-foreground">Total</div>
							<div class="text-right font-semibold">{formatAmount(calculateTotal())}</div>
						</div>
					{/key}
				</Card.Content>
			</Card.Root>

			<div class="flex items-center justify-between">
				<div class="text-xl font-bold">
					Total: {formatAmount(calculateTotal())}
				</div>
				<div class="flex gap-3">
					<Button variant="outline" onclick={() => (showNewEstimateForm = false)}>Cancel</Button>
					<Button onclick={handleNewEstimate} disabled={role !== 'ESTIMATOR'}>
						Create {isDraft ? 'Draft' : 'Final'} Estimate
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Accordion by Assignments with estimate cards -->
	<Accordion.Root type="single" class="w-full">
		{#each assignments as a}
			<Accordion.Item value={`a-${a.id}`}>
				<Accordion.Trigger>
					<div class="flex w-full items-center justify-between">
						<div class="text-left">
							<div class="font-semibold">
								{a.lead?.title} <span class="text-xs text-slate-500">(#{a.leadId})</span>
							</div>
							<div class="text-xs text-slate-500">
								Customer: {a.lead?.customer?.firstName}
								{a.lead?.customer?.lastName}
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span class="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800"
								>{a.status}</span
							>
							{#if role === 'ESTIMATOR'}
								<Button
									size="sm"
									onclick={() => {
										selectedAssignment = a;
										isDraft = true;
										startNewEstimate();
									}}>Add Estimate</Button
								>
							{/if}
						</div>
					</div>
				</Accordion.Trigger>
				<Accordion.Content>
					{#if a.estimates?.length}
						<div class="grid gap-3 py-3">
							{#each a.estimates as e}
								<div class="rounded-2xl border p-3 shadow-sm">
									<div class="flex items-center justify-between">
										<div>
											<div class="font-medium">
												Estimate E-{e.id} • <span class="uppercase">{e.status}</span>
											</div>
											<div class="text-xs text-slate-500">
												{new Date(e.createdAt).toLocaleString()}
											</div>
										</div>
										<div class="text-right font-semibold">
											${Number(e.totalAmount ?? 0).toFixed(2)}
										</div>
									</div>
									<div class="mt-2 text-sm text-slate-600 dark:text-slate-300">
										{#if e.details?.items?.length}
											<ul class="list-disc pl-5">
												{#each e.details.items.slice(0, 4) as it}
													<li>
														{it.label} — {it.quantity} x ${Number(it.unitPrice).toFixed(2)} = ${Number(
															it.total
														).toFixed(2)}
													</li>
												{/each}
											</ul>
										{:else}
											<div class="text-xs text-slate-500">No items</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="py-3 text-sm text-slate-500">No estimates for this assignment yet.</div>
					{/if}
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>

	<div class="text-muted-foreground mt-3 text-xs">
		Showing {filtered.length} of {estimates.length} estimates
	</div>
</div>
