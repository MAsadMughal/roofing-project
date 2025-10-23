<script lang="ts">
    import Badge from '$lib/components/ui/badge/badge.svelte';
    import Button from '$lib/components/ui/button/button.svelte';
    import Card from '$lib/components/ui/card/card.svelte';
    import * as Dialog from '$lib/components/ui/dialog/index.js';
    import Label from '$lib/components/ui/label/label.svelte';
    import * as Select from '$lib/components/ui/select/index.js';
    import Input from '$lib/components/ui/input/input.svelte';
    import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
    import Info from '@lucide/svelte/icons/info';
    import Loader2 from '@lucide/svelte/icons/loader-2';
    import PhoneCall from '@lucide/svelte/icons/phone-call';
    import User2 from '@lucide/svelte/icons/user-2';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

    type Lead = any;
    let {
        lead,
        reps = [],
        selectedRepId = $bindable<string | undefined>(),
        onToggleWatchlist,
        onOpenAssign,
        assigning = false,
        assignError = null,
        onAssign,
        watchlistSaving = false,
        role = 'OWNER',
    } = $props<{
        lead: Lead;
        reps?: Array<{ id: string; name: string; email: string }>;
        selectedRepId?: string | undefined;
        onToggleWatchlist: (lead: Lead) => void;
        onOpenAssign: (leadId: bigint) => void;
        assigning?: boolean;
        assignError?: string | null;
        onAssign: () => void;
        watchlistSaving?: boolean;
        role?: String;
    }>();

	// Status change UI for reps: derive the viewer's assignment if present on the lead
	const assignment = $derived((lead as any).viewer_assignment ?? null);
	let nextStatus: 'assigned' | 'in_contact' | 'inspection_scheduled' | 'closed' = $state('assigned');
	$effect(() => {
		nextStatus = (assignment?.status ?? 'assigned') as typeof nextStatus;
	});
	let savingStatus = $state(false);
	let statusError: string | null = $state(null);
    let statusDialogOpen = $state(false);

    // Inspection scheduling state
    let inspectors: Array<{ id: string; name: string; email: string }> = $state([]);
    let selectedInspectorIds: string[] = $state([]);
    let inspectionDate: string = $state(''); // ISO string from input[type=datetime-local]
    let showInspectionDetails = $state(false);

    async function ensureInspectorsLoaded() {
        if (inspectors.length > 0) return;
        const res = await fetch('/api/inspectors');
        const users = await res.json().catch(() => []);
        inspectors = (users || []).map((u: any) => ({
            id: String(u.id),
            name: (u.firstName || '') + ' ' + (u.lastName || ''),
            email: u.email
        }));
    }

    async function saveStatus() {
		if (!assignment) return;
		savingStatus = true;
		statusError = null;
		try {
            const payload: any = { status: nextStatus };
            if (nextStatus === 'inspection_scheduled') {
                if (!inspectionDate || selectedInspectorIds.length === 0) {
                    statusError = 'Inspection date and at least one inspector are required';
                    return;
                }
                payload.inspectionDate = inspectionDate;
                payload.laborIds = selectedInspectorIds;
            }

            const res = await fetch(`/api/leads/${lead.id}/assignment`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload)
			});
			const out = await res.json().catch(() => ({}));
			if (!res.ok) {
				statusError = out.error || 'Failed to update status';
				return;
			}
			(lead as any).viewer_assignment = out.assignment;
			(lead as any).status = out.assignment?.status || (lead as any).status;
            statusDialogOpen = false;
            showInspectionDetails = false;
            // Reset inspection details after successful save
            inspectionDate = '';
            selectedInspectorIds = [];
		} finally {
			savingStatus = false;
		}
	}

    $effect(() => {
        if (nextStatus === 'inspection_scheduled' && !showInspectionDetails) {
            showInspectionDetails = true;
            ensureInspectorsLoaded();
        } else if (nextStatus !== 'inspection_scheduled') {
            showInspectionDetails = false;
        }
    });
