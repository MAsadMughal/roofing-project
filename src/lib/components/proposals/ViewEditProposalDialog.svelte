<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { toTitleCase } from '$lib/utils/proposals';
	import EstimateDetails from './EstimateDetails.svelte';
	
	export let open: boolean;
	export let activeProposal: any;
	export let proposalEstimateDetail: any;
	export let viewSubject: string;
	export let viewContent: string;
	export let editLoading: boolean;
	export let onSave: () => void;
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-2xl rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
		<Dialog.Header>
			<Dialog.Title class="text-lg font-semibold text-slate-800 dark:text-slate-100">
				{toTitleCase(activeProposal?.status ?? '') === 'Draft'
					? 'Edit Proposal'
					: 'View Proposal'}
			</Dialog.Title>
		</Dialog.Header>
		<div class="space-y-4 py-2">
			{#if proposalEstimateDetail}
				<EstimateDetails estimate={proposalEstimateDetail} />
			{:else if activeProposal?.estimateId}
				<div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
					No estimate details found for estimate #{activeProposal?.estimateId}
				</div>
			{/if}

			<div>
				<div class="mb-1 text-sm font-medium text-slate-900 dark:text-slate-100">Subject</div>
				{#if toTitleCase(activeProposal?.status ?? '') === 'Draft'}
					<Input
						placeholder="Subject"
						bind:value={viewSubject}
						class="rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100"
					/>
				{:else}
					<div class="rounded-lg border border-slate-200 dark:border-slate-600 p-2 text-sm text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800">
						{viewSubject}
					</div>
				{/if}
			</div>
			<div>
				<div class="mb-1 text-sm font-medium text-slate-900 dark:text-slate-100">Content</div>
				{#if toTitleCase(activeProposal?.status ?? '') === 'Draft'}
					<textarea
						class="min-h-60 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-3 text-slate-800 dark:text-slate-100 focus:ring-emerald-500"
						bind:value={viewContent}
						placeholder="Write proposal details..."
					></textarea>
				{:else}
					<div class="rounded-lg border border-slate-200 dark:border-slate-600 p-3 text-sm whitespace-pre-wrap text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800">
						{viewContent}
					</div>
				{/if}
			</div>
		</div>
		<Dialog.Footer class="mt-4 flex justify-end gap-2">
			<Dialog.Close>
				<Button variant="ghost" class="rounded-full text-slate-800 dark:text-slate-100">Close</Button>
			</Dialog.Close>
			{#if toTitleCase(activeProposal?.status ?? '') === 'Draft'}
				<Button
					onclick={onSave}
					disabled={editLoading}
					class="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-5"
				>
					{editLoading ? 'Saving...' : 'Save Changes'}
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

