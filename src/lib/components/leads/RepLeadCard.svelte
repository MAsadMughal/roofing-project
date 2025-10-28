<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import PhoneCall from '@lucide/svelte/icons/phone-call';
	import Info from '@lucide/svelte/icons/info';
	import User2 from '@lucide/svelte/icons/user-2';

	type Lead = any;
	let { lead } = $props<{
		lead: Lead;
	}>();

	// Rep sees and controls their assignment status
	const assignment = $derived((lead as any).viewer_assignment ?? null);
	let nextStatus: 'assigned' | 'in_contact' | 'inspection_scheduled' | 'closed' =
		$state('assigned');
	let savingStatus = $state(false);
	let statusError: string | null = $state(null);
	let statusDialogOpen = $state(false);

	// inspection scheduling state
	let inspectors: Array<{ id: string; name: string; email: string }> = $state([]);
	let selectedInspectorId: string = $state('');
	let inspectionDate: string = $state('');
	let showInspectionDetails = $state(false);

	$effect(() => {
		nextStatus = (assignment?.status ?? 'assigned') as typeof nextStatus;
	});

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

	$effect(() => {
		if (nextStatus === 'inspection_scheduled' && !showInspectionDetails) {
			showInspectionDetails = true;
			ensureInspectorsLoaded();
		} else if (nextStatus !== 'inspection_scheduled') {
			showInspectionDetails = false;
		}
	});

	async function saveStatus() {
		if (!assignment) return;
		savingStatus = true;
		statusError = null;
		try {
			const payload: any = { status: nextStatus };
			if (nextStatus === 'inspection_scheduled') {
				if (!inspectionDate || !selectedInspectorId) {
					statusError = 'Inspection date and inspector are required';
					return;
				}
				payload.inspectionDate = inspectionDate;
				payload.inspectorId = selectedInspectorId; // Send as single item
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
			inspectionDate = '';
			selectedInspectorId = '';
		} finally {
			savingStatus = false;
		}
	}

	function getStatusLabel(status: string) {
		return (status || '').replace('_', ' ').toUpperCase();
	}
</script>

<Card>
	<div class="flex items-center justify-between gap-4 px-4 py-3">
		<div class="flex items-center gap-3">
			<div
				class="text-muted-foreground flex size-10 items-center justify-center rounded-full border bg-secondary/50"
			>
				<User2 class="size-6" />
			</div>
			<div>
				<div class="text-sm font-semibold tracking-wide">
					{(lead.first_name ?? '') + ' ' + (lead.last_name ?? '')}
				</div>
				<div class="text-muted-foreground text-xs">{lead.email}</div>
			</div>
		</div>
	</div>

	<div class="text-muted-foreground px-4 pb-3 text-sm leading-relaxed">
		{lead.description}
	</div>

	<div
		class="flex flex-col gap-3 border-t px-4 py-3 md:flex-row md:items-center md:justify-between"
	>
		<div class="flex items-center gap-2 text-sm">
			<PhoneCall class="text-muted-foreground size-4" />
			<a href={`tel:${lead.phone}`} class="font-semibold">{lead.phone}</a>
		</div>

		<div class="text-muted-foreground flex items-center gap-2 text-sm">
			<Info class="size-4" />
			<span>Source: {lead.source ?? '-'} • {String(lead.created_at ?? '').slice(0, 10)}</span>
		</div>

		<div class="flex items-center gap-3">
			{#if assignment}
				<Button
					variant="outline"
					class="flex h-8 items-center gap-2"
					onclick={() => (statusDialogOpen = true)}
				>
					{getStatusLabel(assignment?.status || '')}
					<ChevronDown class="size-4" />
				</Button>
			{/if}
			<Button variant="outline" class="h-8">Details</Button>
		</div>
	</div>
</Card>

{#if assignment}
	<Dialog.Root bind:open={statusDialogOpen}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Change Lead Status</Dialog.Title>
				<Dialog.Description>Update the status of this lead</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-4">
				<div class="grid gap-2">
					<Label>Status</Label>
					<Select.Root type="single" name="assignmentStatus" bind:value={nextStatus}>
						<Select.Trigger class="w-full">
							{getStatusLabel(nextStatus)}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Status</Select.Label>
								<Select.Item value={'assigned'} label={'Assigned'}>Assigned</Select.Item>
								<Select.Item value={'in_contact'} label={'In Contact'}>In Contact</Select.Item>
								<Select.Item value={'inspection_scheduled'} label={'Inspection Scheduled'}
									>Inspection Scheduled</Select.Item
								>
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
							<div class="mb-2 text-sm font-medium">Select Inspector</div>
							<Select.Root type="single" bind:value={selectedInspectorId}>
								<Select.Trigger class="w-full">
									{inspectors.find(i => i.id === selectedInspectorId)?.name || 'Select an inspector'}
								</Select.Trigger>
								<Select.Content>
									<Select.Group>
										{#each inspectors as ins}
											<Select.Item value={ins.id}>
												{ins.name}
												<span class="text-muted-foreground ml-2 text-xs">{ins.email}</span>
											</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root>
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
