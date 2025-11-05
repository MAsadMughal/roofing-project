<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import Select from '$lib/components/ui/select/select.svelte';

	import {
		ArrowLeft,
		Calendar,
		CheckSquare,
		Edit,
		Loader2,
		MapPin,
		MessageSquare,
		Plus,
		Send,
		Square,
		StickyNote,
		Tag,
		Trash2,
		User2,
		X
	} from '@lucide/svelte/icons';
	import { onMount } from 'svelte';

	const { data } = $props();

	let job = $state(data.job);
	let participants = $state(data.participants || []);
	let canEditProgress = $state(data.canEditProgress || false);
	let canManageInvoices = $state(data.canManageInvoices || false);
	let currentUser = $state(data.currentUser);

	// Sidebar toggle
	let sidebarView: 'notes' | 'feed' = $state('feed');

	// Progress
	let progress = $state(job?.progress || 0);
	let progressEditing = $state(false);
	let progressLoading = $state(false);

	// Status History / Status Edit
	let statusHistory = $state(job?.statusHistory || []);
	let showAddStatus = $state(false);
	let newStatusTitle = $state('');
	let newStatusDescription = $state('');
	let statusEditing = $state(false);
	let editingStatus = $state(job?.status || '');
	let statusEditError = $state('');
	let statusLoading = $state(false);
	let addStatusLoading = $state(false);

	// Priority
	const PRIORITY_OPTIONS = [
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' }
	];
	let priority = $state(job?.priority || 'medium');
	let priorityEditing = $state(false);
	let priorityEditError = $state('');
	let priorityLoading = $state(false);

	// Notes
	let notes = $state(job?.notes || []);
	let newNoteContent = $state('');
	let noteLoading = $state(false);

	// Feed
	let feedItems = $state(job?.feedItems || []);
	let newFeedMessage = $state('');
	let selectedTaggedUsers: string[] = $state([]);
	let feedLoading = $state(false);

	// Participants
	let participantsLoading = $state(false);
	let showManageParticipants = $state(false);
	let availableMembers: Array<{ id: string; name: string; email: string; role: string }> = $state([]);
	let selectedMemberId = $state('');
	let participantsError = $state('');

	// Todos
	let todos = $state(job?.todos || []);
	let showAddTodo = $state(false);
	let newTodoTitle = $state('');
	let newTodoDescription = $state('');
	let newTodoAssignedTo: string[] = $state([]);
	let newTodoDueDate = $state('');
	let addTodoError = $state('');
	let todoLoading = $state(false);
	let todoToggleLoading = $state<Record<string, boolean>>({});

	// Invoices
	let invoices = $state(job?.invoices || []);
	let showAddInvoice = $state(false);
	let showEditInvoice = $state(false);
	let showViewInvoice = $state(false);
	let editingInvoice: any = $state(null);
	let showDeleteInvoice = $state(false);
	let invoiceItems = $state<
		Array<{ name: string; description: string; quantity: number; unitPrice: number }>
	>([]);
	let invoiceTaxRate = $state(0);
	let invoiceDueDate = $state('');
	let invoiceNotes = $state('');
	let invoiceNumber = $state('');
	let invoiceStatus = $state('draft');

	// Edit invoice state
	let editInvoiceId: string | null = $state(null);
	let editInvoiceError = $state('');
	let invoiceLoading = $state(false);
	let deleteInvoiceLoading = $state(false);

	// Utilities
	const currency = (n: number = 0) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
	const fmtDate = (s?: string | null) =>
		s
			? new Date(s).toLocaleDateString(undefined, {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				})
			: '-';
	const fmtDateTime = (s?: string | null) =>
		s
			? new Date(s).toLocaleString(undefined, {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})
			: '-';
	const statusOptions = [
		{ label: 'Scheduled', value: 'scheduled' },
		{ label: 'In Progress', value: 'in_progress' },
		{ label: 'Pending Payment', value: 'pending_payment' },
		{ label: 'Completed/Closed', value: 'completed' },
		{ label: 'Cancelled', value: 'cancelled' }
	];

	// Status colors
	const STATUS_COLORS: Record<string, string> = {
		scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
		in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
		completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
		pending_payment: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200',
		cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
	};

	async function updateProgress() {
		if (!canEditProgress || progress < 0 || progress > 100) {
			progressEditing = false;
			return;
		}
		progressLoading = true;
		try {
			const res = await fetch(`/api/jobs/${job?.id ?? ''}/progress`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ progress })
			});
			progressEditing = false;
			if (res.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error updating progress:', error);
		} finally {
			progressLoading = false;
		}
	}

	async function updateStatus() {
		statusEditError = '';
		statusLoading = true;
		try {
			const res = await fetch(`/api/jobs/${job?.id ?? ''}/status`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: editingStatus })
			});
			if (res.ok) {
				const result = await res.json();
				job.status = editingStatus;
				statusHistory = result.statusHistory;
				statusEditing = false;
				await invalidateAll();
			} else {
				const errorData = await res.json().catch(() => ({}));
				statusEditError = errorData.error || 'Failed to update status.';
			}
		} catch (error) {
			statusEditError = 'Failed to update status.';
			console.error('Error updating status:', error);
		} finally {
			statusLoading = false;
		}
	}

	async function updatePriority() {
		priorityEditError = '';
		priorityLoading = true;
		try {
			const res = await fetch(`/api/jobs/${job?.id ?? ''}/priority`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ priority })
			});
			if (res.ok) {
				job.priority = priority;
				priorityEditing = false;
				await invalidateAll();
			} else {
				const errorData = await res.json().catch(() => ({}));
				priorityEditError = errorData.error || 'Failed to update priority.';
			}
		} catch (error) {
			priorityEditError = 'Failed to update priority.';
			console.error('Error updating priority:', error);
		} finally {
			priorityLoading = false;
		}
	}

	// Add status history
	async function addStatusHistory() {
		if (!newStatusTitle.trim()) return;
		addStatusLoading = true;
		try {
			const res = await fetch(`/api/jobs/${job?.id ?? ''}/status-history`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: newStatusTitle,
					description: newStatusDescription || null
				})
			});
			if (res.ok) {
				const newStatus = await res.json();
				statusHistory = [newStatus, ...statusHistory];
				newStatusTitle = '';
				newStatusDescription = '';
				showAddStatus = false;
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error adding status:', error);
		} finally {
			addStatusLoading = false;
		}
	}

	async function addNote() {
		if (!newNoteContent.trim()) return;
		noteLoading = true;
		try {
			const res = await fetch(`/api/jobs/${job?.id ?? ''}/notes`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: newNoteContent })
			});
			if (res.ok) {
				const newNote = await res.json();
				notes = [newNote, ...notes];
				newNoteContent = '';
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error adding note:', error);
		} finally {
			noteLoading = false;
		}
	}

	async function deleteNote(noteId: string) {
		try {
			const res = await fetch(`/api/jobs/${job?.id ?? ''}/notes?noteId=${noteId}`, {
				method: 'DELETE'
			});
			if (res.ok) {
				notes = notes.filter((n: any) => n.id !== noteId);
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error deleting note:', error);
		}
	}

	async function addFeedMessage() {
		if (!newFeedMessage.trim()) return;
		feedLoading = true;
		try {
			const res = await fetch(`/api/jobs/${job?.id ?? ''}/feed`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content: newFeedMessage,
					taggedUserIds: selectedTaggedUsers
				})
			});
			if (res.ok) {
				const newFeedItem = await res.json();
				feedItems = [newFeedItem, ...feedItems];
				newFeedMessage = '';
				selectedTaggedUsers = [];
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error adding feed message:', error);
		} finally {
			feedLoading = false;
		}
	}

	async function addTodo() {
		addTodoError = '';
		if (!newTodoTitle.trim()) {
			addTodoError = 'Please enter a todo title.';
			return;
		}
		if (!Array.isArray(participants) || participants.length === 0) {
			addTodoError = 'There are no participants for this job. Please add participants first.';
			return;
		}
		if (!newTodoAssignedTo || !Array.isArray(newTodoAssignedTo) || newTodoAssignedTo.length === 0) {
			addTodoError = 'Please assign the todo to at least one participant.';
			return;
		}
		todoLoading = true;
		try {
			const res = await fetch(`/api/jobs/${job?.id ?? ''}/todos`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: newTodoTitle,
					description: newTodoDescription || null,
					assignedToIds: newTodoAssignedTo,
					dueDate: newTodoDueDate || null
				})
			});
			if (res.ok) {
				const newTodo = await res.json();
				todos = [newTodo, ...todos];
				newTodoTitle = '';
				newTodoDescription = '';
				newTodoAssignedTo = [];
				newTodoDueDate = '';
				showAddTodo = false;
				addTodoError = '';
				await invalidateAll();
			} else {
				addTodoError = 'Failed to create todo. Please try again.';
			}
		} catch (error) {
			console.error('Error adding todo:', error);
			addTodoError = 'Error adding todo. Please check your network and try again.';
		} finally {
			todoLoading = false;
		}
	}

	async function toggleTodo(todoId: string, completed: boolean) {
		todoToggleLoading[todoId] = true;
		try {
			const res = await fetch(`/api/jobs/${job?.id ?? ''}/todos`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ todoId, completed: !completed })
			});
			if (res.ok) {
				const updated = await res.json();
				todos = todos.map((t: any) => (t.id === todoId ? updated : t));
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error updating todo:', error);
		} finally {
			todoToggleLoading[todoId] = false;
		}
	}

	// Add invoice
	async function addInvoice() {
		if (invoiceItems.length === 0) return;
		invoiceLoading = true;
		editInvoiceError = '';
		try {
			const res = await fetch(`/api/jobs/${job?.id ?? ''}/invoices`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					items: invoiceItems,
					taxRate: invoiceTaxRate,
					dueDate: invoiceDueDate || null,
					notes: invoiceNotes || null,
					invoiceNumber: invoiceNumber || null
				})
			});
			if (res.ok) {
				const newInvoice = await res.json();
				invoices = [newInvoice, ...invoices];
				invoiceItems = [];
				invoiceTaxRate = 0;
				invoiceDueDate = '';
				invoiceNotes = '';
				invoiceNumber = '';
				showAddInvoice = false;
				await invalidateAll();
			} else {
				const errorData = await res.text().catch(() => 'Failed to create invoice');
				editInvoiceError = errorData;
			}
		} catch (error) {
			console.error('Error adding invoice:', error);
			editInvoiceError = 'Failed to create invoice. Please try again.';
		} finally {
			invoiceLoading = false;
		}
	}

	// Edit invoice
	async function editInvoice() {
		if (!editingInvoice) return;
		editInvoiceError = '';
		invoiceLoading = true;
		try {
			const res = await fetch(`/api/jobs/${job?.id ?? ''}/invoices`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					invoiceId: editingInvoice.id,
					items: invoiceItems,
					taxRate: invoiceTaxRate,
					dueDate: invoiceDueDate || null,
					notes: invoiceNotes || null,
					invoiceNumber: invoiceNumber || null,
					status: invoiceStatus
				})
			});
			if (res.ok) {
				const updatedInvoice = await res.json();
				invoices = invoices.map((inv: any) =>
					inv.id === updatedInvoice.id ? updatedInvoice : inv
				);
				cancelEditInvoice();
				await invalidateAll();
			} else {
				const errorData = await res.text().catch(() => 'Failed to update invoice');
				editInvoiceError = errorData;
			}
		} catch (err) {
			editInvoiceError = 'Failed to update invoice (network or server error).';
			console.error(err);
		} finally {
			invoiceLoading = false;
		}
	}

	function startEditInvoice(inv: any) {
		// Prevent editing paid or void invoices
		if (inv.status === 'paid' || inv.status === 'void') {
			editingInvoice = inv;
			showViewInvoice = true;
			return;
		}
		editingInvoice = { ...inv };
		invoiceItems =
			inv.items?.map((item: any) => ({
				name: item.name,
				description: item.description,
				quantity: item.quantity,
				unitPrice: item.unitPrice
			})) || [];
		invoiceTaxRate = inv.taxRate;
		invoiceDueDate = inv.dueDate ? inv.dueDate.substring(0, 10) : '';
		invoiceNotes = inv.notes || '';
		invoiceNumber = inv.invoiceNumber || '';
		invoiceStatus = inv.status || 'draft';
		showEditInvoice = true;
	}

	function cancelEditInvoice() {
		editingInvoice = null;
		showEditInvoice = false;
		editInvoiceError = '';
		invoiceItems = [];
		invoiceTaxRate = 0;
		invoiceDueDate = '';
		invoiceNotes = '';
		invoiceNumber = '';
		invoiceStatus = 'draft';
	}

	async function deleteInvoice(invId: string) {
		deleteInvoiceLoading = true;
		editInvoiceError = '';
		try {
			const res = await fetch(`/api/jobs/${job?.id ?? ''}/invoices`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ invoiceId: invId })
			});
			if (res.ok) {
				invoices = invoices.filter((inv: any) => inv.id !== invId);
				showDeleteInvoice = false;
				showEditInvoice = false;
				await invalidateAll();
			} else {
				const errorData = await res.text().catch(() => 'Failed to delete invoice');
				editInvoiceError = errorData;
			}
		} catch (err) {
			console.error(err);
			editInvoiceError = 'Failed to delete invoice. Please try again.';
		} finally {
			deleteInvoiceLoading = false;
		}
	}

	// Add invoice item
	function addInvoiceItem() {
		invoiceItems = [...invoiceItems, { name: '', description: '', quantity: 1, unitPrice: 0 }];
	}

	// Remove invoice item
	function removeInvoiceItem(index: number) {
		invoiceItems = invoiceItems.filter((_, i) => i !== index);
	}

	// Calculate invoice totals
	function calculateInvoiceTotals() {
		const subtotal = invoiceItems.reduce(
			(sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
			0
		);
		const taxAmount = (subtotal * (invoiceTaxRate || 0)) / 100;
		const total = subtotal + taxAmount;
		return { subtotal, taxAmount, total };
	}

	function getParticipantName(userId: string) {
		const participant = participants.find((p: any) => p.id === userId);
		return participant ? `${participant.firstName} ${participant.lastName}` : 'Unknown';
	}
	function getParticipant(userId: string) {
		return participants.find((p: any) => p.id === userId);
	}

	async function refreshData() {
		await invalidateAll();
	}

	// Participant management functions
	async function loadParticipants() {
		if (!job?.id) return;
		try {
			const res = await fetch(`/api/jobs/${job.id}/participants`);
			if (res.ok) {
				const data = await res.json();
				participants = data;
			}
		} catch (error) {
			console.error('Error loading participants:', error);
		}
	}

	async function loadAvailableMembers() {
		try {
			const res = await fetch('/api/org/members');
			if (res.ok) {
				const members = await res.json();
				// Filter out participants who are already in the job
				const participantIds = participants.map((p: any) => p.id);
				availableMembers = members
					.filter((m: any) => !participantIds.includes(String(m.id)))
					.map((m: any) => ({
						id: String(m.id),
						name: m.name || m.email,
						email: m.email,
						role: m.role
					}));
			}
		} catch (error) {
			console.error('Error loading available members:', error);
		}
	}

	async function addParticipant() {
		if (!selectedMemberId || !job?.id) {
			participantsError = 'Please select a team member';
			return;
		}

		participantsLoading = true;
		participantsError = '';
		try {
			const res = await fetch(`/api/jobs/${job.id}/participants`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: selectedMemberId })
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({ error: 'Failed to add participant' }));
				participantsError = error.error || 'Failed to add participant';
				return;
			}

			const newParticipant = await res.json();
			participants = [...participants, newParticipant];
			selectedMemberId = '';
			await loadAvailableMembers(); // Refresh available members
			await invalidateAll();
		} catch (error) {
			console.error('Error adding participant:', error);
			participantsError = 'Failed to add participant';
		} finally {
			participantsLoading = false;
		}
	}

	async function removeParticipant(participant: any) {
		if (participant.type === 'fixed') {
			participantsError = 'Cannot remove fixed participants (Sales Rep, Owner, Estimator)';
			return;
		}

		if (!participant.participantId || !job?.id) {
			participantsError = 'Invalid participant';
			return;
		}

		participantsLoading = true;
		participantsError = '';
		try {
			const res = await fetch(`/api/jobs/${job.id}/participants`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ participantId: participant.participantId })
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({ error: 'Failed to remove participant' }));
				participantsError = error.error || 'Failed to remove participant';
				return;
			}

			participants = participants.filter((p: any) => p.id !== participant.id);
			await loadAvailableMembers(); // Refresh available members
			await invalidateAll();
		} catch (error) {
			console.error('Error removing participant:', error);
			participantsError = 'Failed to remove participant';
		} finally {
			participantsLoading = false;
		}
	}

	// Load participants on mount
	$effect(() => {
		if (job?.id) {
			loadParticipants();
		}
	});

	onMount(() => {
		const interval = setInterval(refreshData, 30000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>{job?.title || 'Job Details'}</title>
</svelte:head>

{#if !job}
	<div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
		<div class="rounded-xl bg-white px-6 py-10 text-center shadow-sm dark:bg-gray-800">
			<h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">Job Not Found</h1>
			<a href="/jobs" class="text-sky-600 transition-colors hover:underline">Back to Jobs</a>
		</div>
	</div>
{:else}
	<div class="flex flex-col gap-6 px-2 pt-2 pb-6 md:px-0">
		<!-- Header -->
		<div class="flex flex-wrap items-center justify-between gap-2 md:flex-nowrap">
			<div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
				<a
					href="/jobs"
					class="rounded text-gray-600 transition hover:text-sky-600 focus:ring-2 focus:ring-sky-400 focus:outline-none dark:text-gray-300 dark:hover:text-sky-400"
				>
					<ArrowLeft class="size-6" />
				</a>
				<div>
					<h1 class="text-2xl font-bold break-words text-gray-900 sm:text-3xl dark:text-white">
						{job.title}
					</h1>
					<div
						class="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
					>
						<span class="flex items-center gap-2">
							<User2 class="size-4" />
							{job.customer.firstName}
							{job.customer.lastName}
						</span>
						{#if job.customer.address}
							<span class="flex items-center gap-2">
								<MapPin class="size-4" />
								{job.customer.address}
							</span>
						{/if}
					</div>
					<div class="mt-2 flex items-center gap-3">
						<!-- Priority display and edit -->
						<span class="flex items-center text-xs text-gray-500 dark:text-gray-400">
							Priority:
							{#if priorityEditing}
								<div class="ml-2 flex items-center gap-2">
									<Select bind:value={priority} items={PRIORITY_OPTIONS} class="" />
									<Button
										size="sm"
										onclick={updatePriority}
										disabled={priorityLoading}
										class="rounded bg-sky-600 text-white"
									>
										{#if priorityLoading}
											<Loader2 class="mr-1 size-3 animate-spin" />
										{/if}
										Save
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => {
											priorityEditing = false;
											priority = job.priority;
										}}
										class="rounded">Cancel</Button
									>
								</div>
								{#if priorityEditError}
									<span class="ml-2 text-xs text-red-600">{priorityEditError}</span>
								{/if}
							{:else}
								<Badge
									class="ml-2 cursor-pointer px-2 py-0.5 capitalize {priority === 'high'
										? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
										: priority === 'medium'
											? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
											: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}"
									onclick={() => (priorityEditing = true)}
								>
									{priority}
									<Edit class="ml-2 size-3 opacity-60" />
								</Badge>
							{/if}
						</span>
						<!-- Status display and edit -->
						<span class="flex items-center text-xs text-gray-500 dark:text-gray-400">
							Status:
							{#if statusEditing}
								<div class="ml-2 flex items-center gap-2">
									<Select bind:value={editingStatus} items={statusOptions} />
									<Button
										size="sm"
										onclick={updateStatus}
										disabled={statusLoading}
										class="rounded bg-sky-600 text-white"
									>
										{#if statusLoading}
											<Loader2 class="mr-1 size-3 animate-spin" />
										{/if}
										Save
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => {
											statusEditing = false;
											editingStatus = job.status;
										}}
										class="rounded">Cancel</Button
									>
								</div>
								{#if statusEditError}
									<span class="ml-2 text-xs text-red-600">{statusEditError}</span>
								{/if}
							{:else}
								<Badge
									class="{STATUS_COLORS[job.status] ||
										'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'} ml-2 cursor-pointer"
									onclick={() => (statusEditing = true)}
								>
									{statusOptions.find((opt) => opt.value === job.status)?.label ||
										job.status.replace('_', ' ').toUpperCase()}
									<Edit class="ml-2 size-3 opacity-60" />
								</Badge>
							{/if}
						</span>
					</div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Main Content -->
			<div class="space-y-6 lg:col-span-2">
				<!-- Progress Bar -->
				<Card class="rounded-lg border bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Progress</h2>
						{#if canEditProgress}
							{#if progressEditing}
								<div class="flex items-center gap-2">
									<Input
										type="number"
										min="0"
										max="100"
										bind:value={progress}
										class="w-24 rounded-lg border-sky-500 focus:ring-2 focus:ring-sky-400"
									/>
									<Button
										size="sm"
										onclick={updateProgress}
										disabled={progressLoading}
										class="rounded bg-sky-600 text-white transition hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800"
									>
										{#if progressLoading}
											<Loader2 class="mr-1 size-3 animate-spin" />
										{/if}
										Save
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => (progressEditing = false)}
										class="rounded">Cancel</Button
									>
								</div>
							{:else}
								<Button
									variant="ghost"
									size="sm"
									onclick={() => (progressEditing = true)}
									class="rounded"
								>
									<Edit class="mr-1 size-4" /> Edit
								</Button>
							{/if}
						{/if}
					</div>
					<div class="space-y-2">
						<div class="flex items-center justify-between text-sm">
							<span class="text-gray-600 dark:text-gray-300">Progress</span>
							<span class="font-semibold text-gray-900 dark:text-white">{progress}%</span>
						</div>
						<div class="h-4 w-full rounded-full bg-gray-200 transition dark:bg-gray-700">
							<div
								class="h-4 rounded-full bg-gradient-to-r from-sky-400 to-sky-600 shadow-inner transition-all duration-300 dark:from-sky-600 dark:to-sky-400"
								style="width: {progress}%"
							></div>
						</div>
					</div>
				</Card>

				<!-- Status History Timeline -->
				<Card class="rounded-lg border bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Status Timeline</h2>
						<Button
							variant="outline"
							size="sm"
							onclick={() => (showAddStatus = true)}
							disabled={addStatusLoading}
							class="transition"
						>
							{#if addStatusLoading}
								<Loader2 class="mr-1 size-4 animate-spin" />
							{:else}
								<Plus class="mr-1 size-4" />
							{/if}
							Add Status
						</Button>
					</div>
					<div class="space-y-4">
						{#each statusHistory as status, index (status.id)}
							<div class="group flex items-start gap-4">
								<div class="flex flex-col items-center pt-2">
									<div
										class="h-3 w-3 rounded-full border-2 border-white bg-sky-500 duration-150 group-hover:scale-110 dark:border-gray-800"
									></div>
									{#if index < statusHistory.length - 1}
										<div class="w-0.5 grow bg-gray-200 dark:bg-gray-700"></div>
									{/if}
								</div>
								<div class="flex-1 pb-4">
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<h3 class="font-semibold text-gray-900 dark:text-white">{status.status}</h3>
											{#if status.description}
												<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
													{status.description}
												</p>
											{/if}
											<div
												class="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
											>
												<User2 class="size-3" />
												<span>
													{status.addedBy.firstName}
													{status.addedBy.lastName}
												</span>
												<span>·</span>
												<span>{fmtDateTime(status.createdAt)}</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						{/each}
						{#if statusHistory.length === 0}
							<p class="py-4 text-center text-gray-500 dark:text-gray-400">No status history yet</p>
						{/if}
					</div>
				</Card>

				<!-- Invoices -->
				<Card class="rounded-lg border bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Invoices</h2>
						{#if canManageInvoices && invoices.length === 0}
							<Button
								variant="outline"
								size="sm"
								onclick={() => (showAddInvoice = true)}
								class="transition"
							>
								<Plus class="mr-1 size-4" /> New Invoice
							</Button>
						{/if}
					</div>
					<div class="space-y-6">
						{#each invoices as invoice (invoice.id)}
							<div
								class="relative group flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-lg hover:border-sky-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-sky-400"
							>
								<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<h3 class="text-lg font-semibold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
											<span>
												{invoice.invoiceNumber || `Invoice #${invoice.id}`}
											</span>
											<Badge 
												class="text-xs px-2 py-0.5 capitalize mt-0.5
													{invoice.status === 'void' ? 'bg-red-100 text-red-700' : ''}
													{invoice.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
													{invoice.status === 'draft' ? 'bg-yellow-100 text-gray-600' : ''}
													{invoice.status === 'pending' ? 'bg-yellow-100' : ''}"
												style="font-weight: 500;"
											>
												{invoice.status}
											</Badge>
										</h3>
										{#if invoice.dueDate}
											<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
												<span class="font-medium">Due:</span> {fmtDate(invoice.dueDate)}
											</p>
										{/if}
									</div>
									<div class="shrink-0 flex items-center gap-2 text-right mt-3 sm:mt-0">
										<span class="block text-2xl font-bold text-green-600 dark:text-green-300">{currency(invoice.totalAmount)}</span>
										{#if canManageInvoices}
											{#if invoice.status !== 'paid' && invoice.status !== 'void'}
												<Button
													variant="ghost"
													size="icon"
													onclick={() => startEditInvoice(invoice)}
													aria-label="Edit Invoice"
													class="rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-900"
												>
													<Edit class="size-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onclick={() => {
														editingInvoice = invoice;
														showDeleteInvoice = true;
													}}
													aria-label="Delete Invoice"
													class="rounded-full text-red-600 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-900"
												>
													<Trash2 class="size-4" />
												</Button>
											{:else}
												<Button
													variant="ghost"
													size="icon"
													onclick={() => {
														editingInvoice = invoice;
														showViewInvoice = true;
													}}
													aria-label="View Invoice"
													class="rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
												>
													<Edit class="size-4" />
												</Button>
											{/if}
										{/if}
									</div>
								</div>

								{#if invoice.items && invoice.items.length > 0}
									<div class="divide-y divide-gray-200 dark:divide-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 mt-2">
										{#each invoice.items as item (item.id)}
											<div class="flex justify-between items-center px-3 py-2 text-sm">
												<div class="truncate text-gray-900 dark:text-white">
													<span class="font-medium">{item.name}</span>
													<span class="pl-2 text-gray-500 dark:text-gray-400">× {item.quantity}</span>
												</div>
												<div class="text-right text-gray-700 dark:text-gray-200 font-medium">{currency(item.total)}</div>
											</div>
										{/each}
									</div>
								{/if}

								<div class="flex flex-col gap-1 pt-2">
									<div class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
										<span class="font-medium">Subtotal</span>
										<span>{currency(invoice.subtotal)}</span>
									</div>
									{#if invoice.taxAmount > 0}
										<div class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
											<span class="font-medium">Tax ({invoice.taxRate}%)</span>
											<span>{currency(invoice.taxAmount)}</span>
										</div>
									{/if}
								</div>
								
								{#if invoice.payments && invoice.payments.length > 0}
									<div class="mt-2 border-t border-gray-200 pt-3 dark:border-gray-700">
										<p class="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wide">
											Payments
										</p>
										<div class="space-y-1">
											{#each invoice.payments as payment (payment.id)}
												<div class="flex justify-between text-xs items-center">
													<span class="text-green-700 dark:text-green-400 font-medium">{currency(payment.amount)}</span>
													<span class="text-slate-700 dark:text-slate-300">{payment.method || 'N/A'}</span>
													<span class="text-gray-400 dark:text-gray-500">{fmtDate(payment.paidAt)}</span>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/each}
						{#if invoices.length === 0}
							<div class="flex flex-col items-center justify-center py-10 opacity-70">
								<span class="text-4xl mb-2">🧾</span>
								<div class="text-base text-gray-500 dark:text-gray-400">No invoices found for this job.</div>
							</div>
						{/if}
					</div>
				</Card>
			</div>

			<!-- Sidebar -->
			<div class="space-y-6 lg:col-span-1">
				<!-- Toggle between Notes and Feed -->
				<div class="flex gap-2 border-b border-gray-200 dark:border-gray-700">
					<Button
						variant={sidebarView === 'feed' ? 'default' : 'ghost'}
						size="sm"
						class="flex-1 rounded-t-md transition"
						onclick={() => (sidebarView = 'feed')}
					>
						<MessageSquare class="mr-1 size-4" /> Feed
					</Button>
					<Button
						variant={sidebarView === 'notes' ? 'default' : 'ghost'}
						size="sm"
						class="flex-1 rounded-t-md transition"
						onclick={() => (sidebarView = 'notes')}
					>
						<StickyNote class="mr-1 size-4" /> Notes
					</Button>
				</div>

				{#if sidebarView === 'notes'}
					<!-- Notes -->
					<Card class="rounded-lg border bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
						<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Notes</h2>
						<div class="mb-4 max-h-80 space-y-4 overflow-y-auto pr-2">
							{#each notes as note (note.id)}
								<div
									class="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
								>
									<p class="text-sm text-gray-900 dark:text-white">{note.content}</p>
									<div
										class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
									>
										<span>
											{note.createdBy.firstName}
											{note.createdBy.lastName} · {fmtDateTime(note.createdAt)}
										</span>
										{#if note.createdBy.id === currentUser.id}
											<Button
												variant="ghost"
												size="sm"
												onclick={() => deleteNote(note.id)}
												class="rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-800"
												aria-label="Delete note"
											>
												<Trash2 class="size-3" />
											</Button>
										{/if}
									</div>
								</div>
							{/each}
							{#if notes.length === 0}
								<p class="py-4 text-center text-gray-500 dark:text-gray-400">No notes yet</p>
							{/if}
						</div>
						<div class="mt-2 flex items-center gap-2">
							<Input
								placeholder="Add a note..."
								bind:value={newNoteContent}
								onkeydown={(e) => e.key === 'Enter' && addNote()}
								class="rounded-lg"
							/>
							<Button
								onclick={addNote}
								disabled={noteLoading}
								class="rounded-lg bg-sky-600 text-white shadow-sm transition hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800"
								aria-label="Add note"
							>
								{#if noteLoading}
									<Loader2 class="size-4 animate-spin" />
								{:else}
									<Send class="size-4" />
								{/if}
							</Button>
						</div>
					</Card>
				{:else}
					<!-- Feed -->
					<Card class="rounded-lg border bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
						<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Project Feed</h2>

						<!-- Participants -->
						<div class="mb-4 border-b border-gray-200 pb-4 dark:border-gray-700">
							<div class="mb-2 flex items-center justify-between">
								<h3 class="text-sm font-semibold text-gray-900 dark:text-white">Participants</h3>
								{#if currentUser?.role === 'OWNER'}
									<Button
										variant="outline"
										size="sm"
										onclick={() => {
											showManageParticipants = true;
											loadAvailableMembers();
										}}
										class="rounded"
									>
										<Edit class="size-4 mr-1" />
										Manage
									</Button>
								{/if}
							</div>
							<div class="flex flex-wrap gap-2">
								{#if participants && participants.length > 0}
									{#each participants as participant (participant.id)}
										<Badge
											class="rounded {participant.type === 'fixed'
												? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
												: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'}"
										>
											{participant.firstName} {participant.lastName}
											<span class="ml-1 text-xs"
												>({participant.role})</span
											>
											{#if participant.type === 'fixed'}
												<span class="ml-1 text-xs opacity-70">• Fixed</span>
											{/if}
										</Badge>
									{/each}
								{:else}
									<p class="text-sm text-gray-500 dark:text-gray-400">No participants yet</p>
								{/if}
							</div>
						</div>

						<!-- Feed Messages -->
						<div class="mb-4 max-h-[400px] space-y-4 overflow-y-auto pr-2 sm:max-h-[600px]">
							{#each feedItems as item (item.id)}
								<div
									class="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
								>
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<div class="mb-1 flex items-center gap-2">
												<span class="text-sm font-semibold text-gray-900 dark:text-white">
													{item.createdBy.firstName}
													{item.createdBy.lastName}
												</span>
												<span class="text-xs text-gray-500 dark:text-gray-400"
													>{fmtDateTime(item.createdAt)}</span
												>
											</div>
											{#if item.content}
												<p class="text-sm text-gray-700 dark:text-gray-200">{item.content}</p>
											{/if}
											{#if item.taggedUserIds && item.taggedUserIds.length > 0}
												<div class="mt-2 flex flex-wrap gap-1">
													{#each item.taggedUserIds as userId}
														<Badge
															class="rounded bg-purple-100 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-200"
														>
															<Tag class="mr-1 size-3" /> @{getParticipantName(userId)}
														</Badge>
													{/each}
												</div>
											{/if}
											{#if item.type === 'todo_created' || item.type === 'todo_completed'}
												<div class="mt-2 text-xs text-green-600 dark:text-green-300">
													{item.type === 'todo_created' ? '✓ Todo created' : '✓ Todo completed'}
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
							{#if feedItems.length === 0}
								<p class="py-4 text-center text-gray-500 dark:text-gray-400">No feed items yet</p>
							{/if}
						</div>

						<!-- Add Message -->
						<div class="space-y-2">
							<div class="mb-2 flex flex-wrap gap-2">
								{#each participants as participant (participant.id)}
									<Button
										variant={selectedTaggedUsers.includes(participant.id) ? 'default' : 'outline'}
										size="sm"
										onclick={() => {
											if (selectedTaggedUsers.includes(participant.id)) {
												selectedTaggedUsers = selectedTaggedUsers.filter(
													(id) => id !== participant.id
												);
											} else {
												selectedTaggedUsers = [...selectedTaggedUsers, participant.id];
											}
										}}
										class="rounded transition"
									>
										<Tag class="mr-1 size-3" />
										{participant.firstName}
									</Button>
								{/each}
							</div>
							<div class="flex items-center gap-2">
								<Input
									placeholder="Type a message..."
									bind:value={newFeedMessage}
									onkeydown={(e) => e.key === 'Enter' && addFeedMessage()}
									class="rounded-lg"
								/>
								<Button
									onclick={addFeedMessage}
									disabled={feedLoading}
									class="rounded-lg bg-sky-600 text-white shadow-sm transition hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800"
									aria-label="Send feed message"
								>
									{#if feedLoading}
										<Loader2 class="size-4 animate-spin" />
									{:else}
										<Send class="size-4" />
									{/if}
								</Button>
							</div>
						</div>
					</Card>
				{/if}

				<!-- Todos -->
				<Card class="rounded-lg border bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Todos</h2>
						<Button
							variant="outline"
							size="sm"
							onclick={() => (showAddTodo = true)}
							class="transition"
						>
							<Plus class="mr-1 size-4" /> Add Todo
						</Button>
					</div>
					<div class="max-h-[320px] space-y-3 overflow-y-auto pr-2 sm:max-h-[400px]">
						{#each todos as todo (todo.id)}
							<div
								class="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
							>
								<div class="flex items-start gap-3">
									<Button
										variant="ghost"
										size="sm"
										onclick={() => toggleTodo(todo.id, todo.completed)}
										disabled={todoToggleLoading[todo.id]}
										class="rounded-full transition hover:bg-green-100 dark:hover:bg-green-800"
										aria-label="Toggle todo"
									>
										{#if todoToggleLoading[todo.id]}
											<Loader2 class="size-4 animate-spin text-gray-400 dark:text-gray-600" />
										{:else if todo.completed}
											<CheckSquare class="size-4 text-green-600 dark:text-green-400" />
										{:else}
											<Square class="size-4 text-gray-400 dark:text-gray-600" />
										{/if}
									</Button>
									<div class="flex-1">
										<h3
											class="font-semibold {todo.completed
												? 'text-gray-400 line-through dark:text-gray-500'
												: 'text-gray-900 dark:text-white'}"
										>
											{todo.title}
										</h3>
										{#if todo.description}
											<p class="text-sm text-gray-600 dark:text-gray-400">{todo.description}</p>
										{/if}
										<div class="mt-2 flex flex-wrap gap-2">
											{#each todo.assignedToIds as userId}
												<Badge
													class="bg-gray-100 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200"
												>
													{getParticipantName(userId)}
												</Badge>
											{/each}
											{#if todo.dueDate}
												<Badge
													class="bg-orange-100 text-xs text-orange-700 dark:bg-orange-900 dark:text-orange-300"
												>
													<Calendar class="mr-1 size-3" /> Due: {fmtDate(todo.dueDate)}
												</Badge>
											{/if}
										</div>
										{#if todo.completed && todo.completedBy}
											<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
												Completed by {todo.completedBy.firstName}
												{todo.completedBy.lastName} on {fmtDate(todo.completedAt)}
											</p>
										{/if}
									</div>
								</div>
							</div>
						{/each}
						{#if todos.length === 0}
							<p class="py-4 text-center text-gray-500 dark:text-gray-400">No todos yet</p>
						{/if}
					</div>
				</Card>
			</div>
		</div>
	</div>

	<!-- Add Status Dialog -->
	<Dialog.Root bind:open={showAddStatus}>
		<Dialog.Content
			class="max-w-md rounded-xl border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
		>
			<Dialog.Header>
				<Dialog.Title class="text-xl text-gray-900 dark:text-white">Add Status</Dialog.Title>
			</Dialog.Header>
			<div class="space-y-4">
				<div>
					<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
						>Status Title</label
					>
					<Input
						bind:value={newStatusTitle}
						placeholder="e.g., Materials Ordered"
						class="rounded-lg"
					/>
				</div>
				<div>
					<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
						>Description</label
					>
					<Input
						bind:value={newStatusDescription}
						placeholder="Optional description"
						class="rounded-lg"
					/>
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (showAddStatus = false)} class="rounded"
					>Cancel</Button
				>
				<Button
					onclick={addStatusHistory}
					disabled={addStatusLoading}
					class="rounded bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800"
				>
					{#if addStatusLoading}
						<Loader2 class="mr-1 size-4 animate-spin" />
					{/if}
					Add Status
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Add/Edit Todo Dialog - unchanged -->
	<Dialog.Root bind:open={showAddTodo}>
		<Dialog.Content
			class="max-w-md rounded-xl border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
		>
			<Dialog.Header>
				<Dialog.Title class="text-xl text-gray-900 dark:text-white">Add Todo</Dialog.Title>
			</Dialog.Header>
			<div class="space-y-4">
				<div>
					<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
						>Title</label
					>
					<Input bind:value={newTodoTitle} placeholder="Todo title" class="rounded-lg" />
				</div>
				<div>
					<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
						>Description</label
					>
					<Input
						bind:value={newTodoDescription}
						placeholder="Optional description"
						class="rounded-lg"
					/>
				</div>
				<div>
					<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
						>Assign To</label
					>
					{#if !participants || participants.length === 0}
						<p class="py-2 text-sm text-gray-500 dark:text-gray-400">
							No participants found. Please add participants first.
						</p>
					{:else}
						<div class="flex flex-wrap gap-2">
							{#each participants as participant (participant.id)}
								<Button
									variant={newTodoAssignedTo.includes(participant.id) ? 'default' : 'outline'}
									size="sm"
									onclick={() => {
										if (newTodoAssignedTo.includes(participant.id)) {
											newTodoAssignedTo = newTodoAssignedTo.filter((id) => id !== participant.id);
										} else {
											newTodoAssignedTo = [...newTodoAssignedTo, participant.id];
										}
									}}
									class="rounded transition"
								>
									{participant.firstName}
									{participant.lastName}
								</Button>
							{/each}
						</div>
					{/if}
				</div>
				<div>
					<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
						>Due Date</label
					>
					<Input type="date" bind:value={newTodoDueDate} class="rounded-lg" />
				</div>
				{#if addTodoError}
					<p class="text-sm text-red-600 dark:text-red-400">{addTodoError}</p>
				{/if}
			</div>
			<Dialog.Footer>
				<Button
					variant="outline"
					onclick={() => {
						showAddTodo = false;
						addTodoError = '';
					}}
					class="rounded">Cancel</Button
				>
				<Button
					onclick={addTodo}
					disabled={!participants || participants.length === 0 || todoLoading}
					class="rounded bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800"
				>
					{#if todoLoading}
						<Loader2 class="mr-1 size-4 animate-spin" />
					{/if}
					Add Todo
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Add Invoice Dialog -->
	<Dialog.Root bind:open={showAddInvoice}>
		<Dialog.Content
			class="max-w-3xl rounded-xl border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
		>
			<Dialog.Header>
				<Dialog.Title class="text-xl text-gray-900 dark:text-white">Create Invoice</Dialog.Title>
			</Dialog.Header>
			<div class="space-y-4">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
							>Invoice Number</label
						>
						<Input bind:value={invoiceNumber} placeholder="Optional" class="rounded-lg" />
					</div>
					<div>
						<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
							>Due Date</label
						>
						<Input type="date" bind:value={invoiceDueDate} class="rounded-lg" />
					</div>
				</div>
				<div>
					<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
						>Tax Rate (%)</label
					>
					<Input type="number" step="0.01" bind:value={invoiceTaxRate} class="rounded-lg" />
				</div>
				<div>
					<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
						>Notes</label
					>
					<Input bind:value={invoiceNotes} placeholder="Optional notes" class="rounded-lg" />
				</div>
				<div>
					<div class="mb-2 flex items-center justify-between">
						<label for="b" class="text-sm font-medium text-gray-900 dark:text-gray-200">Items</label
						>
						<Button variant="outline" size="sm" onclick={addInvoiceItem} class="rounded">
							<Plus class="mr-1 size-4" /> Add Item
						</Button>
					</div>
					<div class="space-y-2">
						{#each invoiceItems as item, index (index)}
							<div class="grid grid-cols-12 items-end gap-2">
								<div class="col-span-12 sm:col-span-4">
									<Input bind:value={item.name} placeholder="Item name" class="rounded-lg" />
								</div>
								<div class="col-span-12 sm:col-span-3">
									<Input
										bind:value={item.description}
										placeholder="Description"
										class="rounded-lg"
									/>
								</div>
								<div class="col-span-6 sm:col-span-2">
									<Input
										type="number"
										step="0.01"
										bind:value={item.quantity}
										placeholder="Qty"
										class="rounded-lg"
									/>
								</div>
								<div class="col-span-6 sm:col-span-2">
									<Input
										type="number"
										step="0.01"
										bind:value={item.unitPrice}
										placeholder="Price"
										class="rounded-lg"
									/>
								</div>
								<div class="col-span-12 flex justify-end sm:col-span-1">
									<Button
										variant="ghost"
										size="sm"
										onclick={() => removeInvoiceItem(index)}
										class="rounded-full transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-800"
										aria-label="Remove Item"
									>
										<X class="size-4" />
									</Button>
								</div>
							</div>
						{/each}
					</div>
				</div>
				{#if invoiceItems.length > 0}
					{@const totals = calculateInvoiceTotals()}
					<div class="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
						<div class="flex justify-between text-gray-700 dark:text-gray-300">
							<span>Subtotal:</span>
							<span>{currency(totals.subtotal)}</span>
						</div>
						<div class="flex justify-between text-gray-700 dark:text-gray-300">
							<span>Tax ({invoiceTaxRate}%):</span>
							<span>{currency(totals.taxAmount)}</span>
						</div>
						<div class="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
							<span>Total:</span>
							<span>{currency(totals.total)}</span>
						</div>
					</div>
				{/if}
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (showAddInvoice = false)} class="rounded"
					>Cancel</Button
				>
				<Button
					onclick={addInvoice}
					disabled={invoiceLoading}
					class="rounded bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800"
				>
					{#if invoiceLoading}
						<Loader2 class="mr-1 size-4 animate-spin" />
					{/if}
					Create Invoice
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Edit Invoice Dialog -->
	<Dialog.Root bind:open={showEditInvoice}>
		<Dialog.Content
			class="flex max-w-3xl flex-col rounded-xl border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
			style="max-height:80vh; height:auto;"
		>
			<Dialog.Header
				class="sticky top-0 z-20 rounded-t-xl border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
			>
				<Dialog.Title class="text-xl text-gray-900 dark:text-white">Edit Invoice</Dialog.Title>
			</Dialog.Header>
			<div class="flex-1 overflow-y-auto px-0" style="min-height:0;">
				<div class="space-y-4 p-6">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
								>Invoice Number</label
							>
							<Input bind:value={invoiceNumber} placeholder="Optional" class="rounded-lg" />
						</div>
						<div>
							<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
								>Due Date</label
							>
							<Input type="date" bind:value={invoiceDueDate} class="rounded-lg" />
						</div>
					</div>
					<div>
						<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
							>Status</label
						>
						<Select
							bind:value={invoiceStatus}
							items={[
								{ value: 'draft', label: 'Draft' },
								{ value: 'sent', label: 'Sent' },
								{ value: 'paid', label: 'Paid' },
								{ value: 'overdue', label: 'Overdue' },
								{ value: 'void', label: 'Void' }
							]}
							class="w-full"
						/>
						{#if invoiceStatus === 'paid' && editingInvoice && editingInvoice.status !== 'paid'}
							<div
								class="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20"
							>
								<p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
									⚠️ Warning: Changing invoice status to "Paid" will automatically close the job
									status to "Completed".
								</p>
							</div>
						{/if}
					</div>
					<div>
						<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
							>Tax Rate (%)</label
						>
						<Input type="number" step="0.01" bind:value={invoiceTaxRate} class="rounded-lg" />
					</div>
					<div>
						<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
							>Notes</label
						>
						<Input bind:value={invoiceNotes} placeholder="Optional notes" class="rounded-lg" />
					</div>
					<div>
						<div class="mb-2 flex items-center justify-between">
							<label for="b" class="text-sm font-medium text-gray-900 dark:text-gray-200"
								>Items</label
							>
							<Button variant="outline" size="sm" onclick={addInvoiceItem} class="rounded">
								<Plus class="mr-1 size-4" /> Add Item
							</Button>
						</div>
						<div class="space-y-2">
							{#each invoiceItems as item, index (index)}
								<div class="grid grid-cols-12 items-end gap-2">
									<div class="col-span-12 sm:col-span-4">
										<Input bind:value={item.name} placeholder="Item name" class="rounded-lg" />
									</div>
									<div class="col-span-12 sm:col-span-3">
										<Input
											bind:value={item.description}
											placeholder="Description"
											class="rounded-lg"
										/>
									</div>
									<div class="col-span-6 sm:col-span-2">
										<Input
											type="number"
											step="0.01"
											bind:value={item.quantity}
											placeholder="Qty"
											class="rounded-lg"
										/>
									</div>
									<div class="col-span-6 sm:col-span-2">
										<Input
											type="number"
											step="0.01"
											bind:value={item.unitPrice}
											placeholder="Price"
											class="rounded-lg"
										/>
									</div>
									<div class="col-span-12 flex justify-end sm:col-span-1">
										<Button
											variant="ghost"
											size="sm"
											onclick={() => removeInvoiceItem(index)}
											class="rounded-full transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-800"
											aria-label="Remove Item"
										>
											<X class="size-4" />
										</Button>
									</div>
								</div>
							{/each}
						</div>
					</div>
					{#if invoiceItems.length > 0}
						{@const totals = calculateInvoiceTotals()}
						<div class="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
							<div class="flex justify-between text-gray-700 dark:text-gray-300">
								<span>Subtotal:</span>
								<span>{currency(totals.subtotal)}</span>
							</div>
							<div class="flex justify-between text-gray-700 dark:text-gray-300">
								<span>Tax ({invoiceTaxRate}%):</span>
								<span>{currency(totals.taxAmount)}</span>
							</div>
							<div class="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
								<span>Total:</span>
								<span>{currency(totals.total)}</span>
							</div>
						</div>
					{/if}
					{#if editInvoiceError}
						<p class="text-sm text-red-600 dark:text-red-400">{editInvoiceError}</p>
					{/if}
				</div>
			</div>
			<Dialog.Footer
				class="z-20  w-full rounded-b-xl border-t border-gray-200 bg-white px-2 dark:border-gray-700 dark:bg-gray-800"
			>
				<Button variant="outline" onclick={cancelEditInvoice} class="rounded">Cancel</Button>
				<Button
					onclick={editInvoice}
					disabled={invoiceLoading}
					class="rounded bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800"
				>
					{#if invoiceLoading}
						<Loader2 class="mr-1 size-4 animate-spin" />
					{/if}
					Save Changes
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
	<!-- Delete Invoice Confirmation Dialog -->
	<Dialog.Root bind:open={showDeleteInvoice}>
		<Dialog.Content
			class="max-w-md rounded-xl border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
		>
			<Dialog.Header>
				<Dialog.Title class="text-xl text-red-700 dark:text-red-400"
					>Confirm Delete Invoice</Dialog.Title
				>
			</Dialog.Header>
			<div class="py-4">
				<p class="mb-2 text-gray-800 dark:text-gray-200">
					Are you sure you want to delete invoice <b
						>{editingInvoice?.invoiceNumber || `#${editingInvoice?.id}`}</b
					>?
				</p>
				<p class="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone.</p>
			</div>
			<Dialog.Footer>
				<Button
					variant="outline"
					onclick={() => {
						showDeleteInvoice = false;
						editingInvoice = null;
					}}
					class="rounded">Cancel</Button
				>
				<Button
					onclick={() => {
						if (editingInvoice) deleteInvoice(editingInvoice.id);
					}}
					disabled={deleteInvoiceLoading}
					class="rounded bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
				>
					{#if deleteInvoiceLoading}
						<Loader2 class="mr-1 size-4 animate-spin" />
					{/if}
					Delete
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!-- View Invoice Dialog (Read-only for paid/void invoices) -->
	<Dialog.Root bind:open={showViewInvoice}>
		<Dialog.Content
			class="max-w-3xl rounded-xl border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
		>
			<Dialog.Header>
				<Dialog.Title class="text-xl text-gray-900 dark:text-white">Invoice Details</Dialog.Title>
			</Dialog.Header>
			{#if editingInvoice}
				<div class="space-y-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
								>Invoice Number</label
							>
							<p class="text-gray-700 dark:text-gray-300">
								{editingInvoice.invoiceNumber || 'N/A'}
							</p>
						</div>
						<div>
							<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
								>Status</label
							>
							<Badge class="capitalize">{editingInvoice.status}</Badge>
						</div>
						<div>
							<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
								>Due Date</label
							>
							<p class="text-gray-700 dark:text-gray-300">
								{editingInvoice.dueDate ? fmtDate(editingInvoice.dueDate) : 'N/A'}
							</p>
						</div>
						<div>
							<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
								>Tax Rate</label
							>
							<p class="text-gray-700 dark:text-gray-300">{editingInvoice.taxRate || 0}%</p>
						</div>
					</div>
					{#if editingInvoice.notes}
						<div>
							<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
								>Notes</label
							>
							<p class="text-gray-700 dark:text-gray-300">{editingInvoice.notes}</p>
						</div>
					{/if}
					<div>
						<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
							>Items</label
						>
						<div class="space-y-2 overflow-y-auto max-h-[100px] rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
							{#if editingInvoice.items && editingInvoice.items.length > 0}
								{#each editingInvoice.items as item}
									<div
										class="flex items-center justify-between border-b border-gray-200 py-2 last:border-0 dark:border-gray-700"
									>
										<div class="flex-1">
											<p class="font-medium text-gray-900 dark:text-white">{item.name}</p>
											{#if item.description}
												<p class="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
											{/if}
											<p class="text-sm text-gray-500 dark:text-gray-500">
												Qty: {item.quantity} × {currency(item.unitPrice)}
											</p>
										</div>
										<p class="font-semibold text-gray-900 dark:text-white">
											{currency(item.total)}
										</p>
									</div>
								{/each}
							{:else}
								<p class="py-4 text-center text-gray-500 dark:text-gray-400">No items</p>
							{/if}
						</div>
					</div>
					<div class="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
						<div class="flex justify-between text-gray-700 dark:text-gray-300">
							<span>Subtotal:</span>
							<span>{currency(editingInvoice.subtotal || 0)}</span>
						</div>
						{#if editingInvoice.taxAmount > 0}
							<div class="flex justify-between text-gray-700 dark:text-gray-300">
								<span>Tax ({editingInvoice.taxRate || 0}%):</span>
								<span>{currency(editingInvoice.taxAmount || 0)}</span>
							</div>
						{/if}
						<div
							class="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold text-gray-900 dark:border-gray-700 dark:text-white"
						>
							<span>Total:</span>
							<span>{currency(editingInvoice.totalAmount || 0)}</span>
						</div>
					</div>
					{#if editingInvoice.payments && editingInvoice.payments.length > 0}
						<div>
							<label for="b" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200"
								>Payments</label
							>
							<div class="space-y-2">
								{#each editingInvoice.payments as payment}
									<div
										class="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/20"
									>
										<div>
											<p class="text-sm font-medium text-green-700 dark:text-green-300">
												{currency(payment.amount)}
											</p>
											<p class="text-xs text-gray-500 dark:text-gray-400">
												Method: {payment.method || 'N/A'} • {fmtDate(payment.paidAt)}
											</p>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
			<Dialog.Footer>
				<Button
					variant="outline"
					onclick={() => {
						showViewInvoice = false;
						editingInvoice = null;
					}}
					class="rounded">Close</Button
				>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
	
	<!-- Manage Participants Dialog -->
	<Dialog.Root bind:open={showManageParticipants}>
		<Dialog.Content class="max-w-2xl rounded-xl border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
			<Dialog.Header>
				<Dialog.Title class="text-xl text-gray-900 dark:text-white">Manage Participants</Dialog.Title>
			</Dialog.Header>
			<div class="space-y-4">
				<!-- Current Participants -->
				<div>
					<h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Current Participants</h3>
					<div class="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
						{#if participants && participants.length > 0}
							{#each participants as participant (participant.id)}
								<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
									<div class="flex items-center gap-3">
										<div class="flex size-10 items-center justify-center rounded-full {participant.type === 'fixed'
											? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
											: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'}">
											<User2 class="size-5" />
										</div>
										<div>
											<p class="font-medium text-gray-900 dark:text-white">
												{participant.firstName} {participant.lastName}
											</p>
											<p class="text-sm text-gray-500 dark:text-gray-400">
												{participant.email} • {participant.role}
												{#if participant.type === 'fixed'}
													<span class="ml-1 text-xs text-blue-600 dark:text-blue-400">(Fixed)</span>
												{/if}
											</p>
										</div>
									</div>
									{#if participant.type !== 'fixed'}
										<Button
											variant="ghost"
											size="sm"
											onclick={() => removeParticipant(participant)}
											disabled={participantsLoading}
											class="rounded-full text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900"
										>
											<Trash2 class="size-4" />
										</Button>
									{/if}
								</div>
							{/each}
						{:else}
							<p class="text-center text-sm text-gray-500 dark:text-gray-400">No participants yet</p>
						{/if}
					</div>
				</div>

				<!-- Add Participant -->
				<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
					<h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Add Crew Member</h3>
					<div class="space-y-3">
						<div>
							<label for="participant-select" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-200">Select Team Member</label>
							<Select
								id="participant-select"
								bind:value={selectedMemberId}
								items={availableMembers.map((m) => ({
									value: m.id,
									label: `${m.name} (${m.role})`
								}))}
								placeholder="Choose a team member..."
								class="w-full"
							/>
						</div>
						{#if participantsError}
							<p class="text-sm text-red-600 dark:text-red-400">{participantsError}</p>
						{/if}
					</div>
				</div>
			</div>
			<Dialog.Footer>
				<Button
					variant="outline"
					onclick={() => {
						showManageParticipants = false;
						selectedMemberId = '';
						participantsError = '';
					}}
					class="rounded"
				>
					Close
				</Button>
				<Button
					onclick={addParticipant}
					disabled={participantsLoading || !selectedMemberId}
					class="rounded bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800"
				>
					{#if participantsLoading}
						<Loader2 class="mr-1 size-4 animate-spin" />
					{/if}
					<Plus class="mr-1 size-4" />
					Add Participant
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
