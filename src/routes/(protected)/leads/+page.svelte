<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import SearchIcon from '@lucide/svelte/icons/search';
	import LeadCard from '$lib/components/leads/LeadCard.svelte';
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
	const fruits = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'blueberry', label: 'Blueberry' },
		{ value: 'grapes', label: 'Grapes' },
		{ value: 'pineapple', label: 'Pineapple' }
	];

	let value = $state('');

	const triggerContent = $derived(fruits.find((f) => f.value === value)?.label ?? 'Select a fruit');
	// Toolbar state
	let searchText = $state(data.q || '');
	let sortBy: 'Newest' | 'Oldest' | 'Name' | 'Source' = $state('Newest');
	let category: 'All' | Status = $state(((data.status as any) || 'All') as 'All' | Status);

	const sortOptions: Array<'Newest' | 'Oldest' | 'Name' | 'Source'> = [
		'Newest',
		'Oldest',
		'Name',
		'Source'
	];
	const sortTriggerContent = $derived(sortBy);



	// Sidebar filter state
	let watchlistOnly = $state(false);
	let statusFilters: Record<Status, boolean> = {
		new: true,
		contacted: true,
		qualified: true,
		lost: true,
		converted: true
	};
	let workTypeFilters: Record<WorkType, boolean> = {
		Repair: true,
		Replace: true,
		Installation: true,
		'Re-Roof': true
	};
	let sourceFilters: Record<SourceType, boolean> = {
		'Google Forms': true,
		Website: true,
		'Social Media': true,
		Outreach: true,
		'Cold Calling': true,
		'Email Marketing': true
	};

	function updateUrl() {
		const params = new URLSearchParams($page.url.searchParams);
		if (searchText) params.set('q', searchText);
		else params.delete('q');
		if (category && category !== 'All') params.set('status', category as string);
		else params.delete('status');
		const nextSearch = params.toString() ? `?${params.toString()}` : '';
		const currentSearch = $page.url.search;
		const path = $page.url.pathname;
		if (browser && nextSearch !== currentSearch) {
			goto(`${path}${nextSearch}`, { replaceState: true, keepFocus: true, noScroll: true });
		}
	}

	// Collapsible sections
	let openStatus = $state(true);
	let openWorkType = $state(true);
	let openSource = $state(true);

	async function toggleWatchlist(lead: Lead) {
		const next = !lead.watchlisted;
		leads = (leads || []).map((l) => (l.id === lead.id ? { ...l, _savingWatchlist: true } : l));
		try {
			const res = await fetch(`/api/watchlist${next ? '' : `?leadId=${lead.id}`}`, {
				method: next ? 'POST' : 'DELETE',
				headers: { 'content-type': 'application/json' },
				body: next ? JSON.stringify({ leadId: lead.id }) : undefined
			});

			if (!res.ok) throw new Error('failed');

			// Update local state after successful API call
			leads = (leads || []).map((l) => 
				l.id === lead.id ? { ...l, watchlisted: next, _savingWatchlist: false } : l
			);

		} catch (err) {
			// Revert on error
			leads = (leads || []).map((l) => 
				l.id === lead.id ? { ...l, _savingWatchlist: false } : l
			);
		}
	}

	// Assign modal state
	let selectedLeadId: bigint | null = $state(null);
	let reps: Array<{ id: string; name: string; email: string }> = $state([]);
	let selectedRepId: string | undefined = $state(undefined);
	let assigning = $state(false);
	let assignError: string | null = $state(null);

	async function openAssign(leadId: bigint) {
		assignError = null;
		selectedLeadId = leadId;
		const res = await fetch('/api/users?role=REP');
		const users = await res.json().catch(() => []);
		reps = (users || []).map((u: any) => ({
			id: String(u.id),
			name: (u.firstName || '') + ' ' + (u.lastName || ''),
			email: u.email
		}));
		selectedRepId = reps[0]?.id ?? undefined;
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
			// update local lead immutably using response if provided
			if (out?.lead) {
				const updated = out.lead;
				leads = (leads || []).map((l) => (l.id === selectedLeadId ? { ...l, ...updated } : l));
			}
			selectedLeadId = null;
		} finally {
			assigning = false;
		}
	}

	// Derived filtered list
	const filtered = $derived(
		(leads || [])
			.filter((l) => (watchlistOnly ? l.watchlisted : true))
			.filter((l) => (category === 'All' ? true : l.status === category))
			.filter((l) =>
				searchText
					? [
							l.title ?? '',
							l.description ?? '',
							`${l.first_name ?? ''} ${l.last_name ?? ''}`,
							l.email ?? '',
							l.phone ?? ''
						]
							.join(' ')
							.toLowerCase()
							.includes(searchText.toLowerCase())
					: true
			)
			.toSorted((a, b) => {
				if (sortBy === 'Newest') return (b.created_at ?? '').localeCompare(a.created_at ?? '');
				if (sortBy === 'Oldest') return (a.created_at ?? '').localeCompare(b.created_at ?? '');
				if (sortBy === 'Name')
					return ((a.first_name ?? '') + (a.last_name ?? '')).localeCompare(
						(b.first_name ?? '') + (b.last_name ?? '')
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
	<div class="relative mb-4 flex flex-wrap items-center gap-3">
		<div class="relative min-w-64 grow">
			<SearchIcon class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input placeholder="SEARCH LEADS..." bind:value={searchText} class="pl-9" />
		</div>
		<Select.Root type="single" name="sort" bind:value={sortBy}>
			<Select.Trigger class="min-w-40">
				{sortTriggerContent}
			</Select.Trigger>
			<Select.Content class="">
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
		<Button variant="outline" class="h-10" onclick={() => goto('/watchlist')}
			>See Watchlist</Button
		>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
		<!-- Sidebar Filters -->
		<Card class="sticky top-16 max-h-min  p-3 md:p-4">
			<div class="mb-2 text-lg font-extrabold">FILTERS</div>

			<Label class="mb-3 flex items-center gap-2 text-sm font-semibold">
				<Checkbox bind:checked={watchlistOnly} />
				WATCH LIST
			</Label>

			<!-- Status -->
			<button
				class="flex w-full items-center justify-between py-2 font-semibold"
				onclick={() => (openStatus = !openStatus)}
			>
				<span class="text-sm">STATUS</span>
				<ChevronDown class={`size-4 transition-transform ${openStatus ? 'rotate-180' : ''}`} />
			</button>
			{#if openStatus}
				<div class="space-y-2 pl-2">
					{#each Object.keys(statusFilters) as s}
						<Label class="flex items-center gap-2 text-sm">
							<Checkbox bind:checked={statusFilters[s as Status]} />
							{(s as string).toUpperCase()}
						</Label>
					{/each}
				</div>
			{/if}

			<!-- Work Type -->
			<button
				class="mt-3 flex w-full items-center justify-between py-2 font-semibold"
				onclick={() => (openWorkType = !openWorkType)}
			>
				<span class="text-sm">Work Type</span>
				<ChevronDown class={`size-4 transition-transform ${openWorkType ? 'rotate-180' : ''}`} />
			</button>
			{#if openWorkType}
				<div class="space-y-2 pl-2">
					{#each Object.keys(workTypeFilters) as w}
						<Label class="flex items-center gap-2 text-sm">
							<Checkbox bind:checked={workTypeFilters[w as WorkType]} />
							{w}
						</Label>
					{/each}
				</div>
			{/if}

			<!-- Source -->
			<button
				class="mt-3 flex w-full items-center justify-between py-2 font-semibold"
				onclick={() => (openSource = !openSource)}
			>
				<span class="text-sm">SOURCE</span>
				<ChevronDown class={`size-4 transition-transform ${openSource ? 'rotate-180' : ''}`} />
			</button>
			{#if openSource}
				<div class="space-y-2 pl-2">
					{#each Object.keys(sourceFilters) as so}
						<Label class="flex items-center gap-2 text-sm">
							<Checkbox bind:checked={sourceFilters[so as SourceType]} />
							{so}
						</Label>
					{/each}
				</div>
			{/if}
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
					watchlistSaving={Boolean((lead as any)._savingWatchlist)}
					onToggleWatchlist={toggleWatchlist}
					onOpenAssign={openAssign}
					onAssign={assignLead}
				/>
			{/each}
		</section>
	</div>
</div>
