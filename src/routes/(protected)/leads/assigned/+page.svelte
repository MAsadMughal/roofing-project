<script lang="ts">
  import LeadCard from '$lib/components/leads/LeadCard.svelte';
  const { data } = $props<{ leads: any[] }>();

  type Lead = any;
  let leads: Lead[] = $state(Array.isArray(data.leads) ? data.leads : []);

  // Assign modal state (reuse owner assign controls via LeadCard props)
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
    } finally {
      assigning = false;
    }
  }

  function toggleWatchlist(_lead: Lead) {}
</script>

<svelte:head>
  <title>Assigned Leads</title>
  <meta name="robots" content="noindex" />
  </svelte:head>

<div class="w-full">
  <h1 class="mb-4 text-3xl font-extrabold tracking-tight">ASSIGNED LEADS</h1>

  <section class="space-y-4">
    {#if leads.length === 0}
      <div class="text-sm text-muted-foreground">No leads assigned by you yet.</div>
    {:else}
      {#each leads as lead}
        <LeadCard
          {lead}
          {reps}
          bind:selectedRepId
          {assigning}
          {assignError}
          watchlistSaving={Boolean((lead as any)._savingWatchlist)}
          onToggleWatchlist={toggleWatchlist}
          onOpenAssign={openAssign}
          onAssign={assignLead}
          role={'OWNER'}
        />
      {/each}
    {/if}
  </section>
</div>


