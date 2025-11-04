<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Select from '$lib/components/ui/select/select.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import EstimateDetails from './EstimateDetails.svelte';
	
	export let open: boolean;
	export let dialogAssignments: Array<{ id: number; customer_name: string }>;
	export let estimates: Array<{ id: number; status: string; total_amount: number; [key: string]: any }>;
	export let selectedAssignmentId: number | null;
	export let selectedEstimateId: number | null;
	export let selectedEstimateDetail: any;
	export let formSubject: string;
	export let formContent: string;
	export let sendNow: boolean;
	export let creating: boolean;
	export let onAssignmentChange: (id: number) => void;
	export let onEstimateChange: (id: number | null) => void;
	export let onCreate: () => void;
	
	let assignmentValue: string | null = selectedAssignmentId ? String(selectedAssignmentId) : null;
	let estimateValue: string | null = selectedEstimateId ? String(selectedEstimateId) : null;
	
	$: if (selectedAssignmentId !== null) {
		assignmentValue = String(selectedAssignmentId);
	} else if (selectedAssignmentId === null && assignmentValue !== null && assignmentValue !== '') {
		// Keep the value until user changes it
	}
	
	$: if (selectedEstimateId !== null) {
		estimateValue = String(selectedEstimateId);
	} else if (selectedEstimateId === null) {
		estimateValue = null;
	}
	
	$: if (assignmentValue && Number(assignmentValue) !== selectedAssignmentId) {
		onAssignmentChange(Number(assignmentValue));
	}
	
	$: if (estimateValue !== (selectedEstimateId ? String(selectedEstimateId) : null)) {
		onEstimateChange(estimateValue ? Number(estimateValue) : null);
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
		<Dialog.Header>
			<Dialog.Title class="text-lg font-semibold text-slate-800 dark:text-slate-100">Create Proposal</Dialog.Title>
			<Dialog.Description class="text-slate-500 dark:text-slate-300">Select assignment and finalized estimate</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-2">
			<div>
				<div class="mb-1 text-sm font-medium text-slate-900 dark:text-slate-100">Assignment</div>
				<Select
					class="w-full rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100"
					bind:value={assignmentValue}
					items={dialogAssignments.map((a) => ({
						value: String(a.id),
						label: `${a.customer_name} (#${a.id})`
					}))}
				/>
			</div>
			<div>
				<div class="mb-1 text-sm font-medium text-slate-900 dark:text-slate-100">Estimate</div>
				<Select
					class="w-full rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100"
					bind:value={estimateValue}
					items={estimates.map((e) => ({
						value: String(e.id),
						label: `#${e.id} • ${e.status} • $${Number(e.total_amount ?? e.totalAmount ?? 0).toFixed(2)}`
					}))}
				/>
				{#if selectedEstimateDetail}
					<div class="mt-2">
						<EstimateDetails estimate={selectedEstimateDetail} />
					</div>
				{:else if selectedEstimateId}
					<div class="mt-2 text-xs text-slate-600 dark:text-slate-400">No estimate details found.</div>
				{/if}
			</div>
			<div>
				<div class="mb-1 text-sm font-medium text-slate-900 dark:text-slate-100">Subject</div>
				<Input
					placeholder="Subject"
					bind:value={formSubject}
					class="rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100"
				/>
			</div>
			<div>
				<div class="mb-1 text-sm font-medium text-slate-900 dark:text-slate-100">Content</div>
				<textarea
					class="min-h-40 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-3 text-slate-800 dark:text-slate-100 focus:ring-emerald-500"
					bind:value={formContent}
					placeholder="Write proposal details..."
				></textarea>
			</div>
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" class="accent-emerald-500" bind:checked={sendNow} />
				<span class="text-emerald-700 dark:text-emerald-200 font-semibold">Send now (final)</span>
			</label>
		</div>
		<Dialog.Footer class="mt-4 flex justify-end gap-2">
			<Dialog.Close>
				<Button variant="ghost" class="rounded-full text-slate-800 dark:text-slate-100">Cancel</Button>
			</Dialog.Close>
			<Button
				disabled={creating || !selectedAssignmentId || !selectedEstimateId}
				class="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-5"
				onclick={onCreate}
			>
				{creating ? 'Creating...' : 'Create'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

