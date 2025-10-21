<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import LeadCard from '$lib/components/leads/LeadCard.svelte';
	import * as Accordion from '$lib/components/ui/accordion';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import FilterIcon from '@lucide/svelte/icons/filter';

	const { data } = $props<{ leads: any[]; q: string; status: string; source: string }>();

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

	// Combined filters state
	let filters = $state({
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

	function updateUrl() {
		const params = new URLSearchParams($page.url.searchParams);
		if (searchText) params.set('q', searchText);
		else params.delete('q');
		if (filters.category !== 'All') params.set('status', filters.category);
		else params.delete('status');
		const nextSearch = params.toString() ? `?${params.toString()}` : '';
		const currentSearch = $page.url.search;
		const path = $page.url.pathname;
		if (browser && nextSearch !== currentSearch) {
			goto(`${path}${nextSearch}`, { replaceState: true, keepFocus: true, noScroll: true });
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
	<div class="relative mb-4 flex flex-wrap items-center gap-3 justify-center">
		<form class="relative flex min-w-64 grow gap-2" on:submit={handleSearch}>
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

		<Button variant="outline" class="ml-auto h-10" onclick={() => goto('/leads/assigned')}
			>See Assigned Leads</Button
		>
		<Button variant="outline" class="h-10" onclick={() => goto('/watchlist')}>See Watchlist</Button>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
		<!-- Sidebar Filters -->
		<Card class="sticky top-18 max-h-min p-3 md:p-4">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-lg font-extrabold">FILTERS</span>
				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8 cursor-pointer text-white"
					on:click={applyFilters}
				>
					<FilterIcon class="size-4" />
				</Button>
			</div>

			<Accordion.Root type="multiple">
				<!-- Status -->
				<Accordion.Item value="status">
					<Accordion.Trigger class="flex w-full items-center justify-between py-2 font-semibold">
						<span class="text-sm">STATUS</span>
					</Accordion.Trigger>
					<Accordion.Content>
						<div class="space-y-2 pl-2">
							{#each Object.entries(filters.status) as [status, checked]}
								<Label class="flex items-center gap-2 text-sm">
									<Checkbox
										bind:checked={filters.status[status as Status]}
										class="data-[state=checked]:border-purple-800 data-[state=checked]:bg-purple-800"
									/>
									{status.toUpperCase()}
								</Label>
							{/each}
						</div>
					</Accordion.Content>
				</Accordion.Item>

				<!-- Work Type -->
				<Accordion.Item value="workType">
					<Accordion.Trigger class="flex w-full items-center justify-between py-2 font-semibold">
						<span class="text-sm">WORK TYPE</span>
					</Accordion.Trigger>
					<Accordion.Content>
						<div class="space-y-2 pl-2">
							{#each Object.entries(filters.workType) as [type, checked]}
								<Label class="flex items-center gap-2 text-sm">
									<Checkbox
										bind:checked={filters.workType[type as WorkType]}
										class="data-[state=checked]:border-purple-800 data-[state=checked]:bg-purple-800"
									/>
									{type}
								</Label>
							{/each}
						</div>
					</Accordion.Content>
				</Accordion.Item>

				<!-- Source -->
				<Accordion.Item value="source">
					<Accordion.Trigger class="flex w-full items-center justify-between py-2 font-semibold">
						<span class="text-sm">SOURCE</span>
					</Accordion.Trigger>
					<Accordion.Content>
						<div class="space-y-2 pl-2">
							{#each Object.entries(filters.source) as [source, checked]}
								<Label class="flex items-center gap-2 text-sm">
									<Checkbox
										bind:checked={filters.source[source as SourceType]}
										class="data-[state=checked]:border-purple-800 data-[state=checked]:bg-purple-800"
									/>
									{source}
								</Label>
							{/each}
						</div>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</Card>

		<!-- Lead List -->
		<section class="space-y-4">
			{#each filtered as lead}
				<LeadCard
					{lead}
					{reps}
					role={$page?.data?.user?.role!}
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
</div>
