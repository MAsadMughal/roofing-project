<script lang="ts">
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import Info from '@lucide/svelte/icons/info';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import PhoneCall from '@lucide/svelte/icons/phone-call';
	import User2 from '@lucide/svelte/icons/user-2';
	import Clock from '@lucide/svelte/icons/clock';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';

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
		history
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
		history?: any;
	}>();

	let historyDialogOpen = $state(false);

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<Card class="transition-shadow duration-200 hover:shadow-lg">
	<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
		<div class="flex items-center gap-4">
			<div class="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
				<User2 class="size-6" />
			</div>
			<div>
				<div class="text-lg font-bold tracking-tight">
					{(lead.first_name ?? '') + ' ' + (lead.last_name ?? '')}
				</div>
				<div class="text-muted-foreground">{lead.email}</div>
			</div>
		</div>
		<Badge
			class="bg-primary/20 px-3 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase"
		>
			HIGH PRIORITY
		</Badge>
	</div>

	<div class="text-muted-foreground px-6 py-4 leading-relaxed">
		{lead.description}
	</div>

	<div
		class="bg-muted/10 space-y-4 border-t px-6 py-4 md:flex md:items-center md:justify-between md:space-y-0"
	>
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-2">
				<PhoneCall class="size-5 text-primary" />
				<a href={`tel:${lead.phone}`} class="font-medium transition-colors hover:text-primary">
					{lead.phone}
				</a>
			</div>
			<div class="text-muted-foreground flex items-center gap-2">
				<Info class="size-5" />
				<span>Source: <span class="font-medium">{lead.source ?? '-'}</span></span>
				<span class="text-muted-foreground/60">•</span>
				<span>{String(lead.created_at ?? '').slice(0, 10)}</span>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<Button
				variant="outline"
				class="h-9 min-w-[160px] transition-all"
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
						<Button variant="default" class="h-9" onclick={() => onOpenAssign(lead.id)}>
							Assign Lead
						</Button>
					</Dialog.Trigger>
					<Dialog.Content class="sm:max-w-[500px]">
						<Dialog.Header>
							<Dialog.Title class="text-2xl font-bold">Assign Lead</Dialog.Title>
							<Dialog.Description class="text-muted-foreground">
								Select a sales representative to assign this lead to.
							</Dialog.Description>
						</Dialog.Header>

						<div class="bg-muted/30 my-6 space-y-2 rounded-lg border p-4">
							<div>
								<span class="text-lg font-semibold">
									{(lead.first_name ?? '') + ' ' + (lead.last_name ?? '')}
								</span>
								<span class="text-muted-foreground ml-2">{lead.email}</span>
							</div>
							<div class="text-muted-foreground grid grid-cols-2 gap-2 text-sm">
								<div>Phone: <span class="font-medium">{lead.phone}</span></div>
								<div>Source: <span class="font-medium">{lead.source ?? '-'}</span></div>
								<div>
									Created: <span class="font-medium"
										>{String(lead.created_at ?? '').slice(0, 10)}</span
									>
								</div>
								<div>
									Status: <span class="font-medium">{(lead.status ?? '').toUpperCase()}</span>
								</div>
							</div>
						</div>

						<div class="space-y-2">
							<Label class="text-sm font-medium">Select Sales Representative</Label>
							<Select.Root type="single" name="salesRep" bind:value={selectedRepId}>
								<Select.Trigger class="w-full">
									{#if selectedRepId}
										{reps.find((r: any) => r.id === selectedRepId)?.name ??
											'Select Sales Representative'}
									{:else}
										Select Sales Representative
									{/if}
								</Select.Trigger>
								<Select.Content>
									<Select.Group>
										<Select.Label>Available Representatives</Select.Label>
										{#each reps as rep (rep.id)}
											<Select.Item value={rep.id} label={rep.name}>
												{rep.name}
											</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root>
						</div>

						{#if assignError}
							<p class="text-destructive bg-destructive/10 mt-3 rounded p-2 text-sm">
								{assignError}
							</p>
						{/if}

						<Dialog.Footer class="mt-6">
							<Dialog.Close>
								<Button variant="outline">Cancel</Button>
							</Dialog.Close>
							<Button disabled={assigning || !selectedRepId} onclick={onAssign}>
								{#if assigning}
									<Loader2 class="mr-2 size-4 animate-spin" />
									Assigning...
								{:else}
									Assign Lead
								{/if}
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			{:else}
				<Badge
					class="cursor-pointer bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/30"
					onclick={() => (historyDialogOpen = true)}
				>
					ASSIGNED TO {#if lead.assigned_to}
						{(lead.assigned_to.first_name ?? '') + ' ' + (lead.assigned_to.last_name ?? '')}
					{/if}
				</Badge>

				<Dialog.Root bind:open={historyDialogOpen}>
					<Dialog.Content class="max-w-3xl">
						<Dialog.Header>
							<Dialog.Title class="text-2xl font-bold">Lead Timeline</Dialog.Title>
							<Dialog.Description class="text-muted-foreground">
								Complete history of events and status changes for this lead
							</Dialog.Description>
						</Dialog.Header>

						<div class="my-6 max-h-[45vh] overflow-y-auto">
							<div class="space-y-4">
								{#each history ? [...history].reverse() : [] as event}
									<div class="hover:bg-muted/20 flex gap-4 rounded-lg border p-4 transition-colors">
										<div class="flex flex-row justify-between w-full gap-x-3">
											<div class="flex flex-col items-start gap-y-2">
												<div class="flex flex-row items-start gap-x-3">
													<div>
														{#if event.type === 'salesRepAssigned'}
															<User2 class="size-6 text-blue-500" />
														{:else if event.type === 'inspectionScheduled'}
															<CalendarDays class="size-6 text-purple-500" />
														{:else if event.type === 'inContact'}
															<PhoneCall class="size-6 text-green-500" />
														{:else if event.type === 'closed'}
															<Info class="size-6 text-red-500" />
														{:else}
															<Clock class="size-6 text-gray-500" />
														{/if}
													</div>
													<div class="h-4">
														<Badge
															class={`whitespace-nowrap ${
																event.type === 'salesRepAssigned'
																	? 'bg-blue-100 text-blue-800'
																	: event.type === 'inContact'
																		? 'bg-green-100 text-green-800'
																		: event.type === 'inspectionScheduled'
																			? 'bg-purple-100 text-purple-800'
																			: 'bg-red-100 text-red-800'
															} px-3 py-1 text-xs font-semibold tracking-wide`}
														>
															{event.type.replace(/([A-Z])/g, ' $1').toUpperCase()}
														</Badge>
													</div>
												</div>
												<span class="text-base font-medium">
													{#if event.type === 'salesRepAssigned'}
														Lead assigned to {event.assignee?.name}
													{:else if event.type === 'inContact'}
														Initial contact made with lead
													{:else if event.type === 'inspectionScheduled'}
														Property inspection scheduled
													{:else if event.type === 'closed'}
														Lead closed
													{/if}
												</span>
											</div>

											<div class="flex flex-col items-start gap-y-4 sm:items-end">
												<time class="text-xs font-medium text-nowrap text-foreground">
													{formatDate(event.at)}
												</time>
												<div class="text-muted-foreground text-xs text-nowrap">
													Updated by <a
														href="/user/profile/{event.assignor?.id}"
														class="font-medium transition-colors text-primary"
														>{event.assignor?.name}</a
													>
												</div>
											</div>

											{#if event.type === 'inspectionScheduled' && event.date}
												<div class="bg-muted/30 mt-4 rounded-lg p-4 text-sm">
													<div class="mb-3 text-lg font-semibold">Inspection Details</div>
													<div class="flex items-center gap-3 text-base">
														<CalendarDays class="size-5 text-primary" />
														<span
															>Scheduled for <span class="font-medium"
																>{formatDate(event.date)}</span
															></span
														>
													</div>
													{#if event.inspectors?.length}
														<div class="mt-3">
															<div class="mb-2 font-medium">Assigned Inspectors:</div>
															<ul class="list-inside list-disc space-y-1">
																{#each event.inspectors as inspector}
																	<li>{inspector.name}</li>
																{/each}
															</ul>
														</div>
													{/if}
												</div>
											{/if}
										</div>
									</div>
								{/each}

								{#if !history?.length}
									<div class="text-muted-foreground py-12 text-center text-lg">
										No history available for this lead
									</div>
								{/if}
							</div>
						</div>

						<Dialog.Footer>
							<Dialog.Close>
								<Button variant="outline">Close Timeline</Button>
							</Dialog.Close>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			{/if}

			<Button variant="default" class="h-9">View Details</Button>
		</div>
	</div>
</Card>
