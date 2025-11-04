<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Accordion from '$lib/components/ui/accordion';
	import Plus from '@lucide/svelte/icons/plus';
	import { formatAmount, iconColor, getEstimateKeyValues } from '$lib/utils/proposals';
	import StatusChip from './StatusChip.svelte';
	
	export let assignments: any[];
	export let onSelectAssignment: (assignmentId: number, estimateId: number) => void;
</script>

{#if assignments.length > 0}
	<div class="mt-8">
		<h2 class="mb-4 text-2xl font-bold">Assignments Ready for Proposals</h2>
		<Accordion.Root
			type="multiple"
			class="w-full divide-y divide-slate-200 dark:divide-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"
		>
			{#each assignments.filter((a) => a.estimates?.length > 0) as assignment (assignment.id)}
				<Accordion.Item value={`a-${assignment.id}`} class="px-3 py-2">
					<Accordion.Trigger
						class="flex w-full items-center gap-4 rounded-lg border-0 bg-transparent px-1 py-2 transition"
					>
						<div class="flex min-w-0 grow flex-col justify-center text-left">
							<div class="truncate text-base font-medium text-slate-800 dark:text-slate-100">
								{assignment.lead?.title}
								<span class="text-slate-600 dark:text-slate-400 ml-1 text-xs font-normal">
									(#{assignment.lead?.id})
								</span>
							</div>
							<div class="text-slate-600 dark:text-slate-400 truncate text-xs">
								Customer: {assignment.lead?.customer?.firstName}
								{assignment.lead?.customer?.lastName}
							</div>
						</div>
						<StatusChip status={assignment.status} />
					</Accordion.Trigger>
					<Accordion.Content class="bg-neutral-100 dark:bg-neutral-900 mt-0 rounded-b-lg px-4 py-4">
						{#if assignment.estimates?.length}
							<div class="space-y-3">
								{#each assignment.estimates as estimate (estimate.id)}
									<Card.Root class="rounded-lg border border-border border-slate-200 dark:border-slate-700 shadow-none bg-white dark:bg-slate-900">
										<Card.Content class="flex flex-col gap-2 p-3">
											<div class="flex w-full items-center justify-between gap-2">
												<div class="truncate">
													<span class="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
														Estimate E-{estimate.id}
														<StatusChip status={estimate.status} />
														<span class="text-slate-600 dark:text-slate-400 ml-1 text-xs">
															{estimate.createdAt ? new Date(estimate.createdAt).toLocaleString() : ''}
														</span>
													</span>
												</div>
												<div class="flex items-center gap-2">
													<span class="text-lg font-semibold tabular-nums text-emerald-800 dark:text-emerald-300">
														{formatAmount(Number(estimate.total_amount ?? estimate.totalAmount ?? 0))}
													</span>
												</div>
											</div>
											<div class="mt-2">
												<table class="text-xs w-full mb-2">
													<tbody>
														<tr>
															<td class="font-semibold pr-2 text-slate-700 dark:text-slate-200">ID</td>
															<td>{estimate.id}</td>
														</tr>
														<tr>
															<td class="font-semibold pr-2 text-slate-700 dark:text-slate-200">Status</td>
															<td>{estimate.status}</td>
														</tr>
														<tr>
															<td class="font-semibold pr-2 text-slate-700 dark:text-slate-200">Amount</td>
															<td>{formatAmount(Number(estimate.total_amount ?? estimate.totalAmount ?? 0))}</td>
														</tr>
														{#if estimate.createdAt}
															<tr>
																<td class="font-semibold pr-2 text-slate-700 dark:text-slate-200">Created</td>
																<td>{new Date(estimate.createdAt).toLocaleDateString()}</td>
															</tr>
														{/if}
														{#if estimate.notes}
															<tr>
																<td class="font-semibold pr-2 text-slate-700 dark:text-slate-200">Notes</td>
																<td>{estimate.notes}</td>
															</tr>
														{/if}
														{#if estimate.description}
															<tr>
																<td class="font-semibold pr-2 text-slate-700 dark:text-slate-200">Description</td>
																<td>{estimate.description}</td>
															</tr>
														{/if}
														{#each getEstimateKeyValues(estimate) as row}
															<tr>
																<td class="font-semibold pr-2 text-slate-700 dark:text-slate-200">{row.key}</td>
																<td>{row.value}</td>
															</tr>
														{/each}
													</tbody>
												</table>
											</div>
											<div class="flex gap-2 pt-2">
												<Button
													variant="outline"
													size="sm"
													class="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-5"
													onclick={() => onSelectAssignment(assignment.id, estimate.id)}
												>
													<Plus class={"size-4 mr-1 " + iconColor('new')} />
													Create Proposal
												</Button>
											</div>
										</Card.Content>
									</Card.Root>
								{/each}
							</div>
						{:else}
							<div class="text-slate-600 dark:text-slate-400 py-3 text-sm">
								No saved estimates available for this assignment.
							</div>
						{/if}
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</div>
{/if}