</script>

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
				>HIGH</Badge
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
			{#if role === 'OWNER'}
				<Button
					variant="outline"
					class="h-8"
					disabled={watchlistSaving}
					onclick={() => onToggleWatchlist(lead)}
				>
					{#if watchlistSaving}
						<Loader2 class="mr-2 size-4 animate-spin" />
					{/if}
					{lead.watchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
				</Button>
			
                {#if !lead.assigned}
                <Dialog.Root>
                    <Dialog.Trigger>
                        <Button variant="outline" class="h-8" onclick={() => onOpenAssign(lead.id)}
                            >Assign</Button
                        >
                    </Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Assign Lead</Dialog.Title>
							<Dialog.Description>
								Select a sales representative to assign this lead to.
							</Dialog.Description>
						</Dialog.Header>

						<div class="mb-4 rounded-lg border p-4">
							<div class="mb-2">
								<span class="font-semibold">{(lead.first_name ?? '') + ' ' + (lead.last_name ?? '')}</span>
								<span class="ml-2 text-sm text-muted-foreground">{lead.email}</span>
							</div>
							<div class="text-sm text-muted-foreground">
								<div>Phone: {lead.phone}</div>
								<div>Source: {lead.source ?? '-'}</div>
								<div>Created: {String(lead.created_at ?? '').slice(0, 10)}</div>
								<div>Status: {(lead.status ?? '').toUpperCase()}</div>
							</div>
						</div>

						<Label class="text-sm font-medium">Sales Representative</Label>
						<Select.Root type="single" name="salesRep"  bind:value={selectedRepId}>
							<Select.Trigger class="w-full">
						{#if selectedRepId}
									{reps.find((r: any) => r.id === selectedRepId)?.name ?? 'Select Sales Representative'}
								{:else}
									Select Sales Representative
								{/if}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label>Sales Reps</Select.Label>
									{#each reps as rep (rep.id)}
										<Select.Item value={rep.id} label={rep.name}>
											{rep.name}
										</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
						{#if assignError}
							<p class="mt-2 text-sm text-red-600">{assignError}</p>
						{/if}
						<Dialog.Footer>
							<Dialog.Close>
								<Button variant="outline" class="h-8">Cancel</Button>
							</Dialog.Close>
							<Button class="h-8" disabled={assigning || !selectedRepId} onclick={onAssign}>
								{assigning ? 'Assigning...' : 'Assign'}
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
                </Dialog.Root>
                {:else}
                    <Badge class="border bg-muted px-2 py-1 text-[10px]">ASSIGNED{#if lead.assigned_to} • {(lead.assigned_to.first_name ?? '') + ' ' + (lead.assigned_to.last_name ?? '')}{/if}</Badge>
                {/if}
			{/if}

			{#if assignment}
	<Button variant="outline" class="h-8 flex items-center gap-2" onclick={() => statusDialogOpen = true}>
		{(assignment?.status || '').replace('_', ' ').toUpperCase()}
		<ChevronDown class="size-4" />
	</Button>
	
			{/if}
			<Button variant="outline" class="h-8">Details</Button>
		</div>
	</div>
</Card>

<!-- Status Change Dialog -->
{#if assignment}
	<Dialog.Root bind:open={statusDialogOpen}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Change Lead Status</Dialog.Title>
				<Dialog.Description>
					Update the status of this lead
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-4">
				<div class="grid gap-2">
					<Label>Status</Label>
					<Select.Root type="single" name="assignmentStatus" bind:value={nextStatus}>
						<Select.Trigger class="w-full">
							{(nextStatus || '').replace('_', ' ').toUpperCase()}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Status</Select.Label>
								<Select.Item value={'assigned'} label={'Assigned'}>Assigned</Select.Item>
								<Select.Item value={'in_contact'} label={'In Contact'}>In Contact</Select.Item>
								<Select.Item value={'inspection_scheduled'} label={'Inspection Scheduled'}>Inspection Scheduled</Select.Item>
								<Select.Item value={'closed'} label={'Closed'}>Closed</Select.Item>
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>

                {#if showInspectionDetails}
                    <div class="space-y-4 border-t pt-4">
                        <div class="grid gap-2">
                            <Label for="inspectionDate">Inspection Date</Label>
                            <Input id="inspectionDate" type="datetime-local" bind:value={inspectionDate} />
                        </div>
                        <div>
                            <div class="mb-2 text-sm font-medium">Inspectors</div>
                            <div class="max-h-56 space-y-2 overflow-auto rounded border p-2">
                                {#if inspectors.length === 0}
                                    <div class="text-xs text-muted-foreground">No inspectors available.</div>
                                {:else}
                                    {#each inspectors as ins (ins.id)}
                                        <Label class="flex items-center gap-2 text-sm">
                                            <Checkbox checked={selectedInspectorIds.includes(ins.id)} onchange={(e: any) => {
                                                const checked = e.detail;
                                                selectedInspectorIds = checked
                                                    ? Array.from(new Set([...selectedInspectorIds, ins.id]))
                                                    : selectedInspectorIds.filter((id) => id !== ins.id);
                                            }} />
                                            <span>{ins.name}</span>
                                            <span class="ml-2 text-xs text-muted-foreground">{ins.email}</span>
                                        </Label>
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}

				{#if statusError}
					<p class="text-sm text-red-600">{statusError}</p>
				{/if}
			</div>

			<Dialog.Footer>
				<Dialog.Close>
					<Button variant="outline" class="h-8">Cancel</Button>
				</Dialog.Close>
				<Button class="h-8" disabled={savingStatus} onclick={saveStatus}>
					{savingStatus ? 'Saving...' : 'Save'}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}