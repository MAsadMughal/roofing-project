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
	let confirmDeleteDocId: string | null = null;
	let deletingDocId: string | null = null;
	let updatingDocId: string | null = null;
	let nameEdits: { [docId: string]: string } = {};
	let imagePreviewDoc: any = null;
	let loadingDocs = false;

	function isImageDoc(doc: any): boolean {
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

	function setDocsForAssignment(assignmentId: string) {
		assignmentDocs = docsByAssignmentId[assignmentId] ?? null;
	}

	async function refreshDocsForAssignment(assignmentId: string) {
		loadingDocs = true;
		try {
			const res = await fetch(`/api/assignments/${assignmentId}/docs`, { method: 'GET' });
			const result = await res.json();
			docsByAssignmentId[assignmentId] = result?.docs ?? null;
			setDocsForAssignment(assignmentId);
		} finally {
			loadingDocs = false;
		}
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
					String(a.id) === String(selectedAssignment)
						? { ...a, status: data.assignment?.status ?? a.status }
						: a
				);
				uploadFiles = null;
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

	// Change document name
	async function updateDocName(doc: any, newName: string) {
		if (!selectedAssignment || !doc?.id || !newName?.trim()) return;
		updatingDocId = doc.id;
		uploadMsg = null;
		try {
			const res = await fetch(`/api/assignments/${selectedAssignment}/docs/${doc.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: newName.trim() })
			});
			const data = await res.json();
			if (res.ok) {
				uploadMsg = 'Document updated.';
				await refreshDocsForAssignment(String(selectedAssignment));
				// Set nameEdits[doc.id] to updated doc name rather than empty string
				nameEdits[doc.id] = newName.trim();
			} else {
				uploadMsg = data.error || 'Failed to update document';
			}
		} finally {
			updatingDocId = null;
		}
	}

	async function handleViewDocs(assignment: any) {
		viewingDocsAssignment = assignment;
		selectedAssignment = String(assignment.id);
		uploadMsg = null;
		loadingDocs = true;
		await refreshDocsForAssignment(String(assignment.id));
		uploadFiles = null;
		confirmDeleteDocId = null;
		nameEdits = {};
	}

	function closeDocsDialog() {
		viewingDocsAssignment = null;
		selectedAssignment = null;
		assignmentDocs = null;
		uploadFiles = null;
		uploadMsg = null;
		confirmDeleteDocId = null;
		imagePreviewDoc = null;
		nameEdits = {};
		loadingDocs = false;
	}

	function openImageDialog(doc: any) {
		imagePreviewDoc = doc;
	}

	function closeImageDialog() {
		imagePreviewDoc = null;
	}

	function triggerFileInput() {
		const fileInput = document.getElementById('file-input');
		if (fileInput) fileInput.click();
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
								<Button size="sm" onclick={() => handleViewDocs(assignment)}>
									Upload / View Documents
								</Button>
							{:else if assignment.status === 'docs_uploaded'}
								<Button size="sm" onclick={() => handleViewDocs(assignment)}>
									View/Edit Documents
								</Button>
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
					{#if loadingDocs}
						<p class="mb-3 text-sm text-slate-500">Loading documents...</p>
					{:else if assignmentDocs && assignmentDocs.docs && assignmentDocs.docs.length > 0}
						<h4 class="mb-1 text-base font-semibold text-purple-900 dark:text-purple-200">
							Current Documents:
						</h4>
						<ul class="mb-3 space-y-2">
							{#each assignmentDocs.docs as doc (doc.id)}
								<li class="flex flex-col gap-2 sm:flex-row sm:items-center">
									<div class="flex min-w-0 flex-1 items-center gap-3">
										{#if isImageDoc(doc)}
											<!-- Show image thumbnail opening dialog on click -->
											<button
												type="button"
												title="Click to preview image"
												onclick={() => openImageDialog(doc)}
												class="rounded ring-indigo-300 hover:ring focus:outline-none"
												style="background:transparent;border:none;padding:0;display:inline-block"
											>
												<img
													src={doc.url}
													alt={doc.name}
													class="inline-block"
													style="width:44px;height:44px;object-fit:cover;border-radius:0.3rem;border:1px solid #ddd;vertical-align:middle"
												/>
											</button>
										{/if}
										<!-- Rename: always editable input, minimal -->
										<input
											class="transition-border w-auto max-w-[240px] min-w-[120px] rounded border border-slate-200 bg-white px-2 py-1 text-[0.97em] font-medium text-slate-900 focus:border-indigo-400 focus:outline-none disabled:bg-gray-100/70 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-700/40"
											style="min-width:120px"
											value={nameEdits[doc.id] != undefined ? nameEdits[doc.id] : doc.name}
											disabled={updatingDocId === doc.id}
											oninput={(e: any) => (nameEdits[doc.id] = e.target.value)}
											onkeydown={(e) => {
												if (
													e.key === 'Enter' &&
													nameEdits[doc.id]?.trim() &&
													nameEdits[doc.id] !== doc.name
												) {
													updateDocName(doc, nameEdits[doc.id]);
												}
											}}
											aria-label="Rename document"
										/>
										<!-- Save change -->
										{#if nameEdits[doc.id] != undefined && nameEdits[doc.id].trim() !== doc.name}
											<Button
												disabled={updatingDocId === doc.id ||
													nameEdits[doc.id]?.trim().length === 0}
												onclick={() => updateDocName(doc, nameEdits[doc.id])}
											>
												{updatingDocId === doc.id ? 'Saving...' : 'Save'}
											</Button>
											<Button
												variant="ghost"
												onclick={() => (nameEdits[doc.id] = doc.name)}
												disabled={updatingDocId === doc.id}
											>
												Cancel
											</Button>
										{/if}
										<!-- <a
											href={doc.url}
											target="_blank"
											class="block max-w-[140px] truncate text-indigo-600 hover:underline"
											title={doc.name}
										>
											{doc.name}
										</a>
										<span class="ml-1 shrink-0 text-xs text-slate-500">
											({Math.round(doc.size / 1024)} KB)
										</span>
										<span class="ml-1 shrink-0 text-xs text-slate-400">
											{new Date(doc.uploadedAt).toLocaleString()}
										</span> -->
									</div>
									<!-- Delete button with confirmation -->
									<div class="flex-none">
										{#if confirmDeleteDocId === doc.id}
											<span class="mr-2 text-xs font-semibold text-rose-600">Confirm?</span>
											<Button
												variant="outline"
												disabled={deletingDocId === doc.id}
												onclick={() => deleteDoc(doc.id)}
											>
												Yes
											</Button>
											<Button
												variant="ghost"
												onclick={() => (confirmDeleteDocId = null)}
												disabled={deletingDocId === doc.id}
											>
												No
											</Button>
										{:else}
											<Button
												variant="outline"
												disabled={deletingDocId === doc.id}
												onclick={() => (confirmDeleteDocId = doc.id)}
											>
												{deletingDocId === doc.id ? 'Deleting...' : 'Delete'}
											</Button>
										{/if}
									</div>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="mb-3 text-sm text-slate-500">No documents uploaded.</p>
					{/if}

					<!-- Minimal Upload New Documents Section -->
					<div>
						<label class="mb-1 block font-medium">Upload new documents:</label>
						<!-- Custom file upload button -->
						<input
							id="file-input"
							type="file"
							multiple
							onchange={(e: any) => (uploadFiles = e.target.files)}
							disabled={uploading}
							style="display:none"
						/>
						<!-- Only show "Select Files" button when NOT files selected -->
						{#if !uploadFiles || uploadFiles.length === 0}
							<Button type="button" class="mb-2" disabled={uploading} onclick={triggerFileInput}>
								{uploading ? 'Uploading...' : 'Select Files'}
							</Button>
						{/if}
						{#if uploadFiles && uploadFiles.length > 0}
							<div
								class="mt-0.5 mb-1 flex flex-wrap gap-2 text-xs text-slate-700 dark:text-slate-200"
							>
								{#each Array.from(uploadFiles) as file}
									<span class="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{file.name}</span>
								{/each}
							</div>
							<!-- Show Both 'Upload' and 'Clear' buttons when files are selected -->
							<div class="flex gap-2 mt-2">
								<Button
									disabled={uploading}
									onclick={uploadDocs}
									variant="secondary"
								>
									{uploading ? 'Uploading...' : 'Upload'}
								</Button>
								<Button
									type="button"
									variant="ghost"
									disabled={uploading}
									onclick={() => (uploadFiles = null)}
								>
									Clear
								</Button>
							</div>
						{/if}
						{#if uploadMsg}
							<p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{uploadMsg}</p>
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
	{/if}

	{#if imagePreviewDoc}
		<!-- Dialog for Image Preview -->
		<Dialog.Root open={!!imagePreviewDoc} onOpenChange={closeImageDialog}>
			<Dialog.Content class="w-[70vw] max-w-[80vw] sm:max-w-[100vw]">
				<Dialog.Header>
					<Dialog.Title class="text-center">
						GRAPHIC
						<!-- Editable image name input, same experience as in the doc list -->
					</Dialog.Title>
				</Dialog.Header>
				<div class="flex items-center justify-center py-2">
					<img
						src={imagePreviewDoc.url}
						alt={imagePreviewDoc.name}
						class="max-h-[50vh] max-w-[50vw] rounded-lg border border-slate-100 shadow-lg"
						style="object-fit: contain"
					/>
				</div>
				<Dialog.Description class="w-full flex flex-col items-center text-center">
					<div class="font-semibold text-base text-slate-800 dark:text-slate-100 mb-1">{imagePreviewDoc.name}</div>
					<!-- Show image details: type, size, upload date -->
					<div class="mt-1 flex flex-wrap justify-center gap-3 text-xs text-slate-600 dark:text-slate-400">
						<span>{imagePreviewDoc.type || imagePreviewDoc.mimeType}</span>
						<span>{Math.round(imagePreviewDoc.size / 1024)} KB</span>
						<span>{new Date(imagePreviewDoc.uploadedAt).toLocaleString()}</span>
					</div>
				</Dialog.Description>
				<Dialog.Footer>
					<Dialog.Close>
						<Button variant="outline">Close</Button>
					</Dialog.Close>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	{/if}
</div>
