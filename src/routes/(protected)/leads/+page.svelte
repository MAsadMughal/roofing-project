<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import OwnerLeadCard from '$lib/components/leads/OwnerLeadCard.svelte';
	import * as Accordion from '$lib/components/ui/accordion';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import SearchIcon from '@lucide/svelte/icons/search';

	const { data } = $props<{
		leads: any[];
		q: string;
		status: string;
		source: string;
		unassigned?: string;
	}>();

	type Status = 'new' | 'contacted' | 'qualified' | 'lost' | 'converted';
	type WorkType = 'Repair' | 'Replace' | 'Installation' | 'Re-Roof';
	type SourceType =
		| 'Google Forms'
		| 'Website'
		| 'Social Media'
		| 'Outreach'
		| 'Cold Calling'
		| 'Email Marketing';

	type Lead = any;
	let leads: Lead[] = $state(Array.isArray(data.leads) ? data.leads : []);

	// Search and sort state
	let searchInput = $state(data.q || '');
	let searchText = $state(data.q || '');
	let sortBy: 'Newest' | 'Oldest' | 'Name' | 'Source' = $state('Newest');
	const sortOptions = ['Newest', 'Oldest', 'Name', 'Source'] as const;

	// Unassigned-only server filter
	let unassignedOnly = $state(Boolean(data.unassigned));

	// Combined filters state
	let filters: any = $state({
		watchlistOnly: false,
		category: (data.status as Status | 'All') || 'All',
		status: {
			new: true,
			contacted: true,
			qualified: true,
			lost: true,
			converted: true
		},
		workType: {
			Repair: true,
			Replace: true,
			Installation: true,
			'Re-Roof': true
		},
		source: {
			'Google Forms': true,
			Website: true,
			'Social Media': true,
			Outreach: true,
			'Cold Calling': true,
			'Email Marketing': true
		}
	});

	function handleSearch(e: Event) {
		e.preventDefault();
		searchText = searchInput;
		updateUrl();
	}

	function applyFilters() {
		updateUrl();
	}
	async function updateUrl() {
		const params = new URLSearchParams($page.url.searchParams);
		if (searchText) params.set('q', searchText);
		else params.delete('q');
		if (filters.category !== 'All') params.set('status', filters.category);
		else params.delete('status');
		if (unassignedOnly) params.set('unassigned', 'true');
		else params.delete('unassigned');
		const nextSearch = params.toString() ? `?${params.toString()}` : '';
		const currentSearch = $page.url.search;
		const path = $page.url.pathname;
		if (browser && nextSearch !== currentSearch) {
			goto(`${path}${nextSearch}`, { replaceState: true, keepFocus: true, noScroll: true });
			leads = data.leads;
		}
	}

	// Assignment state
	let selectedLeadId: bigint | null = $state(null);
	let reps: Array<{ id: string; name: string; email: string }> = $state([]);
	let selectedRepId: string | undefined = $state(undefined);
	let assigning = $state(false);
	let assignError: string | null = $state(null);

	async function toggleWatchlist(lead: Lead) {
		const next = !lead.watchlisted;
		leads = leads.map((l) => (l.id === lead.id ? { ...l, _savingWatchlist: true } : l));
		try {
			const res = await fetch(`/api/watchlist${next ? '' : `?leadId=${lead.id}`}`, {
				method: next ? 'POST' : 'DELETE',
				headers: { 'content-type': 'application/json' },
				body: next ? JSON.stringify({ leadId: lead.id }) : undefined
			});
			if (!res.ok) throw new Error('failed');
			leads = leads.map((l) =>
				l.id === lead.id ? { ...l, watchlisted: next, _savingWatchlist: false } : l
			);
		} catch (err) {
			leads = leads.map((l) => (l.id === lead.id ? { ...l, _savingWatchlist: false } : l));
		}
	}

	async function openAssign(leadId: bigint) {
		assignError = null;
		selectedLeadId = leadId;
		const res = await fetch('/api/users?role=REP');
		const users = await res.json().catch(() => []);
		reps = users.map((u: any) => ({
			id: String(u.id),
			name: (u.firstName || '') + ' ' + (u.lastName || ''),
			email: u.email
		}));
		selectedRepId = reps[0]?.id;
	}

	async function assignLead() {
		if (!selectedLeadId || !selectedRepId) return;
		assigning = true;
		assignError = null;
		try {
			const res = await fetch(`/api/leads/${selectedLeadId}/assign`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ userId: selectedRepId })
			});
			const out = await res.json().catch(() => ({}));
			if (!res.ok) {
				assignError = out.error || 'Failed to assign lead';
				return;
			}
			if (out?.lead) {
				leads = leads.map((l) => (l.id === selectedLeadId ? { ...l, ...out.lead } : l));
			}
			selectedLeadId = null;
		} finally {
			assigning = false;
		}
	}

	// Filtered leads
	const filtered = $derived(
		leads
			.filter((l) => (filters.watchlistOnly ? l.watchlisted : true))
			.filter((l) => (filters.category === 'All' ? true : l.status === filters.category))
			.filter((l) =>
				searchText
					? [l.title, l.description, `${l.first_name} ${l.last_name}`, l.email, l.phone]
							.join(' ')
							.toLowerCase()
							.includes(searchText.toLowerCase())
					: true
			)
			.toSorted((a, b) => {
				if (sortBy === 'Newest') return (b.created_at ?? '').localeCompare(a.created_at ?? '');
				if (sortBy === 'Oldest') return (a.created_at ?? '').localeCompare(b.created_at ?? '');
				if (sortBy === 'Name')
					return `${a.first_name ?? ''} ${a.last_name ?? ''}`.localeCompare(
						`${b.first_name ?? ''} ${b.last_name ?? ''}`
					);
				return (a.source ?? '').localeCompare(b.source ?? '');
			})
	);

	$effect(() => {
		if (browser) updateUrl();
	});
