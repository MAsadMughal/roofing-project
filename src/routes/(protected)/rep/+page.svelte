<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import * as Select from '$lib/components/ui/select/index.js';
  import SearchIcon from '@lucide/svelte/icons/search';
  import RepLeadCard from '$lib/components/leads/RepLeadCard.svelte';

  const { data } = $props<{ leads: any[]; q: string; status: string }>();

  type Lead = any;
  type AssignmentStatus = 'assigned' | 'in_contact' | 'inspection_scheduled' | 'closed';

  let leads: Lead[] = $state(Array.isArray(data.leads) ? data.leads : []);
  let searchText = $state(data.q || '');
  let category: 'All' | AssignmentStatus = $state(((data.status as any) || 'All') as 'All' | AssignmentStatus);

  const categoryItems: Array<{ value: 'All' | AssignmentStatus; label: string }> = [
    { value: 'All', label: 'CATEGORY' },
    { value: 'assigned', label: 'ASSIGNED' },
    { value: 'in_contact', label: 'IN CONTACT' },
    { value: 'inspection_scheduled', label: 'INSPECTION SCHEDULED' },
    { value: 'closed', label: 'CLOSED' }
  ];
  const categoryTriggerContent = $derived(
    categoryItems.find((c) => c.value === category)?.label ?? 'CATEGORY'
  );

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

  // Derived filtered list
  const filtered = $derived(
    (leads || [])
      .filter((l) => (category === 'All' ? true : (l.viewer_assignment?.status ?? l.status) === category))
      .filter((l) =>
        searchText
          ? [l.title ?? '', l.description ?? '', `${l.first_name ?? ''} ${l.last_name ?? ''}`, l.email ?? '', l.phone ?? '']
              .join(' ')
              .toLowerCase()
              .includes(searchText.toLowerCase())
          : true
      )
  );

  $effect(() => {
    if (browser) updateUrl();
  });

  // Assign modal state (owner-only available in LeadCard; for reps we just pass no reps)
  function noop() {}
</script>

<svelte:head>
  <title>Sales Rep</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="w-full">
  <h1 class="mb-4 text-3xl font-extrabold tracking-tight">MY LEADS</h1>

  <!-- Toolbar -->
  <div class="relative mb-4 flex flex-wrap items-center gap-3">
    <div class="relative min-w-64 grow">
      <SearchIcon class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="SEARCH LEADS..." bind:value={searchText} class="pl-9" />
    </div>

    <Select.Root type="single" name="category" bind:value={category}>
      <Select.Trigger class="min-w-40">
        {categoryTriggerContent}
      </Select.Trigger>
      <Select.Content>
        <Select.Group>
          {#each categoryItems as c (c.value)}
            <Select.Item value={c.value} label={c.label}>{c.label}</Select.Item>
          {/each}
        </Select.Group>
      </Select.Content>
    </Select.Root>
  </div>

  <!-- Lead List -->
  <section class="space-y-4">
    {#each filtered as lead}
      <RepLeadCard
        {lead}
      />
    {/each}
  </section>
</div>


