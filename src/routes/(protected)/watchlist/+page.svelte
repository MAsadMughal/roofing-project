<script lang="ts">
  import OwnerLeadCard from '$lib/components/leads/OwnerLeadCard.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	const { data } = $props<{ leads: any[] }>();

	type Lead = any;
	let leads: Lead[] = $state(Array.isArray(data.leads) ? data.leads : []);

	// Add assign functionality similar to leads page
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
			if (out?.lead) {
				const updated = out.lead;
				leads = (leads || []).map((l) => (l.id === selectedLeadId ? { ...l, ...updated } : l));
			}
			selectedLeadId = null;
		} finally {
			assigning = false;
		}
	}
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
</script>

<svelte:head>
	<title>Watchlist</title>
</svelte:head>

<div class="w-full">
	<h1 class="mb-4 text-3xl font-extrabold tracking-tight">WATCHLIST</h1>

	<section class="space-y-4">
		{#if leads.length === 0}
			<Card class="p-4 text-sm text-muted-foreground">Your watchlist is empty.</Card>
		{:else}
			{#each leads as lead}
            <OwnerLeadCard
					{lead}
					{reps}
					bind:selectedRepId
					{assigning}
					{assignError}
					watchlistSaving={Boolean((lead as any)._savingWatchlist)}
					onToggleWatchlist={toggleWatchlist}
					onOpenAssign={openAssign}
					onAssign={assignLead}
				/>
			{/each}
		{/if}
	</section>
</div>
