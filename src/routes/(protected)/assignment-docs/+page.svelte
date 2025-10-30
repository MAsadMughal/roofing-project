<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	export let data: any;

	let assignments: any[] = data.assignments ?? [];
	let docsByAssignmentId: Record<string, any> = data.docsByAssignmentId ?? {};
	let selectedAssignment: any = null;
	let assignmentDocs: any = null;
	let viewingDocsAssignment: any = null;
	let uploadFiles: FileList | null = null;
	let uploading = false;
	let uploadMsg: string | null = null;
	let editMode = false;
	let confirmDeleteDocId: string | null = null;
	let deletingDocId: string | null = null;
	let updatingDocId: string | null = null;

	// Helper function to determine if a doc is an image
	function isImageDoc(doc: any): boolean {
		// By MIME type if present, fallback to extension check:
		const mime = (doc.type || doc.mimeType || '').toLowerCase();
		if (mime.startsWith('image/')) return true;
		const name = doc.name?.toLowerCase() ?? '';
		return (
			name.endsWith('.png') ||
			name.endsWith('.jpg') ||
			name.endsWith('.jpeg') ||
			name.endsWith('.gif') ||
			name.endsWith('.bmp') ||
			name.endsWith('.webp') ||
			name.endsWith('.svg')
		);
	}

	// Use locally fetched docs for assignment display
	function setDocsForAssignment(assignmentId: string) {
		assignmentDocs = docsByAssignmentId[assignmentId] ?? null;
	}

	async function refreshDocsForAssignment(assignmentId: string) {
		const res = await fetch(`/api/assignments/${assignmentId}/docs`, { method: 'GET' });
		const result = await res.json();
		docsByAssignmentId[assignmentId] = result?.docs ?? null;
		setDocsForAssignment(assignmentId);
	}

	async function uploadDocs() {
		uploadMsg = null;
		if (!selectedAssignment || !uploadFiles || uploadFiles.length === 0) {
			uploadMsg = 'Please select files to upload';
			return;
		}
		uploading = true;
		try {
			const formData = new FormData();
			Array.from(uploadFiles).forEach((file) => {
				formData.append('files', file);
			});

			const res = await fetch(`/api/assignments/${selectedAssignment}/docs`, {
				method: 'POST',
				body: formData
			});

			const data = await res.json();

			if (res.ok) {
				uploadMsg = 'Documents uploaded successfully';
				await refreshDocsForAssignment(String(selectedAssignment));
				assignments = assignments.map((a) =>
					String(a.id) === String(selectedAssignment) ? { ...a, status: data.assignment?.status ?? a.status } : a
				);
				uploadFiles = null;
				editMode = false;
			} else {
				uploadMsg = data.error || 'Upload failed';
			}
		} finally {
			uploading = false;
		}
	}

	async function deleteDoc(docId: string) {
		if (!selectedAssignment || !docId) return;
		deletingDocId = docId;
		uploadMsg = null;
		try {
			const res = await fetch(`/api/assignments/${selectedAssignment}/docs/${docId}`, {
				method: 'DELETE'
			});
			const data = await res.json();
			if (res.ok) {
				uploadMsg = 'Document deleted.';
				await refreshDocsForAssignment(String(selectedAssignment));
			} else {
				uploadMsg = data.error || 'Failed to delete document';
			}
		} finally {
			deletingDocId = null;
			confirmDeleteDocId = null;
		}
	}

	// Allow changing document name
	async function updateDocName(doc: any, newName: string) {
		if (!selectedAssignment || !doc?.id || !newName) return;
		updatingDocId = doc.id;
		uploadMsg = null;
		try {
			const res = await fetch(`/api/assignments/${selectedAssignment}/docs/${doc.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: newName })
			});
			const data = await res.json();
			if (res.ok) {
				uploadMsg = 'Document updated.';
				await refreshDocsForAssignment(String(selectedAssignment));
			} else {
				uploadMsg = data.error || 'Failed to update document';
			}
		} finally {
			updatingDocId = null;
			doc.editing = false;
		}
	}

	async function handleViewDocs(assignment: any) {
		viewingDocsAssignment = assignment;
		selectedAssignment = String(assignment.id);
		editMode = false;
		uploadMsg = null;
		await refreshDocsForAssignment(String(assignment.id));
		uploadFiles = null;
	}

	function closeDocsDialog() {
		viewingDocsAssignment = null;
		selectedAssignment = null;
		assignmentDocs = null;
		editMode = false;
		uploadFiles = null;
		uploadMsg = null;
		confirmDeleteDocId = null;
	}

	function enableEdit() {
		editMode = true;
		uploadFiles = null;
		uploadMsg = null;
		// Add editing state to docs
		if (assignmentDocs?.docs?.length > 0) {
			assignmentDocs.docs = assignmentDocs.docs.map((d: any) => ({
				...d,
				editing: false,
				newName: d.name
			}));
		}
	}

	function setDocEditing(doc: any, val: boolean) {
		doc.editing = val;
		doc.newName = doc.name;
	}
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
						<div class="flex items-center gap-2">
							{#if assignment.status === 'inspection_scheduled'}
								<Button size="sm" onclick={() => handleViewDocs(assignment)}
									>Upload / View Documents</Button
								>
							{:else if assignment.status === 'docs_uploaded'}
								<Button size="sm" onclick={() => handleViewDocs(assignment)}
									>View/Edit Documents</Button
								>
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

	{#if viewingDocsAssignment}
		<Dialog.Root open={!!viewingDocsAssignment} onOpenChange={closeDocsDialog}>
			<Dialog.Content class="sm:max-w-[600px]">
				<Dialog.Header>
					<Dialog.Title>
						Documents for {viewingDocsAssignment.lead?.title}
					</Dialog.Title>
					<Dialog.Description>
						{viewingDocsAssignment.status === 'inspection_scheduled'
							? 'Upload inspection documents.'
							: 'Uploaded documents for this assignment.'}
					</Dialog.Description>
				</Dialog.Header>
				<div class="grid gap-4 py-4">
					{#if assignmentDocs && assignmentDocs.docs && assignmentDocs.docs.length > 0}
						<h4 class="mb-1 text-base font-semibold text-purple-900 dark:text-purple-200">
							Current Documents:
						</h4>
						<ul class="mb-3 list-disc pl-6">
				{#each assignmentDocs.docs as doc, i (doc.id)}
								<li class="mb-1 flex items-center gap-2">
									<span>
										{#if editMode && doc.editing}
											<input
												bind:value={doc.newName}
												class="rounded border border-slate-300 px-1 py-0.5 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
												size={Math.max(10, doc.newName?.length || 15)}
												maxlength="100"
												disabled={updatingDocId === doc.id}
											/>
											<Button
												disabled={updatingDocId === doc.id ||
													doc.newName.trim()?.length === 0 ||
													doc.newName === doc.name}
												onclick={async () => {
													await updateDocName(doc, doc.newName.trim());
												}}
											>
												{updatingDocId === doc.id ? 'Saving...' : 'Save'}
											</Button>
											<Button
												variant="ghost"
												onclick={() => setDocEditing(doc, false)}
												disabled={updatingDocId === doc.id}
											>
												Cancel
											</Button>
										{:else}
											{#if isImageDoc(doc)}
												<a
													href={doc.url}
													target="_blank"
													class="inline-block align-middle"
													tabindex="0"
													title={doc.name}
												>
													<img
														src={doc.url}
														alt={doc.name}
														style="max-width:64px;max-height:64px;border-radius:0.25rem;display:inline-block;border:1px solid #ddd;vertical-align:middle;margin-right:8px"
													/>
												</a>
											{/if}
											<a href={doc.url} target="_blank" class="text-indigo-600 hover:underline"
												>{doc.name}</a
											>
										{/if}
										<span class="ml-2 text-xs text-slate-500">
											({Math.round(doc.size / 1024)} KB)
										</span>
										<span class="ml-2 text-xs text-slate-400">
											{new Date(doc.uploadedAt).toLocaleString()}
										</span>
									</span>
									{#if editMode}
										<Button
											variant="ghost"
											disabled={!!updatingDocId || !!deletingDocId}
											onclick={() => setDocEditing(doc, !doc.editing)}
										>
											{doc.editing ? 'Editing...' : 'Edit'}
										</Button>
										<Button
											variant="destructive"
											disabled={deletingDocId === doc.id}
											onclick={() => (confirmDeleteDocId = doc.id)}
										>
											{deletingDocId === doc.id ? 'Deleting...' : 'Delete'}
										</Button>
										{#if confirmDeleteDocId === doc.id}
											<span class="ml-2 text-xs text-rose-700">Confirm?</span>
											<Button
												variant="destructive"
												disabled={deletingDocId === doc.id}
												onclick={() => deleteDoc(doc.id)}
											>
												Yes
											</Button>
											<Button variant="outline" onclick={() => (confirmDeleteDocId = null)}>
												No
											</Button>
										{/if}
									{/if}
								</li>
							{/each}
						</ul>
						{#if !editMode && (viewingDocsAssignment.status === 'inspection_scheduled' || viewingDocsAssignment.status === 'docs_uploaded')}
							<Button size="sm" variant="ghost" onclick={enableEdit}>Edit Documents</Button>
						{:else if editMode}
							<Button
								size="sm"
								variant="ghost"
								onclick={() => {
									editMode = false;
									uploadMsg = null;
								}}>Done Editing</Button
							>
						{/if}
					{:else if !editMode}
						<p class="mb-3 text-sm text-slate-500">No documents uploaded.</p>
					{/if}

					{#if editMode || !assignmentDocs || !assignmentDocs.docs || assignmentDocs.docs.length === 0}
						<div>
							<label class="mb-1 block font-medium">Upload new documents:</label>
							<input
								type="file"
								multiple
								class="w-full"
								on:change={(e: any) => (uploadFiles = e.target.files)}
								disabled={uploading}
							/>
							{#if uploadMsg}
								<p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{uploadMsg}</p>
							{/if}
							<Button disabled={uploading} onclick={uploadDocs} class="mt-2">
								{uploading ? 'Uploading...' : 'Save New Files'}
							</Button>
						</div>
					{/if}
					{#if uploadMsg && !(editMode || !assignmentDocs || !assignmentDocs.docs || assignmentDocs.docs.length === 0)}
						<p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{uploadMsg}</p>
					{/if}
				</div>

				<Dialog.Footer>
					<Dialog.Close>
						<Button variant="outline">Close</Button>
					</Dialog.Close>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
</div>
