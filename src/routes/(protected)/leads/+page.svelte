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
		| 'Email Marketing'
		| 'Custom';

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
			'Email Marketing': true,
			Custom: true
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

	// Add Custom Lead dialog state
	let showAddLead = $state(false);

	// Minimal required fields according to likely schema (first name, last name, phone, email, address, status (default: new), source: custom, description/title optional)
	let addLeadForm = $state({
		first_name: '',
		last_name: '',
		phone: '',
		email: '',
		address: '',
		title: '',
		description: '',
		work_type: '',
		status: 'new' as Status
	});
	let addLeadError: string | null = $state(null);
	let addingLead = $state(false);

	async function submitCustomLead(e?: Event) {
		console.log('hello')
		if (e) e.preventDefault();
		addLeadError = null;
		addingLead = true;
		const payload: Record<string, string> = {
			first_name: addLeadForm.first_name,
			last_name: addLeadForm.last_name,
			phone: addLeadForm.phone,
			email: addLeadForm.email,
			address: addLeadForm.address,
			title: addLeadForm.title,
			description: addLeadForm.description,
			status: addLeadForm.status,
			work_type: addLeadForm.work_type,
			source: 'Custom'
		};
		// Minimal validation
		if (	!payload.first_name.trim() ||	!payload.last_name.trim() ||	!payload.phone.trim() ||	!payload.email.trim() ||	!payload.address.trim()) {
			addLeadError = 'Please fill in all required fields.';
			addingLead = false;
			return;
		}
		try {
			const res = await fetch('/api/leads', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const out = await res.json().catch(() => ({}));
			if (!res.ok) {
				addLeadError = out?.error || 'Failed to add lead.';
				addingLead = false;
				return;
			}
			if (out?.lead) {
				leads = [out.lead, ...leads];
				addLeadForm = {
					first_name: '',
					last_name: '',
					phone: '',
					email: '',
					address: '',
					title: '',
					description: '',
					work_type: '',
					status: 'new'
				};
				showAddLead = false;
			}
		} catch (err) {
			addLeadError = 'Network or server error';
		} finally {
			addingLead = false;
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

		<!-- Enhanced New Custom Lead Modal/Dialog UX/UI for true production community use -->

		<Dialog.Root bind:open={showAddLead}>
			<Dialog.Trigger>
				<Button variant="default" class="h-10 font-semibold shadow" type="button">
					<span class="inline-flex items-center gap-2">
						<svg aria-hidden="true" class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
						Add Custom Lead
					</span>
				</Button>
			</Dialog.Trigger>
			<Dialog.Content class="max-w-xl p-0 rounded-lg shadow-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-y-auto">
				<Dialog.Header class="mb-0 border-b px-6 py-4 flex items-center">
					<Dialog.Title class="text-lg font-semibold tracking-tight">
						Add Custom Lead
					</Dialog.Title>
					<p class="ml-auto text-xs text-gray-500">
						Fields marked <span class="text-red-500">*</span> are required.
					</p>
				</Dialog.Header>
				<form class="space-y-5 px-6 py-6">
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Label class="flex flex-col gap-1">
							<span class="font-semibold text-zinc-700 text-[15px] leading-5">
								First Name <span class="text-red-500">*</span>
							</span>
							<Input
								bind:value={addLeadForm.first_name}
								required
								name="first_name"
								autocomplete="off"
								class="rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 transition text-base"
							/>
						</Label>
						<Label class="flex flex-col gap-1">
							<span class="font-semibold text-zinc-700 text-[15px] leading-5">
								Last Name <span class="text-red-500">*</span>
							</span>
							<Input
								bind:value={addLeadForm.last_name}
								required
								name="last_name"
								autocomplete="off"
								class="rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 transition text-base"
							/>
						</Label>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Label class="flex flex-col gap-1">
							<span class="font-semibold text-zinc-700 text-[15px] leading-5">
								Email <span class="text-red-500">*</span>
							</span>
							<Input
								type="email"
								bind:value={addLeadForm.email}
								required
								name="email"
								autocomplete="off"
								class="rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 transition text-base"
							/>
						</Label>
						<Label class="flex flex-col gap-1">
							<span class="font-semibold text-zinc-700 text-[15px] leading-5">
								Phone <span class="text-red-500">*</span>
							</span>
							<Input
								bind:value={addLeadForm.phone}
								required
								name="phone"
								autocomplete="off"
								class="rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 transition text-base"
							/>
						</Label>
					</div>
					<Label class="flex flex-col gap-1">
						<span class="font-semibold text-zinc-700 text-[15px] leading-5">
							Address <span class="text-red-500">*</span>
						</span>
						<Input
							bind:value={addLeadForm.address}
							required
							name="address"
							autocomplete="off"
							class="rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 transition text-base"
						/>
					</Label>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Label class="flex flex-col gap-1">
							<span class="font-semibold text-zinc-700 text-[15px] leading-5">Title</span>
							<Input
								bind:value={addLeadForm.title}
								name="title"
								autocomplete="off"
								class="rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 text-base"
							/>
						</Label>
						<Label class="flex flex-col gap-1">
							<span class="font-semibold text-zinc-700 text-[15px] leading-5">Work Type</span>
							<Select.Root value={addLeadForm.work_type} on:change={e => addLeadForm.work_type = e.detail}>
								<Select.Trigger class="rounded border px-3 py-2 w-full text-left bg-white dark:bg-zinc-900 text-base">
									{addLeadForm.work_type ? addLeadForm.work_type : 'Select Work Type'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="Repair">Repair</Select.Item>
									<Select.Item value="Replace">Replace</Select.Item>
									<Select.Item value="Installation">Installation</Select.Item>
									<Select.Item value="Re-Roof">Re-Roof</Select.Item>
								</Select.Content>
							</Select.Root>
						</Label>
					</div>
					<Label class="flex flex-col gap-1">
						<span class="font-semibold text-zinc-700 text-[15px] leading-5">Description</span>
						<Input
							bind:value={addLeadForm.description}
							name="description"
							autocomplete="off"
							class="rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 text-base"
						/>
					</Label>
					<div class="flex flex-col gap-1">
						<span class="font-semibold text-zinc-700 text-[15px] leading-5">Status</span>
						<Select.Root value={addLeadForm.status} on:change={e => addLeadForm.status = e.detail}>
							<Select.Trigger class="rounded border px-3 py-2 w-full text-left bg-white dark:bg-zinc-900 capitalize transition text-base">
								{addLeadForm.status || "Select Status"}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="new">New</Select.Item>
								<Select.Item value="contacted">Contacted</Select.Item>
								<Select.Item value="qualified">Qualified</Select.Item>
								<Select.Item value="lost">Lost</Select.Item>
								<Select.Item value="converted">Converted</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					{#if addLeadError}
						<div class="text-sm text-red-700 rounded bg-red-50 px-3 py-2 border border-red-200">
							{addLeadError}
						</div>
					{/if}
					<Dialog.Footer class="flex flex-col-reverse sm:flex-row gap-2 justify-between pt-4 border-t mt-2">
						<Dialog.Close>
							<Button variant="outline" type="button" class="w-full sm:w-auto">Cancel</Button>
						</Dialog.Close>
						<Button
							type="button"
							variant="default"
							class="w-full sm:w-auto flex gap-2 items-center justify-center"
							disabled={addingLead}
							on:click={() => submitCustomLead()}
						>
							{#if addingLead}
								<svg class="animate-spin size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-opacity=".1"/><path d="M4 12a8 8 0 017-7.94" /></svg>
								Adding...
							{:else}
								<svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
								Add Lead
							{/if}
						</Button>
					</Dialog.Footer>
				</form>
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
