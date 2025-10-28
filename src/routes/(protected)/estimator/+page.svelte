<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { onMount } from 'svelte';

	let assignments: any[] = [];
	let selectedAssignment: any = null;
	let uploadFiles: FileList | null = null;
	let uploading = false;
	let uploadMsg: string | null = null;

	async function uploadDocs() {
		uploadMsg = null;
    console.log('uploadDocs');
    console.log(selectedAssignment);
		if (!selectedAssignment || !uploadFiles || uploadFiles.length === 0) {
			uploadMsg = 'Please select files to upload';
			return;
		}
		uploading = true;
		try {
			const docs = Array.from(uploadFiles).map((f) => ({
				name: f.name,
				size: f.size,
				type: f.type
			}));

			const res = await fetch(`/api/assignments/${selectedAssignment}/docs`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ docs })
			});

			const data = await res.json();

			if (res.ok) {
				uploadMsg = 'Documents uploaded successfully';
				await fetchAssignments();
			} else {
				uploadMsg = data.error || 'Upload failed';
			}
		} finally {
			uploading = false;
		}
	}

	async function fetchAssignments() {
		const res = await fetch('/api/estimator/assignments');
		const data = await res.json();
		if (res.ok) assignments = data.assignments ?? [];
	}

	onMount(() => {
		fetchAssignments();
	});
</script>

<div class="relative flex min-h-screen flex-col items-center justify-start px-4 py-10">
	<div class="mb-6 w-full max-w-4xl">
		<h1 class="text-2xl font-semibold text-slate-800 dark:text-slate-200">Estimator Workspace</h1>
		<p class="text-sm text-slate-500 dark:text-slate-400">
			Your assigned leads. Upload docs for inspection_scheduled assignments.
		</p>
	</div>

	<div
		class="mb-8 w-full max-w-4xl rounded-2xl border border-purple-100 bg-white/80 p-4 shadow-xl backdrop-blur-md dark:border-purple-900 dark:bg-[#1a1335]/80"
	>
		<h3 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Your Assignments</h3>
		{#if assignments.length === 0}
			<p class="text-sm text-slate-500">No assignments found.</p>
		{:else}
			<ul class="divide-y">
				{#each assignments as assignment}
					<li class="flex items-center justify-between py-2 text-sm">
						<div>
							<div class="font-medium text-slate-800 dark:text-slate-200">
								{assignment.lead?.title} — <span class="text-slate-500">{assignment.status}</span>
							</div>
							<div class="text-slate-500">
								Lead #{assignment.leadId} • Customer: {assignment.lead?.customer?.firstName}
								{assignment.lead?.customer?.lastName}
							</div>
						</div>
						<div>
							{#if assignment.status === 'inspection_scheduled'}
								<Dialog.Root onOpenChange={(open) => { if (open) selectedAssignment = assignment.id }}>
									<Dialog.Trigger>
										<Button size="sm">Upload Documents</Button>
									</Dialog.Trigger>
									<Dialog.Content class="sm:max-w-[425px]">
										<Dialog.Header>
											<Dialog.Title>Upload Documents</Dialog.Title>
											<Dialog.Description>
												Upload inspection documents for {assignment.lead?.title}
											</Dialog.Description>
										</Dialog.Header>

										<div class="grid gap-4 py-4">
											<input
												type="file"
												multiple
												class="w-full"
												on:change={(e: any) => (uploadFiles = e.target.files)}
											/>
											{#if uploadMsg}
												<p class="text-sm text-slate-600 dark:text-slate-300">{uploadMsg}</p>
											{/if}
										</div>

										<Dialog.Footer>
											<Dialog.Close>
												<Button variant="outline">Cancel</Button>
											</Dialog.Close>
											<Button disabled={uploading} onclick={uploadDocs}>
												{uploading ? 'Uploading...' : 'Upload'}
											</Button>
										</Dialog.Footer>
									</Dialog.Content>
								</Dialog.Root>
							{:else if assignment.status === 'docs_uploaded'}
								<Button size="sm" href={`/estimates?assignmentId=${assignment.id}`}>
									Create Estimate
								</Button>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
