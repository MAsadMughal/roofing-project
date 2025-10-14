<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Info from '@lucide/svelte/icons/info';
	import PhoneCall from '@lucide/svelte/icons/phone-call';
	import SearchIcon from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import User2 from '@lucide/svelte/icons/user-2';
	import X from '@lucide/svelte/icons/x';
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
	let leads: Lead[] = data.leads;

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

	const categoryItems: Array<{ value: 'All' | Status; label: string }> = [
		{ value: 'All', label: 'CATEGORY' },
		{ value: 'new', label: 'NEW' },
		{ value: 'contacted', label: 'CONTACTED' },
		{ value: 'qualified', label: 'QUALIFIED' },
		{ value: 'lost', label: 'LOST' },
		{ value: 'converted', label: 'CONVERTED' }
	];
	const categoryTriggerContent = $derived(
		categoryItems.find((c) => c.value === category)?.label ?? 'CATEGORY'
	);

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

	function toggleWatchlist(lead: Lead) {
		lead.watchlisted = !lead.watchlisted;
	}

	// Derived filtered list
	const filtered = $derived(
		leads
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

	$effect(() => { if (browser) updateUrl(); });
</script>

<svelte:head>
	<title>Leads</title>
</svelte:head>

<div class="w-full">
	<h1 class="mb-4 text-3xl font-extrabold tracking-tight">LEADS</h1>

	<!-- Toolbar -->
	<div class="mb-4 flex flex-wrap items-center gap-3 relative">
		<div class="relative min-w-64 grow">
			<SearchIcon class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input placeholder="SEARCH LEADS..." bind:value={searchText} class="pl-9" />
		</div>
		<Select.Root type="single"  name="sort" bind:value={sortBy}>
			<Select.Trigger class="min-w-40">
				{sortTriggerContent}
			</Select.Trigger>
			<Select.Content class="min-w-40 absolute top-10">
				<Select.Group>
					<Select.Label>Sort</Select.Label>
					{#each sortOptions as opt}
						<Select.Item value={opt}>{opt}</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>

		<Select.Root type="single" name="category" bind:value={category}>
			<Select.Trigger class="min-w-40">
				{categoryTriggerContent}
			</Select.Trigger>
			<Select.Content class="min-w-40 absolute top-10">
				<Select.Group>
					<Select.Label>Category</Select.Label>
					{#each categoryItems as c (c.value)}
						<Select.Item value={c.value} label={c.label}>{c.label}</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>

		<Button variant="outline" class="ml-auto h-10">GO TO WATCHLIST</Button>
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
				<Card>
					<div class="flex items-center justify-between gap-4 px-4 py-3">
						<div class="flex items-center gap-3">
							<div
								class="flex size-10 items-center justify-center rounded-full border bg-secondary/50 text-muted-foreground"
							>
								<User2 class="size-6" />
							</div>
							<div>
								<div class="text-sm font-semibold tracking-wide">
									{(lead.first_name ?? '') + ' ' + (lead.last_name ?? '')}
								</div>
								<div class="text-xs text-muted-foreground">{lead.email}</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<Badge class="border bg-muted px-2 py-1 text-[10px]"
								>{(lead.status ?? '').toUpperCase()}</Badge
							>
						</div>
					</div>

					<div class="px-4 pb-3 text-sm leading-relaxed text-muted-foreground">
						{lead.description}
					</div>

					<div
						class="flex flex-col gap-3 border-t px-4 py-3 md:flex-row md:items-center md:justify-between"
					>
						<div class="flex items-center gap-2 text-sm">
							<PhoneCall class="size-4 text-muted-foreground" />
							<a href={`tel:${lead.phone}`} class="font-semibold">{lead.phone}</a>
						</div>

						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Info class="size-4" />
							<span
								>Source: {lead.source ?? '-'} • {String(lead.created_at ?? '').slice(0, 10)}</span
							>
						</div>

						<div class="flex items-center gap-3">
					{#if lead.watchlisted}
						<Button variant="outline" class="h-8" onclick={() => toggleWatchlist(lead)}>
									<X class="size-4" />
									Remove from Watchlist
								</Button>
							{:else}
						<Button variant="outline" class="h-8" onclick={() => toggleWatchlist(lead)}>
									+ Add to Watchlist
								</Button>
							{/if}
							<Button variant="outline" class="h-8">Details</Button>
						</div>
					</div>
				</Card>
			{/each}
		</section>
	</div>
</div>
