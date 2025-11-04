<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Table from '$lib/components/ui/table/table.svelte';
	import Send from '@lucide/svelte/icons/send-horizontal';
	import Eye from '@lucide/svelte/icons/eye';
	import Check from '@lucide/svelte/icons/check';
	import FileText from '@lucide/svelte/icons/file-text';
	import { formatAmount, toTitleCase, iconColor } from '$lib/utils/proposals';
	import StatusChip from './StatusChip.svelte';
	
	export let proposals: any[];
	export let actionLoading: Record<number, string | null>;
	export let onSendClick: (proposal: any) => void;
	export let onViewClick: (proposal: any) => void;
	export let onApproveClick: (proposal: any) => void;
	export let onDownloadClick: (proposal: any) => void;
</script>

<Table class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
	<thead class="bg-slate-50 dark:bg-slate-800/80 text-left">
		<tr>
			<th class="px-4 py-3 font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase">Number</th>
			<th class="px-4 py-3 font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase">Date</th>
			<th class="px-4 py-3 font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase">Client</th>
			<th class="px-4 py-3 text-right font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase">Amount</th>
			<th class="px-4 py-3 font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase">Status</th>
			<th class="px-4 py-3 text-right font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase">Actions</th>
		</tr>
	</thead>
	<tbody>
		{#each proposals as p}
			<tr class="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 group transition">
				<td class="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{p.id}</td>
				<td class="px-4 py-3 text-slate-600 dark:text-slate-400">{(p.createdAt ?? '').slice(0, 10)}</td>
				<td class="px-4 py-3 text-slate-800 dark:text-slate-100">{`${p.customer?.firstName ?? ''} ${p.customer?.lastName ?? ''}`.trim()}</td>
				<td class="px-4 py-3 text-right font-semibold text-emerald-800 dark:text-emerald-300">{formatAmount(Number(p.totalAmount ?? 0))}</td>
				<td class="px-4 py-3">
					<StatusChip status={p.status} />
				</td>
				<td class="px-4 py-3 text-right">
					<div class="flex justify-end gap-1">
						{#if toTitleCase(p.status) === 'Draft'}
							<Button
								variant="ghost"
								class="h-8 rounded-full border border-blue-300 dark:border-blue-500 text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
								onclick={() => onSendClick(p)}
								disabled={actionLoading[p.id] === 'send'}
							>
								{#if actionLoading[p.id] === 'send'}
									<span class="mr-1 animate-spin">⏳</span>
								{/if}
								<Send class={"size-4 mr-1 " + iconColor('send')} />
								Send
							</Button>
						{/if}
						<Button
							variant="ghost"
							class="h-8 rounded-full border border-indigo-300 dark:border-indigo-500 text-indigo-900 dark:text-indigo-100 hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:border-indigo-400 dark:hover:border-indigo-400 transition-colors"
							onclick={() => onViewClick(p)}
						>
							<Eye class={"size-4 mr-1 " + iconColor(toTitleCase(p.status) === 'Draft' ? 'edit' : 'view')} />
							{toTitleCase(p.status) === 'Draft' ? 'Edit' : 'View'}
						</Button>
						{#if toTitleCase(p.status) === 'Viewed' || toTitleCase(p.status) === 'Sent'}
							<Button
								class="h-8 rounded-full border border-green-300 dark:border-green-600 text-green-700 dark:text-green-100 hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-400 dark:hover:border-green-400 theme-green transition-colors"
								onclick={() => onApproveClick(p)}
								disabled={actionLoading[p.id] === 'approve'}
							>
								{#if actionLoading[p.id] === 'approve'}
									<span class="mr-1 animate-spin">⏳</span>
								{/if}
								<Check class={"size-4 mr-1 " + iconColor('approve')} />
								Approve
							</Button>
						{/if}
						<Button
							variant="ghost"
							class="h-8 rounded-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-400 transition-colors"
							onclick={() => onDownloadClick(p)}
						>
							<FileText class={"size-4 mr-1 " + iconColor('pdf')} />
							PDF
						</Button>
					</div>
				</td>
			</tr>
		{/each}
	</tbody>
</Table>

