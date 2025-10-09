<script lang="ts">
    import Button from '$lib/components/ui/button/button.svelte';
    import Input from '$lib/components/ui/input/input.svelte';
    import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
    import Label from '$lib/components/ui/label/label.svelte';
    import Card from '$lib/components/ui/card/card.svelte';
    import Separator from '$lib/components/ui/separator/separator.svelte';
    import Badge from '$lib/components/ui/badge/badge.svelte';
    import Select from '$lib/components/ui/select/select.svelte';
    import SearchIcon from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import PhoneCall from '@lucide/svelte/icons/phone-call';
	import Info from '@lucide/svelte/icons/info';
	import X from '@lucide/svelte/icons/x';
	import User2 from '@lucide/svelte/icons/user-2';

	type Status = 'Assigned' | 'Contacted' | 'Active' | 'New';
	type WorkType = 'Repair' | 'Replace' | 'Installation' | 'Re-Roof';
	type SourceType =
		| 'Google Forms'
		| 'Website'
		| 'Social Media'
		| 'Outreach'
		| 'Cold Calling'
		| 'Email Marketing';

	type Lead = {
		id: string;
		name: string;
		address: string;
		description: string;
		phone: string;
		source: SourceType;
		sourceNote: string; // includes date text
		status: Status;
		workTypes: WorkType[];
		isNew?: boolean;
		watchlisted?: boolean;
		createdAt: string; // ISO
	};

	const leads: Lead[] = [
		{
			id: '1',
			name: 'FERNANDO JAMES',
			address: 'St. 1, A.B.C. X.Y.Z.',
			description:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc maximus, nulla ut commodo sagittis, sapien dui mattis dui, non pulvinar lorem felis nec erat Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc maximus, nulla ut commodo sagittis, sapien dui mattis dui, non pulvinar lorem felis nec erat.',
			phone: '+9234587323',
			source: 'Outreach',
			sourceNote: 'Via Outreach (Oct 1, 2025)',
			status: 'New',
			workTypes: ['Repair'],
			isNew: true,
			watchlisted: false,
			createdAt: '2025-10-01T10:00:00Z'
		},
		{
			id: '2',
			name: 'FERNANDO JAMES',
			address: 'St. 1, A.B.C. X.Y.Z.',
			description:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc maximus, nulla ut commodo sagittis, sapien dui mattis dui, non pulvinar lorem felis nec erat, dui, non pulvinar lorem felis nec erat.',
			phone: '+9234587323',
			source: 'Google Forms',
			sourceNote: 'Via Google Forms (Sep 30, 2025)',
			status: 'Contacted',
			workTypes: ['Replace', 'Installation'],
			isNew: false,
			watchlisted: true,
			createdAt: '2025-09-30T09:00:00Z'
		},
		{
			id: '3',
			name: 'FERNANDO JAMES',
			address: 'St. 1, A.B.C. X.Y.Z.',
			description:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc maximus, nulla ut commodo sagittis, sapien dui mattis dui, non pulvinar lorem felis nec erat.',
			phone: '+9234587323',
			source: 'Website',
			sourceNote: 'Via Website (Sep 30, 2025)',
			status: 'Assigned',
			workTypes: ['Re-Roof'],
			isNew: true,
			watchlisted: false,
			createdAt: '2025-09-30T08:00:00Z'
		}
	];

	// Toolbar state
	let searchText = '';
	let sortBy: 'Newest' | 'Oldest' | 'Name' | 'Source' = 'Newest';
	let category: 'All' | Status = 'All';

	// Sidebar filter state
	let watchlistOnly = false;
	let statusFilters: Record<Status, boolean> = {
		Assigned: true,
		Contacted: true,
		Active: true,
		New: true
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

	// Collapsible sections
	let openStatus = true;
	let openWorkType = true;
	let openSource = true;

	function toggleWatchlist(lead: Lead) {
		lead.watchlisted = !lead.watchlisted;
	}

	// Derived filtered list
	$: filtered = leads
		.filter((l) => (watchlistOnly ? l.watchlisted : true))
		.filter((l) => (category === 'All' ? true : l.status === category))
		.filter((l) => statusFilters[l.status])
		.filter((l) => l.workTypes.some((wt) => workTypeFilters[wt]))
		.filter((l) => sourceFilters[l.source])
		.filter((l) =>
			searchText
				? [l.name, l.address, l.description, l.source, l.sourceNote]
						.join(' ')
						.toLowerCase()
						.includes(searchText.toLowerCase())
				: true
		)
		.toSorted((a, b) => {
			if (sortBy === 'Newest') return b.createdAt.localeCompare(a.createdAt);
			if (sortBy === 'Oldest') return a.createdAt.localeCompare(b.createdAt);
			if (sortBy === 'Name') return a.name.localeCompare(b.name);
			return a.source.localeCompare(b.source);
		});
</script>

<svelte:head>
	<title>Leads</title>
</svelte:head>

<div class="w-full">
	<h1 class="text-3xl font-extrabold tracking-tight mb-4">LEADS</h1>

	<!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
        <div class="relative grow min-w-64">
            <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="SEARCH LEADS..." bind:value={searchText} class="pl-9" />
        </div>
		<Button variant="outline" class="h-10">
			<SlidersHorizontal class="size-4" />
			Sort
		</Button>
        <Select bind:value={sortBy} items={[{value:'Newest'},{value:'Oldest'},{value:'Name'},{value:'Source'}]} />

        <Select bind:value={category} class="ml-auto" items={[{value:'All',label:'CATEGORY'},{value:'Assigned'},{value:'Contacted'},{value:'Active'},{value:'New'}]} />

		<Button variant="outline" class="ml-auto h-10">GO TO WATCHLIST</Button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-4">
		<!-- Sidebar Filters -->
        <Card class="p-3 md:p-4">
			<div class="text-lg font-extrabold mb-2">FILTERS</div>

            <Label class="flex items-center gap-2 text-sm font-semibold mb-3">
                <Checkbox bind:checked={watchlistOnly} />
                WATCH LIST
            </Label>

			<!-- Status -->
            <button class="flex w-full items-center justify-between py-2 font-semibold" on:click={() => (openStatus = !openStatus)}>
				<span class="text-sm">STATUS</span>
				<ChevronDown class={`size-4 transition-transform ${openStatus ? 'rotate-180' : ''}`} />
			</button>
			{#if openStatus}
				<div class="space-y-2 pl-2">
					{#each Object.keys(statusFilters) as s}
                        <Label class="flex items-center gap-2 text-sm">
                            <Checkbox bind:checked={statusFilters[s as Status]} />
                            {s}
                        </Label>
					{/each}
				</div>
			{/if}

			<!-- Work Type -->
            <button class="mt-3 flex w-full items-center justify-between py-2 font-semibold" on:click={() => (openWorkType = !openWorkType)}>
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
            <button class="mt-3 flex w-full items-center justify-between py-2 font-semibold" on:click={() => (openSource = !openSource)}>
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
							<div class="size-10 rounded-full border flex items-center justify-center text-muted-foreground bg-secondary/50">
								<User2 class="size-6" />
							</div>
							<div>
								<div class="text-sm font-semibold tracking-wide">{lead.name}</div>
								<div class="text-xs text-muted-foreground">{lead.address}</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
                            {#if lead.isNew}
                                <Badge class="text-[10px] px-2 py-1 border bg-accent">NEW</Badge>
                            {:else}
                                <Badge class="text-[10px] px-2 py-1 border bg-muted">{lead.status}</Badge>
                            {/if}
						</div>
					</div>

					<div class="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">
						{lead.description}
					</div>

                    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t px-4 py-3">
						<div class="flex items-center gap-2 text-sm">
							<PhoneCall class="size-4 text-muted-foreground" />
							<a href={`tel:${lead.phone}`} class="font-semibold">{lead.phone}</a>
						</div>

						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Info class="size-4" />
							<span>{lead.sourceNote}</span>
						</div>

						<div class="flex items-center gap-3">
							{#if lead.watchlisted}
								<Button variant="outline" class="h-8" on:click={() => toggleWatchlist(lead)}>
									<X class="size-4" />
									Remove from Watchlist
								</Button>
							{:else}
								<Button variant="outline" class="h-8" on:click={() => toggleWatchlist(lead)}>
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

