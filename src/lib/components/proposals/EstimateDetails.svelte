<script lang="ts">
	import { formatAmount, statusChipClass, getEstimateKeyValues } from '$lib/utils/proposals';
	import StatusChip from './StatusChip.svelte';
	
	export let estimate: any;
</script>

{#if estimate}
	<div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-xs leading-relaxed border border-slate-200 dark:border-slate-700">
		<div class="mb-1 font-medium text-sm text-slate-900 dark:text-slate-100">Estimate Details</div>
		<table class="w-full">
			<tbody>
				<tr>
					<td class="pr-2 font-semibold text-slate-800 dark:text-slate-200">ID</td>
					<td>{estimate.id}</td>
				</tr>
				<tr>
					<td class="pr-2 font-semibold text-slate-800 dark:text-slate-200">Status</td>
					<td><StatusChip status={estimate.status} /></td>
				</tr>
				<tr>
					<td class="pr-2 font-semibold text-slate-800 dark:text-slate-200">Amount</td>
					<td>
						{formatAmount(Number(estimate.total_amount ?? estimate.totalAmount ?? 0))}
					</td>
				</tr>
				{#if estimate.createdAt}
					<tr>
						<td class="pr-2 font-semibold text-slate-800 dark:text-slate-200">Created</td>
						<td>{new Date(estimate.createdAt).toLocaleDateString()}</td>
					</tr>
				{/if}
				{#if estimate.notes}
					<tr>
						<td class="pr-2 font-semibold text-slate-800 dark:text-slate-200">Notes</td>
						<td>{estimate.notes}</td>
					</tr>
				{/if}
				{#if estimate.description}
					<tr>
						<td class="pr-2 font-semibold text-slate-800 dark:text-slate-200">Description</td>
						<td>{estimate.description}</td>
					</tr>
				{/if}
				{#each getEstimateKeyValues(estimate) as row}
					<tr>
						<td class="pr-2 font-semibold text-slate-800 dark:text-slate-200">{row.key}</td>
						<td>{row.value}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

