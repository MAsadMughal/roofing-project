<script lang="ts">
	import Card from '$lib/components/ui/card/card.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import Clock from '@lucide/svelte/icons/clock';
	import File from '@lucide/svelte/icons/file';
	import PhoneCall from '@lucide/svelte/icons/phone-call';
	import User2 from '@lucide/svelte/icons/user-2';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Mail from '@lucide/svelte/icons/mail';
	import Calculator from '@lucide/svelte/icons/calculator';
	import Send from '@lucide/svelte/icons/send';
	import Info from '@lucide/svelte/icons/info';
	import Award from '@lucide/svelte/icons/award';
	import MoreVertical from '@lucide/svelte/icons/more-vertical';

	const { data } = $props();

	function getStatusColor(status: string) {
		const colors: Record<string, string> = {
			assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
			in_contact: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
			inspection_scheduled:
				'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
			docs_uploaded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
			estimate_sent: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
			proposal_sent: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
			job_created: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
			closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
		};
		return colors[status] || colors.assigned;
	}

	function formatDate(dateStr: string | Date | null) {
		if (!dateStr) return 'Not set';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatTime(dateStr: string | Date | null) {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	let selectedAssignment: any = null;
	let showTimeline = $state(false);

	// Dummy url helpers
	function getUserUrl(user) {
		return user && user.id ? `/user/profile/${user.id}` : '#';
	}
	function getEstimatorUrl(estimator) {
		return estimator && estimator.id ? `/user/profile/${estimator.id}` : '#';
	}

	// Statuses in order for "ahead of" logic
	const statusOrder = [
		'assigned',
		'in_contact',
		'inspection_scheduled',
		'docs_uploaded',
		'estimate_saved',
		'estimate_sent',
		'proposal_sent',
		'job_created',
	];

	function isStatusOrAfter(current: string, target: string) {
		const iCur = statusOrder.indexOf((current || '').toLowerCase());
		const iTarget = statusOrder.indexOf((target || '').toLowerCase());
		return iCur !== -1 && iTarget !== -1 && iCur >= iTarget;
	}
</script>

<svelte:head>
	<title>All Assignments | Roofing Software</title>
</svelte:head>

<div class="flex flex-col gap-6 px-4 py-8">
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">All Assignments</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">
				Track all your team assignments and their progress
			</p>
		</div>
	</div>

	{#if data.assignments.length === 0}
		<Card class="bg-white shadow-lg dark:bg-gray-800">
			<div class="p-12 text-center">
				<User2 class="mx-auto mb-4 size-16 text-gray-400" />
				<p class="text-lg font-medium text-gray-600 dark:text-gray-400">No assignments found</p>
				<p class="mt-2 text-sm text-gray-500">
					Start by creating leads and assigning them to your team
				</p>
			</div>
		</Card>
	{:else}
		<div class="space-y-4">
			{#each data.assignments as assignment}
				<Card class="bg-white shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800">
					<div class="p-6">
						<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
							<!-- Left: Main Info -->
							<div class="flex-1">
								<div class="flex items-start gap-4">
									<div
										class="flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30"
									>
										<User2 class="size-6 text-indigo-600 dark:text-indigo-400" />
									</div>
									<div class="min-w-0 flex-1">
										<h3 class="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
											{assignment.leadTitle}
										</h3>
										<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
											{assignment.customer?.name || 'No customer'}
										</p>
										<div class="mt-3 flex flex-wrap items-center gap-4">
											<div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
												<User2 class="size-4" />
												<span class="font-medium">Assigned to:</span>
												<a
													href={getUserUrl(assignment.assignedTo)}
													target="_blank"
													class="hover:text-indigo-600 hover:underline"
												>
													{assignment.assignedTo.name}
												</a>
											</div>
											{#if assignment.estimator}
												<div
													class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
												>
													<Calculator class="size-4" />
													<span class="font-medium">Estimator:</span>
													<a
														href={getEstimatorUrl(assignment.estimator)}
														target="_blank"
														class="hover:text-indigo-600 hover:underline"
													>
														{assignment.estimator.name}
													</a>
												</div>
											{/if}
											{#if assignment.inspectionDate}
												<div
													class="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400"
												>
													<Calendar class="size-4" />
													<span class="font-medium">Inspection:</span>
													<span>{formatTime(assignment.inspectionDate)}</span>
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>
							<!-- Right: Status & Actions -->
							<div class="relative flex flex-col items-end gap-3">
								<Badge class={getStatusColor(assignment.status)}>
									{assignment.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
								</Badge>
								<div class="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onclick={() => {
											selectedAssignment = assignment;
											showTimeline = true;
										}}
									>
										<Clock class="mr-2 size-4" />
										Timeline
									</Button>
									<!-- Status-based menu instead of get functions -->
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											<Button variant="ghost" size="icon" aria-label="More actions">
												<MoreVertical class="size-5" />
											</Button>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content
											align="end"
											class="z-50 min-w-48 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
											style="background-color: white;"
										>
											{#if isStatusOrAfter(assignment.status, 'docs_uploaded')}
												<DropdownMenu.Item>
													<a
														href={assignment.docs?.[0]?.url || '#'}
														target="_blank"
														rel="noopener noreferrer"
														class="flex items-center w-full"
														tabindex="-1"
													>
														<File class="mr-2 size-4" /> View Docs
													</a>
												</DropdownMenu.Item>
											{/if}
											{#if isStatusOrAfter(assignment.status, 'estimate_saved')}
												<DropdownMenu.Item>
													<a
														href={assignment.estimates?.[0]?.url || '#'}
														target="_blank"
														rel="noopener noreferrer"
														class="flex items-center w-full"
														tabindex="-1"
													>
														<Calculator class="mr-2 size-4" /> View Estimates
													</a>
												</DropdownMenu.Item>
											{/if}
											{#if isStatusOrAfter(assignment.status, 'proposal_sent')}
												<DropdownMenu.Item>
													<a
														href={assignment.proposal?.url || '#'}
														target="_blank"
														rel="noopener noreferrer"
														class="flex items-center w-full"
														tabindex="-1"
													>
														<Send class="mr-2 size-4" /> View Proposal
													</a>
												</DropdownMenu.Item>
											{/if}
											{#if !isStatusOrAfter(assignment.status, 'docs_uploaded') && !isStatusOrAfter(assignment.status, 'estimate_saved') && !isStatusOrAfter(assignment.status, 'proposal_sent')}
												<DropdownMenu.Item disabled>
													<Info class="mr-2 size-4" /> No options available
												</DropdownMenu.Item>
											{/if}
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</div>
							</div>
						</div>
						<!-- Metadata Footer -->
						<div
							class="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-200 pt-4 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400"
						>
							<span>Created: {formatDate(assignment.createdAt)}</span>
							{#if assignment.updatedAt && new Date(assignment.updatedAt).getTime() !== new Date(assignment.createdAt).getTime()}
								<span>•</span>
								<span>Updated: {formatDate(assignment.updatedAt)}</span>
							{/if}
							{#if assignment.customer?.phone}
								<span>•</span>
								<a
									href="tel:{assignment.customer.phone}"
									class="flex items-center gap-1 hover:text-indigo-600"
								>
									<PhoneCall class="size-3" />
									{assignment.customer.phone}
								</a>
							{/if}
							{#if assignment.customer?.email}
								<span>•</span>
								<a
									href="mailto:{assignment.customer.email}"
									class="flex items-center gap-1 hover:text-indigo-600"
								>
									<Mail class="size-3" />
									{assignment.customer.email}
								</a>
							{/if}
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<!-- Timeline Dialog -->
<Dialog.Root bind:open={showTimeline}>
	<Dialog.Content class="flex max-h-[85vh] max-w-3xl flex-col overflow-hidden">
		<Dialog.Header>
			<Dialog.Title class="text-2xl font-bold">Assignment Timeline</Dialog.Title>
			<Dialog.Description>
				{selectedAssignment
					? `${selectedAssignment.leadTitle} • ${selectedAssignment.customer?.name || 'No customer'}`
					: ''}
			</Dialog.Description>
		</Dialog.Header>

		<div class="my-6 flex-1 overflow-y-auto">
			<div class="space-y-4">
				{#if selectedAssignment && selectedAssignment.history && selectedAssignment.history.length > 0}
					{#each [...selectedAssignment.history].reverse() as event}
						<div
							class="hover:bg-muted/20 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors dark:border-gray-700 dark:bg-gray-800"
						>
							<div class="flex w-full flex-row justify-between gap-x-3">
								<div class="flex flex-col items-start gap-y-2">
									<div class="flex flex-row items-start gap-x-3">
										<div>
											{#if event.type === 'salesRepAssigned'}
												<User2 class="size-6 text-blue-500" />
											{:else if event.type === 'inContact'}
												<PhoneCall class="size-6 text-green-500" />
											{:else if event.type === 'inspectionScheduled'}
												<CalendarDays class="size-6 text-purple-500" />
											{:else if event.type === 'docsUploaded'}
												<File class="size-6 text-yellow-500" />
											{:else if event.type === 'estimateCreated'}
												<Calculator class="size-6 text-pink-500" />
											{:else if event.type === 'estimateSaved'}
												<Calculator class="size-6 text-orange-500" />
											{:else if event.type === 'estimateSent'}
												<Calculator class="size-6 text-indigo-500" />
											{:else if event.type === 'proposalSent'}
												<Send class="size-6 text-cyan-500" />
											{:else if event.type === 'proposalApproved'}
												<CheckCircle class="size-6 text-emerald-500" />
											{:else if event.type === 'jobCreated'}
												<Award class="size-6 text-orange-500" />
											{:else if event.type === 'closed'}
												<CheckCircle class="size-6 text-gray-500" />
											{:else}
												<Clock class="size-6 text-gray-500" />
											{/if}
										</div>
										<div class="h-4">
											<Badge
												class={`px-3 py-1 text-xs font-semibold tracking-wide whitespace-nowrap ${
													event.type === 'salesRepAssigned'
														? 'bg-blue-100 text-blue-800'
														: event.type === 'inContact'
															? 'bg-green-100 text-green-800'
															: event.type === 'inspectionScheduled'
																? 'bg-purple-100 text-purple-800'
																: event.type === 'docsUploaded'
																	? 'bg-yellow-100 text-yellow-800'
																	: event.type === 'estimateCreated'
																		? 'bg-pink-100 text-pink-800'
																		: event.type === 'estimateSaved'
																			? 'bg-orange-100 text-orange-800'
																			: event.type === 'estimateSent'
																				? 'bg-indigo-100 text-indigo-800'
																				: event.type === 'proposalSent'
																					? 'bg-cyan-100 text-cyan-800'
																					: event.type === 'proposalApproved'
																						? 'bg-emerald-100 text-emerald-800'
																						: 'bg-gray-100 text-gray-800'
												}`}
											>
												{event.type.replace(/([A-Z])/g, ' $1').toUpperCase()}
											</Badge>
										</div>
									</div>
									<div class="text-base font-medium text-gray-900 dark:text-gray-100">
										{#if event.type === 'salesRepAssigned'}
											Lead assigned to
											{#if event.assignee}
												<a
													href={getUserUrl(event.assignee)}
													target="_blank"
													class="font-semibold hover:underline"
													>{event.assignee?.name || 'Unassigned'}</a
												>
											{:else}
												<span class="font-semibold">Unassigned</span>
											{/if}
										{:else if event.type === 'inContact'}
											Initial contact made with lead
										{:else if event.type === 'inspectionScheduled'}
											Property inspection scheduled
										{:else if event.type === 'proposalSent'}
											Proposal sent {#if event.assignor}
												by <a
													href={getUserUrl(event.assignor)}
													target="_blank"
													class="font-semibold hover:underline">{event.assignor.name}</a
												>
											{/if}
										{:else if event.type === 'proposalApproved'}
											Proposal approved {#if event.assignor}
												by <a
													href={getUserUrl(event.assignor)}
													target="_blank"
													class="font-semibold hover:underline">{event.assignor.name}</a
												>
											{/if}
										{:else if event.type === 'closed'}
											Assignment closed
										{:else if event.type === 'docsUploaded'}
											Documents uploaded by
											{#if event.assignor}
												<a
													href={getUserUrl(event.assignor)}
													target="_blank"
													class="font-semibold hover:underline">{event.assignor.name}</a
												>
											{:else}
												<span class="font-semibold">Unknown</span>
											{/if}
										{:else if event.type === 'estimateCreated'}
											Estimate created by
											{#if event.assignor}
												<a
													href={getUserUrl(event.assignor)}
													target="_blank"
													class="font-semibold hover:underline">{event.assignor.name}</a
												>
											{:else}
												<span class="font-semibold">Unknown</span>
											{/if}
										{:else if event.type === 'estimateSaved'}
											Estimate saved by
											{#if event.assignor}
												<a
													href={getUserUrl(event.assignor)}
													target="_blank"
													class="font-semibold hover:underline">{event.assignor.name}</a
												>
											{:else}
												<span class="font-semibold">Unknown</span>
											{/if}
										{:else if event.type === 'estimateSent'}
											Estimate sent by
											{#if event.assignor}
												<a
													href={getUserUrl(event.assignor)}
													target="_blank"
													class="font-semibold hover:underline">{event.assignor.name}</a
												>
											{:else}
												<span class="font-semibold">Unknown</span>
											{/if}
										{:else}
											{event.type}
										{/if}
									</div>
								</div>

								<div class="flex flex-col items-start gap-y-4 sm:items-end">
									<time
										class="text-xs font-medium whitespace-nowrap text-gray-700 dark:text-gray-300"
									>
										{formatDate(event.at)}
									</time>
									<div class="text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
										{#if event.assignor}
											Updated by <a
												href={getUserUrl(event.assignor)}
												target="_blank"
												class="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
												>{event.assignor.name}</a
											>
										{/if}
									</div>
								</div>
							</div>

							<!-- Inspection Details -->
							{#if event.type === 'inspectionScheduled' && event.date}
								<div
									class="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-900/30"
								>
									<div class="mb-2 flex items-center gap-3 text-base font-medium">
										<CalendarDays class="size-5 text-indigo-600 dark:text-indigo-400" />
										<span class="text-gray-900 dark:text-gray-100"
											>Scheduled for <span class="font-semibold">{formatDate(event.date)}</span
											></span
										>
									</div>
									{#if event.assignee}
										<div class="flex items-center gap-3">
											<User2 class="size-5 text-indigo-600 dark:text-indigo-400" />
											<div class="font-medium text-gray-900 dark:text-gray-100">
												<a href={getUserUrl(event.assignee)} target="_blank" class="hover:underline"
													>{event.assignee.name}</a
												>
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				{:else}
					<div class="py-12 text-center text-lg text-gray-500 dark:text-gray-400">
						<Clock class="mx-auto mb-4 size-12 text-gray-400" />
						No history available for this assignment
					</div>
				{/if}
			</div>
		</div>

		<Dialog.Footer>
			<Dialog.Close>
				<Button variant="outline">Close</Button>
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