</script>

<svelte:head>
	<title>Leads</title>
</svelte:head>

<div class="w-full">
	<h1 class="mb-4 text-3xl font-extrabold tracking-tight">LEADS</h1>

	<!-- Toolbar -->
	<div class="relative mb-4 flex flex-wrap items-center justify-center gap-3">
		<form class="relative flex min-w-64 grow gap-2" onsubmit={handleSearch}>
			<div class="relative grow">
				<SearchIcon class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input placeholder="SEARCH LEADS..." bind:value={searchInput} class="pl-9" />
			</div>
			<Button type="submit" variant="outline" class="!h-9.5">Search</Button>
		</form>

		<Select.Root type="single" name="sort" bind:value={sortBy}>
			<Select.Trigger class="min-w-40">
				{sortBy}
			</Select.Trigger>
			<Select.Content>
				<Select.Group>
					{#each sortOptions as opt}
						<Select.Item value={opt}>{opt}</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>

		<Dialog.Root>
			<Dialog.Trigger>
				<Button variant="outline" class="relative h-10">
					<FilterIcon class="mr-2 size-4" />
					Filters
					{#if Object.values(filters).some( (category: any) => Object.values(category).some(Boolean) )}
						<div
							class="absolute -top-1.5 -right-1.5 size-3 rounded-full border-2 bg-blue-700"
						></div>
					{/if}
				</Button>
			</Dialog.Trigger>
			<Dialog.Content class="max-w-md">
				<Dialog.Header>
					<Dialog.Title>Filters</Dialog.Title>
					<Dialog.Description>Filter leads by status, work type and source</Dialog.Description>
				</Dialog.Header>

				<div class="max-h-[70vh] overflow-y-auto rounded-b-lg border-b">
					<Label class="flex items-center gap-2 text-sm">
						<Checkbox bind:checked={unassignedOnly} onchange={applyFilters} />
						Unassigned only
					</Label>
					<Accordion.Root type="multiple" class="space-y-2">
						<!-- Status -->
						<Accordion.Item value="status" class="rounded-lg border">
							<Accordion.Trigger class="flex w-full items-center justify-between p-4">
								<div class="relative">
									<span class="font-semibold">Status</span>
									{#if Object.entries(filters.status).filter(([, v]) => v).length > 0}
										<div
											class="absolute -top-1 -right-4 flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white"
										>
											{Object.entries(filters.status).filter(([, v]) => v).length}
										</div>
									{/if}
								</div>
							</Accordion.Trigger>
							<Accordion.Content class="border-t px-4 pb-4">
								<div class="space-y-2 pt-2">
									{#each Object.entries(filters.status) as [status, checked]}
										<Label
											class="flex cursor-pointer items-center gap-2 rounded p-1 text-sm hover:bg-accent/50"
										>
											<Checkbox
												bind:checked={filters.status[status as Status]}
												class="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
											/>
											{status.toUpperCase()}
										</Label>
									{/each}
								</div>
							</Accordion.Content>
						</Accordion.Item>

						<!-- Work Type -->
						<Accordion.Item value="workType" class="rounded-lg border">
							<Accordion.Trigger class="flex w-full items-center justify-between p-4">
								<div class="relative">
									<span class="font-semibold">Work Type</span>
									{#if Object.entries(filters.workType).filter(([, v]) => v).length > 0}
										<div
											class="absolute -top-1 -right-4 flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white"
										>
											{Object.entries(filters.workType).filter(([, v]) => v).length}
										</div>
									{/if}
								</div>
							</Accordion.Trigger>
							<Accordion.Content class="border-t px-4 pb-4">
								<div class="space-y-2 pt-2">
									{#each Object.entries(filters.workType) as [type, checked]}
										<Label
											class="flex cursor-pointer items-center gap-2 rounded p-1 text-sm hover:bg-accent/50"
										>
											<Checkbox
												bind:checked={filters.workType[type as WorkType]}
												class="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
											/>
											{type}
										</Label>
									{/each}
								</div>
							</Accordion.Content>
						</Accordion.Item>

						<!-- Source -->
						<Accordion.Item value="source" class="rounded-lg border-1">
							<Accordion.Trigger class="flex w-full items-center justify-between p-4">
								<div class="relative">
									<span class="font-semibold">Source</span>
									{#if Object.entries(filters.source).filter(([, v]) => v).length > 0}
										<div
											class="absolute -top-1 -right-4 flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white"
										>
											{Object.entries(filters.source).filter(([, v]) => v).length}
										</div>
									{/if}
								</div>
							</Accordion.Trigger>
							<Accordion.Content class="border-t px-4 pb-4">
								<div class="space-y-2 pt-2">
									{#each Object.entries(filters.source) as [source, checked]}
										<Label
											class="flex cursor-pointer items-center gap-2 rounded p-1 text-sm hover:bg-accent/50"
										>
											<Checkbox
												bind:checked={filters.source[source as SourceType]}
												class="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
											/>
											{source}
										</Label>
									{/each}
								</div>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>
				</div>

				<Dialog.Footer class="mt-6 flex justify-between">
					<Button
						variant="outline"
						onclick={() => {
							Object.keys(filters).forEach((category) => {
								Object.keys(filters[category]).forEach((key) => {
									filters[category][key] = false;
								});
							});
							applyFilters();
						}}
					>
						Reset Filters
					</Button>
					<Dialog.Close>
						<Button onclick={applyFilters}>Apply Filters</Button>
					</Dialog.Close>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>

		<Button variant="outline" class="h-10" onclick={() => goto('/watchlist')}>See Watchlist</Button>
	</div>

	<!-- Lead List -->
	<section class="max-h-[calc(100vh-206px)] space-y-4 overflow-y-auto">
		{#each filtered as lead}
			<OwnerLeadCard
				{lead}
				history={lead.history}
				{reps}
				bind:selectedRepId
				{assigning}
				{assignError}
				watchlistSaving={Boolean(lead._savingWatchlist)}
				onToggleWatchlist={toggleWatchlist}
				onOpenAssign={openAssign}
				onAssign={assignLead}
			/>
		{/each}
	</section>
</div>
