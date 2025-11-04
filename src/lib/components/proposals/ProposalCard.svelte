<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Eye from '@lucide/svelte/icons/eye';
	import FileText from '@lucide/svelte/icons/file-text';
	import { formatAmount, toTitleCase, iconColor } from '$lib/utils/proposals';
	import StatusChip from './StatusChip.svelte';
	
	export let proposal: any;
	export let onViewClick: (proposal: any) => void;
	export let onDownloadClick: (proposal: any) => void;
</script>

<Card.Root class="group transition-all border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg rounded-2xl bg-white dark:bg-slate-900">
	<Card.Header>
		<div class="flex items-center justify-between gap-2">
			<div>
				<Card.Title class="mb-1 text-lg font-semibold tracking-tight flex items-center gap-2">
					<svg width="18" height="18" viewBox="0 0 24 24" class="text-sky-600 dark:text-sky-400 mr-1">
						<circle cx="12" cy="12" r="10" fill="currentColor" fill-opacity=".15" />
					</svg>
					<span>Proposal #{proposal.id}</span>
				</Card.Title>
				<Card.Description class="text-xs text-slate-500 dark:text-slate-400">
					{new Date(proposal.createdAt).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'short',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit'
					})}
				</Card.Description>
			</div>
			<StatusChip status={proposal.status} />
		</div>
	</Card.Header>
	<Card.Content class="space-y-3 pt-1">
		<div class="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-700">
			<span class="text-slate-700 dark:text-slate-200 text-xs font-semibold tracking-wide uppercase">Total</span>
			<span class="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
				{formatAmount(Number(proposal.totalAmount ?? 0))}
			</span>
		</div>
		{#if proposal.assignment}
			<div class="bg-slate-50 dark:bg-slate-800 space-y-2 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
				<div class="text-slate-700 dark:text-slate-200 text-xs font-semibold tracking-wide uppercase">
					Assignment Details
				</div>
				<div class="space-y-1 text-sm">
					{#if proposal.assignment.lead}
						<div class="flex items-start gap-2">
							<span class="text-slate-800 dark:text-slate-100 font-medium">Lead:</span>
							<span class="flex-1 font-semibold text-slate-900 dark:text-white">{proposal.assignment.lead.title}</span>
						</div>
						<div class="text-slate-600 dark:text-slate-400 text-xs">
							Lead #{proposal.assignment.lead.id} • {proposal.assignment.lead.status || 'N/A'}
						</div>
						{#if proposal.assignment.lead.source}
							<div class="text-slate-600 dark:text-slate-400 text-xs">
								Source: {proposal.assignment.lead.source}
							</div>
						{/if}
					{/if}
					<div class="mt-2 flex items-center gap-2 text-xs">
						<span class="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary dark:text-primary-100">
							Assignment #{proposal.assignment.id}
						</span>
						<span class="bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 rounded px-2 py-0.5 capitalize">
							{proposal.assignment.status}
						</span>
					</div>
				</div>
			</div>
		{/if}
		{#if proposal.customer}
			<div class="bg-slate-50 dark:bg-slate-800 space-y-2 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
				<div class="text-slate-700 dark:text-slate-200 text-xs font-semibold tracking-wide uppercase">
					Customer
				</div>
				<div class="space-y-1 text-sm">
					<div class="font-semibold text-slate-900 dark:text-white">
						{proposal.customer.firstName} {proposal.customer.lastName}
					</div>
					{#if proposal.customer.email}
						<div class="text-slate-600 dark:text-slate-400 text-xs">
							<i class="fa fa-envelope mr-1" />{proposal.customer.email}
						</div>
					{/if}
					{#if proposal.customer.phone}
						<div class="text-slate-600 dark:text-slate-400 text-xs">
							<i class="fa fa-phone mr-1" />{proposal.customer.phone}
						</div>
					{/if}
				</div>
			</div>
		{/if}
		{#if proposal.assignment && (proposal.assignment.assignedTo || proposal.assignment.estimator)}
			<div class="bg-slate-50 dark:bg-slate-800 space-y-2 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
				<div class="text-slate-700 dark:text-slate-200 text-xs font-semibold tracking-wide uppercase">
					Team
				</div>
				<div class="space-y-1 text-xs">
					{#if proposal.assignment.assignedTo}
						<div>
							<span class="font-medium text-blue-900 dark:text-blue-200">Rep:</span>
							{proposal.assignment.assignedTo.firstName} {proposal.assignment.assignedTo.lastName}
						</div>
					{/if}
					{#if proposal.assignment.estimator}
						<div>
							<span class="font-medium text-indigo-900 dark:text-indigo-200">Estimator:</span>
							{proposal.assignment.estimator.firstName} {proposal.assignment.estimator.lastName}
						</div>
					{/if}
				</div>
			</div>
		{/if}
		{#if proposal.subject || proposal.content}
			<div class="space-y-2">
				{#if proposal.subject}
					<div class="text-slate-700 dark:text-slate-200 text-xs font-semibold tracking-wide uppercase">
						Subject
					</div>
					<div class="text-sm font-medium text-slate-900 dark:text-white">{proposal.subject}</div>
				{/if}
				{#if proposal.content}
					<div class="text-slate-700 dark:text-slate-200 text-xs font-semibold tracking-wide uppercase">
						Content
					</div>
					<p class="line-clamp-3 text-xs text-slate-700 dark:text-slate-300">
						{proposal.content}
					</p>
				{/if}
			</div>
		{/if}

		<div class="space-y-1 rounded-lg border border-border border-slate-100 dark:border-slate-700 p-2 text-xs bg-slate-50 dark:bg-slate-800">
			<div class="text-slate-700 dark:text-slate-200 font-semibold tracking-wide uppercase">
				Timeline
			</div>
			{#if proposal.sentAt}
				<div class="text-slate-800 dark:text-slate-100">Sent: {new Date(proposal.sentAt).toLocaleDateString()}</div>
			{/if}
			{#if proposal.viewedAt}
				<div class="text-slate-800 dark:text-slate-100">Viewed: {new Date(proposal.viewedAt).toLocaleDateString()}</div>
			{/if}
			{#if proposal.signedAt}
				<div class="font-semibold text-green-700 dark:text-green-200">
					Signed: {new Date(proposal.signedAt).toLocaleDateString()}
				</div>
			{/if}
		</div>
		<div class="flex gap-3 pt-2">
			<Button
				variant="outline"
				size="sm"
				class="flex-1 rounded-full border border-slate-300 dark:border-sky-600 hover:border-sky-400 dark:hover:border-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900 group-hover:border-sky-500 transition-colors text-gray-800 dark:text-gray-100"
				onclick={() => onViewClick(proposal)}
			>
				<Eye class={"size-4 mr-1 " + iconColor(toTitleCase(proposal.status) === 'Draft' ? 'edit' : 'view')} />
				{toTitleCase(proposal.status) === 'Draft' ? 'Edit' : 'View'}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				class="rounded-full border border-slate-200 dark:border-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900 transition-colors text-gray-800 dark:text-gray-100"
				onclick={() => onDownloadClick(proposal)}
			>
				<FileText class={"size-4 " + iconColor('pdf')} />
			</Button>
		</div>
	</Card.Content>
</Card.Root>

