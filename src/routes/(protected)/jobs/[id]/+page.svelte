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

	// Status History / Status Edit
	let statusHistory = $state(job?.statusHistory || []);
	let showAddStatus = $state(false);
	let newStatusTitle = $state('');
	let newStatusDescription = $state('');
	let statusEditing = $state(false);
	let editingStatus = $state(job?.status || '');
	let statusEditError = $state('');

	// Priority
	const PRIORITY_OPTIONS = [
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' }
	];
	let priority = $state(job?.priority || 'medium');
	let priorityEditing = $state(false);
	let priorityEditError = $state('');

	// Notes
	let notes = $state(job?.notes || []);
	let newNoteContent = $state('');

	// Feed
	let feedItems = $state(job?.feedItems || []);
	let newFeedMessage = $state('');
	let selectedTaggedUsers: string[] = $state([]);

	// Todos
	let todos = $state(job?.todos || []);
	let showAddTodo = $state(false);
	let newTodoTitle = $state('');
	let newTodoDescription = $state('');
	let newTodoAssignedTo: string[] = $state([]);
	let newTodoDueDate = $state('');
	let addTodoError = $state('');

	// Invoices
	let invoices = $state(job?.invoices || []);
	let showAddInvoice = $state(false);
	let showEditInvoice = $state(false);
	let editingInvoice: any = $state(null);
	let showDeleteInvoice = $state(false);
	let invoiceItems = $state<Array<{ name: string; description: string; quantity: number; unitPrice: number }>>([]);
	let invoiceTaxRate = $state(0);
	let invoiceDueDate = $state('');
	let invoiceNotes = $state('');
	let invoiceNumber = $state('');

	// Edit invoice state
	let editInvoiceId: string | null = $state(null);
	let editInvoiceError = $state('');

	// Utilities
	const currency = (n: number = 0) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
	const fmtDate = (s?: string | null) =>
		s ? new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
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
		try {
			const res = await fetch(`/api/jobs/${job.id}/progress`, {
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
		}
	}

	async function updateStatus() {
		statusEditError = '';
		try {
			const res = await fetch(`/api/jobs/${job.id}/status`, {
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
				statusEditError = 'Failed to update status.';
			}
		} catch (error) {
			statusEditError = 'Failed to update status.';
			console.error('Error updating status:', error);
		}
	}

	async function updatePriority() {
		priorityEditError = '';
		try {
			const res = await fetch(`/api/jobs/${job.id}/priority`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ priority })
			});
			if (res.ok) {
				job.priority = priority;
				priorityEditing = false;
				await invalidateAll();
			} else {
				priorityEditError = 'Failed to update priority.';
			}
		} catch (error) {
			priorityEditError = 'Failed to update priority.';
			console.error('Error updating priority:', error);
		}
	}

	// Add status history
	async function addStatusHistory() {
		if (!newStatusTitle.trim()) return;
		try {
			const res = await fetch(`/api/jobs/${job.id}/status-history`, {
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
		}
	}

	async function addNote() {
		if (!newNoteContent.trim()) return;
		try {
			const res = await fetch(`/api/jobs/${job.id}/notes`, {
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
		}
	}

	async function deleteNote(noteId: string) {
		try {
			const res = await fetch(`/api/jobs/${job.id}/notes?noteId=${noteId}`, { method: 'DELETE' });
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
		try {
			const res = await fetch(`/api/jobs/${job.id}/feed`, {
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
		try {
			const res = await fetch(`/api/jobs/${job.id}/todos`, {
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
		}
	}

	async function toggleTodo(todoId: string, completed: boolean) {
		try {
			const res = await fetch(`/api/jobs/${job.id}/todos`, {
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
		}
	}

	// Add invoice
	async function addInvoice() {
		if (invoiceItems.length === 0) return;
		try {
			const res = await fetch(`/api/jobs/${job.id}/invoices`, {
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
			}
		} catch (error) {
			console.error('Error adding invoice:', error);
		}
	}

	// Edit invoice
	async function editInvoice() {
		if (!editingInvoice) return;
		editInvoiceError = '';
		try {
			const res = await fetch(`/api/jobs/${job.id}/invoices/${editingInvoice.id}`, {
				method: 'PUT',
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
				const updatedInvoice = await res.json();
				invoices = invoices.map((inv: any) => inv.id === updatedInvoice.id ? updatedInvoice : inv);
				cancelEditInvoice();
				await invalidateAll();
			} else {
				editInvoiceError = 'Failed to update invoice.';
			}
		} catch (err) {
			editInvoiceError = 'Failed to update invoice (network or server error).';
			console.error(err);
		}
	}

	function startEditInvoice(inv: any) {
		editingInvoice = { ...inv };
		invoiceItems = inv.items?.map((item: any) => ({
			name: item.name,
			description: item.description,
			quantity: item.quantity,
			unitPrice: item.unitPrice
		})) || [];
		invoiceTaxRate = inv.taxRate;
		invoiceDueDate = inv.dueDate ? inv.dueDate.substring(0, 10) : '';
		invoiceNotes = inv.notes || '';
		invoiceNumber = inv.invoiceNumber || '';
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
	}

	async function deleteInvoice(invId: string) {
		try {
			const res = await fetch(`/api/jobs/${job.id}/invoices/${invId}`, {
				method: 'DELETE'
			});
			if (res.ok) {
				invoices = invoices.filter((inv: any) => inv.id !== invId);
				showDeleteInvoice = false;
				showEditInvoice = false;
				await invalidateAll();
			}
		} catch (err) {
			console.error(err);
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
		const subtotal = invoiceItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
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

	onMount(() => {
		const interval = setInterval(refreshData, 30000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>{job?.title || 'Job Details'}</title>
</svelte:head>

{#if !job}
	<div class="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
		<div class="text-center py-10 px-6 rounded-xl shadow-sm bg-white dark:bg-gray-800">
			<h1 class="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Job Not Found</h1>
			<a href="/jobs" class="text-sky-600 hover:underline transition-colors">Back to Jobs</a>
		</div>
	</div>
{:else}
	<div class="flex flex-col gap-6 px-2 md:px-0 pt-2 pb-6">
		<!-- Header -->
		<div class="flex flex-wrap md:flex-nowrap items-center justify-between gap-2">
			<div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
				<a href="/jobs" class="text-gray-600 hover:text-sky-600 dark:text-gray-300 dark:hover:text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 rounded transition">
					<ArrowLeft class="size-6" />
				</a>
				<div>
					<h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">{job.title}</h1>
					<div class="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-300">
						<span class="flex items-center gap-2">
							<User2 class="size-4" />
							{job.customer.firstName} {job.customer.lastName}
						</span>
						{#if job.customer.address}
							<span class="flex items-center gap-2">
								<MapPin class="size-4" />
								{job.customer.address}
							</span>
						{/if}
					</div>
					<div class="flex items-center gap-3 mt-2">
						<!-- Priority display and edit -->
						<span class="text-xs text-gray-500 dark:text-gray-400 flex items-center">
							Priority:
							{#if priorityEditing}
								<div class="flex items-center gap-2 ml-2">
									<Select bind:value={priority}>
										{#each PRIORITY_OPTIONS as opt}
											<option value={opt.value}>{opt.label}</option>
										{/each}
									</Select>
									<Button size="sm" onclick={updatePriority} class="bg-sky-600 text-white rounded">Save</Button>
									<Button variant="ghost" size="sm" onclick={() => { priorityEditing = false; priority = job.priority; }} class="rounded">Cancel</Button>
								</div>
								{#if priorityEditError}
									<span class="ml-2 text-red-600 text-xs">{priorityEditError}</span>
								{/if}
							{:else}
								<Badge class="ml-2 capitalize cursor-pointer px-2 px-2 py-0.5 {priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}"
									onclick={() => (priorityEditing = true)}>
									{priority}
									<Edit class="size-3 ml-2 opacity-60" />
								</Badge>
							{/if}
						</span>
						<!-- Status display and edit -->
						<span class="text-xs text-gray-500 dark:text-gray-400 flex items-center">
							Status:
							{#if statusEditing}
								<div class="flex items-center gap-2 ml-2">
									<Select bind:value={editingStatus}>
										{#each statusOptions as opt}
											<option value={opt.value}>{opt.label}</option>
										{/each}
									</Select>
									<Button size="sm" onclick={updateStatus} class="bg-sky-600 text-white rounded">Save</Button>
									<Button variant="ghost" size="sm" onclick={() => { statusEditing = false; editingStatus = job.status; }} class="rounded">Cancel</Button>
								</div>
								{#if statusEditError}
									<span class="ml-2 text-red-600 text-xs">{statusEditError}</span>
								{/if}
							{:else}
								<Badge
									class="{STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'} ml-2 cursor-pointer"
									onclick={() => (statusEditing = true)}
								>
									{(statusOptions.find(opt => opt.value === job.status)?.label || job.status.replace('_', ' ').toUpperCase())}
									<Edit class="size-3 ml-2 opacity-60" />
								</Badge>
							{/if}
						</span>
					</div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Main Content -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Progress Bar -->
				<Card class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
					<div class="flex items-center justify-between mb-4">
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
									<Button size="sm" onclick={updateProgress} class="bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800 text-white rounded transition">Save</Button>
									<Button variant="ghost" size="sm" onclick={() => (progressEditing = false)} class="rounded">Cancel</Button>
								</div>
							{:else}
								<Button variant="ghost" size="sm" onclick={() => (progressEditing = true)} class="rounded">
									<Edit class="size-4 mr-1" /> Edit
								</Button>
							{/if}
						{/if}
					</div>
					<div class="space-y-2">
						<div class="flex items-center justify-between text-sm">
							<span class="text-gray-600 dark:text-gray-300">Progress</span>
							<span class="font-semibold text-gray-900 dark:text-white">{progress}%</span>
						</div>
						<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 transition">
							<div
								class="bg-gradient-to-r from-sky-400 to-sky-600 dark:from-sky-600 dark:to-sky-400 h-4 rounded-full transition-all duration-300 shadow-inner"
								style="width: {progress}%"
							></div>
						</div>
					</div>
				</Card>

				<!-- Status History Timeline -->
				<Card class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Status Timeline</h2>
						<Button variant="outline" size="sm" onclick={() => (showAddStatus = true)} class="transition">
							<Plus class="size-4 mr-1" /> Add Status
						</Button>
					</div>
					<div class="space-y-4">
						{#each statusHistory as status, index (status.id)}
							<div class="flex gap-4 items-start group">
								<div class="flex flex-col items-center pt-2">
									<div class="w-3 h-3 rounded-full bg-sky-500 border-2 border-white dark:border-gray-800 group-hover:scale-110 duration-150"></div>
									{#if index < statusHistory.length - 1}
										<div class="w-0.5 grow bg-gray-200 dark:bg-gray-700"></div>
									{/if}
								</div>
								<div class="flex-1 pb-4">
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<h3 class="font-semibold text-gray-900 dark:text-white">{status.status}</h3>
											{#if status.description}
												<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
													{status.description}
												</p>
											{/if}
											<div class="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
												<User2 class="size-3" />
												<span>
													{status.addedBy.firstName} {status.addedBy.lastName}
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
							<p class="text-gray-500 dark:text-gray-400 text-center py-4">No status history yet</p>
						{/if}
					</div>
				</Card>

				<!-- Invoices -->
				<Card class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Invoices</h2>
						{#if canManageInvoices}
							<Button variant="outline" size="sm" onclick={() => (showAddInvoice = true)} class="transition">
								<Plus class="size-4 mr-1" /> New Invoice
							</Button>
						{/if}
					</div>
					<div class="space-y-4">
						{#each invoices as invoice (invoice.id)}
							<div class="border rounded-xl p-4 space-y-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 transition hover:shadow-lg hover:border-sky-200 dark:hover:border-sky-600 relative">
								<!-- Edit & Delete icons -->
								{#if canManageInvoices}
									<div class="absolute top-3 right-3 flex gap-2">
										<Button variant="ghost" size="xs" onclick={() => startEditInvoice(invoice)} aria-label="Edit Invoice" class="rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-300">
											<Edit class="size-4" />
										</Button>
										<Button variant="ghost" size="xs" onclick={() => { editingInvoice = invoice; showDeleteInvoice = true; }} aria-label="Delete Invoice" class="rounded-full hover:bg-red-100 dark:hover:bg-red-800 text-red-600 dark:text-red-300">
											<Trash2 class="size-4" />
										</Button>
									</div>
								{/if}
								<div class="flex items-center justify-between">
									<div>
										<h3 class="font-semibold text-gray-900 dark:text-white">
											{invoice.invoiceNumber || `Invoice #${invoice.id}`}
										</h3>
										<Badge class="mt-1">{invoice.status}</Badge>
									</div>
									<div class="text-right">
										<p class="text-lg font-bold text-green-600 dark:text-green-400">{currency(invoice.totalAmount)}</p>
										{#if invoice.dueDate}
											<p class="text-xs text-gray-500 dark:text-gray-400">
												Due: {fmtDate(invoice.dueDate)}
											</p>
										{/if}
									</div>
								</div>
								{#if invoice.items && invoice.items.length > 0}
									<div class="mt-2 space-y-1">
										{#each invoice.items as item (item.id)}
											<div class="flex justify-between text-sm text-gray-900 dark:text-gray-200">
												<span>{item.name} × {item.quantity}</span>
												<span>{currency(item.total)}</span>
											</div>
										{/each}
									</div>
								{/if}
								<div class="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
									<span>Subtotal:</span>
									<span>{currency(invoice.subtotal)}</span>
								</div>
								{#if invoice.taxAmount > 0}
									<div class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
										<span>Tax ({invoice.taxRate}%):</span>
										<span>{currency(invoice.taxAmount)}</span>
									</div>
								{/if}
								{#if invoice.payments && invoice.payments.length > 0}
									<div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
										<p class="text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Payments:</p>
										{#each invoice.payments as payment (payment.id)}
											<div class="flex justify-between text-xs text-green-600 dark:text-green-400">
												<span>{currency(payment.amount)} - {payment.method || 'N/A'}</span>
												<span>{fmtDate(payment.paidAt)}</span>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
						{#if invoices.length === 0}
							<p class="text-gray-500 dark:text-gray-400 text-center py-4">No invoices yet</p>
						{/if}
					</div>
				</Card>
			</div>

			<!-- Sidebar -->
			<div class="lg:col-span-1 space-y-6">
				<!-- Toggle between Notes and Feed -->
				<div class="flex gap-2 border-b border-gray-200 dark:border-gray-700">
					<Button
						variant={sidebarView === 'feed' ? 'default' : 'ghost'}
						size="sm"
						class="flex-1 rounded-t-md transition"
						onclick={() => (sidebarView = 'feed')}
					>
						<MessageSquare class="size-4 mr-1" /> Feed
					</Button>
					<Button
						variant={sidebarView === 'notes' ? 'default' : 'ghost'}
						size="sm"
						class="flex-1 rounded-t-md transition"
						onclick={() => (sidebarView = 'notes')}
					>
						<StickyNote class="size-4 mr-1" /> Notes
					</Button>
				</div>

				{#if sidebarView === 'notes'}
					<!-- Notes -->
					<Card class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
						<h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Notes</h2>
						<div class="space-y-4 mb-4 max-h-80 overflow-y-auto pr-2">
							{#each notes as note (note.id)}
								<div class="border rounded-xl p-3 space-y-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
									<p class="text-sm text-gray-900 dark:text-white">{note.content}</p>
									<div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
										<span>
											{note.createdBy.firstName} {note.createdBy.lastName} · {fmtDateTime(note.createdAt)}
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
								<p class="text-gray-500 dark:text-gray-400 text-center py-4">No notes yet</p>
							{/if}
						</div>
						<div class="flex gap-2 items-center mt-2">
							<Input
								placeholder="Add a note..."
								bind:value={newNoteContent}
								onkeydown={(e) => e.key === 'Enter' && addNote()}
								class="rounded-lg"
							/>
							<Button onclick={addNote} class="bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800 text-white rounded-lg shadow-sm transition" aria-label="Add note">
								<Send class="size-4" />
							</Button>
						</div>
					</Card>
				{:else}
					<!-- Feed -->
					<Card class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
						<h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Project Feed</h2>

						<!-- Participants -->
						<div class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
							<h3 class="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Participants</h3>
							<div class="flex flex-wrap gap-2">
								{#each participants as participant (participant.id)}
									<Badge class="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded">
										{participant.firstName} {participant.lastName}
										<span class="ml-1 text-xs text-blue-700 dark:text-blue-300">({participant.role})</span>
									</Badge>
								{/each}
							</div>
						</div>

						<!-- Feed Messages -->
						<div class="space-y-4 mb-4 max-h-[400px] sm:max-h-[600px] overflow-y-auto pr-2">
							{#each feedItems as item (item.id)}
								<div class="border rounded-xl p-3 space-y-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<div class="flex items-center gap-2 mb-1">
												<span class="font-semibold text-sm text-gray-900 dark:text-white">
													{item.createdBy.firstName} {item.createdBy.lastName}
												</span>
												<span class="text-xs text-gray-500 dark:text-gray-400">{fmtDateTime(item.createdAt)}</span>
											</div>
											{#if item.content}
												<p class="text-sm text-gray-700 dark:text-gray-200">{item.content}</p>
											{/if}
											{#if item.taggedUserIds && item.taggedUserIds.length > 0}
												<div class="flex flex-wrap gap-1 mt-2">
													{#each item.taggedUserIds as userId}
														<Badge class="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 text-xs rounded">
															<Tag class="size-3 mr-1" /> @{getParticipantName(userId)}
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
								<p class="text-gray-500 dark:text-gray-400 text-center py-4">No feed items yet</p>
							{/if}
						</div>

						<!-- Add Message -->
						<div class="space-y-2">
							<div class="flex flex-wrap gap-2 mb-2">
								{#each participants as participant (participant.id)}
									<Button
										variant={selectedTaggedUsers.includes(participant.id) ? 'default' : 'outline'}
										size="sm"
										onclick={() => {
											if (selectedTaggedUsers.includes(participant.id)) {
												selectedTaggedUsers = selectedTaggedUsers.filter((id) => id !== participant.id);
											} else {
												selectedTaggedUsers = [...selectedTaggedUsers, participant.id];
											}
										}}
										class="rounded transition"
									>
										<Tag class="size-3 mr-1" /> {participant.firstName}
									</Button>
								{/each}
							</div>
							<div class="flex gap-2 items-center">
								<Input
									placeholder="Type a message..."
									bind:value={newFeedMessage}
									onkeydown={(e) => e.key === 'Enter' && addFeedMessage()}
									class="rounded-lg"
								/>
								<Button onclick={addFeedMessage} class="bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800 text-white rounded-lg shadow-sm transition" aria-label="Send feed message">
									<Send class="size-4" />
								</Button>
							</div>
						</div>
					</Card>
				{/if}

				<!-- Todos -->
				<Card class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Todos</h2>
						<Button variant="outline" size="sm" onclick={() => (showAddTodo = true)} class="transition">
							<Plus class="size-4 mr-1" /> Add Todo
						</Button>
					</div>
					<div class="space-y-3 max-h-[320px] sm:max-h-[400px] overflow-y-auto pr-2">
						{#each todos as todo (todo.id)}
							<div class="border rounded-xl p-3 space-y-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
								<div class="flex items-start gap-3">
									<Button
										variant="ghost"
										size="sm"
										onclick={() => toggleTodo(todo.id, todo.completed)}
										class="rounded-full hover:bg-green-100 dark:hover:bg-green-800 transition"
										aria-label="Toggle todo"
									>
										{#if todo.completed}
											<CheckSquare class="size-4 text-green-600 dark:text-green-400" />
										{:else}
											<Square class="size-4 text-gray-400 dark:text-gray-600" />
										{/if}
									</Button>
									<div class="flex-1">
										<h3 class="font-semibold {todo.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}">
											{todo.title}
										</h3>
										{#if todo.description}
											<p class="text-sm text-gray-600 dark:text-gray-400">{todo.description}</p>
										{/if}
										<div class="flex flex-wrap gap-2 mt-2">
											{#each todo.assignedToIds as userId}
												<Badge class="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 text-xs">
													{getParticipantName(userId)}
												</Badge>
											{/each}
											{#if todo.dueDate}
												<Badge class="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-xs">
													<Calendar class="size-3 mr-1" /> Due: {fmtDate(todo.dueDate)}
												</Badge>
											{/if}
										</div>
										{#if todo.completed && todo.completedBy}
											<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
												Completed by {todo.completedBy.firstName} {todo.completedBy.lastName} on {fmtDate(todo.completedAt)}
											</p>
										{/if}
									</div>
								</div>
							</div>
						{/each}
						{#if todos.length === 0}
							<p class="text-gray-500 dark:text-gray-400 text-center py-4">No todos yet</p>
						{/if}
					</div>
				</Card>
			</div>
		</div>
	</div>

	<!-- Add Status Dialog -->
	<Dialog.Root bind:open={showAddStatus}>
		<Dialog.Content class="max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700">
			<Dialog.Header>
				<Dialog.Title class="text-xl text-gray-900 dark:text-white">Add Status</Dialog.Title>
			</Dialog.Header>
			<div class="space-y-4">
				<div>
					<label class="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-200">Status Title</label>
					<Input bind:value={newStatusTitle} placeholder="e.g., Materials Ordered" class="rounded-lg" />
				</div>
				<div>
					<label class="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-200">Description</label>
					<Input bind:value={newStatusDescription} placeholder="Optional description" class="rounded-lg" />
				</div>
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (showAddStatus = false)} class="rounded">Cancel</Button>
				<Button onclick={addStatusHistory} class="bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800 text-white rounded">Add Status</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Add/Edit Todo Dialog - unchanged -->
	<Dialog.Root bind:open={showAddTodo}>
		<Dialog.Content class="max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700">
			<Dialog.Header>
				<Dialog.Title class="text-xl text-gray-900 dark:text-white">Add Todo</Dialog.Title>
			</Dialog.Header>
			<div class="space-y-4">
				<div>
					<label class="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-200">Title</label>
					<Input bind:value={newTodoTitle} placeholder="Todo title" class="rounded-lg" />
				</div>
				<div>
					<label class="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-200">Description</label>
					<Input bind:value={newTodoDescription} placeholder="Optional description" class="rounded-lg" />
				</div>
				<div>
					<label class="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-200">Assign To</label>
					{#if !participants || participants.length === 0}
						<p class="text-gray-500 dark:text-gray-400 text-sm py-2">No participants found. Please add participants first.</p>
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
								{participant.firstName} {participant.lastName}
							</Button>
						{/each}
					</div>
					{/if}
				</div>
				<div>
					<label class="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-200">Due Date</label>
					<Input type="date" bind:value={newTodoDueDate} class="rounded-lg" />
				</div>
				{#if addTodoError}
					<p class="text-red-600 dark:text-red-400 text-sm">{addTodoError}</p>
				{/if}
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => { showAddTodo = false; addTodoError = ''; }} class="rounded">Cancel</Button>
				<Button onclick={addTodo} disabled={!participants || participants.length === 0} class="bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800 text-white rounded">Add Todo</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Add Invoice Dialog -->
	<Dialog.Root bind:open={showAddInvoice}>
		<Dialog.Content class="max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700">
			<Dialog.Header>
				<Dialog.Title class="text-xl text-gray-900 dark:text-white">Create Invoice</Dialog.Title>
			</Dialog.Header>
			<div class="space-y-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-200">Invoice Number</label>
						<Input bind:value={invoiceNumber} placeholder="Optional" class="rounded-lg" />
					</div>
					<div>
						<label class="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-200">Due Date</label>
						<Input type="date" bind:value={invoiceDueDate} class="rounded-lg" />
					</div>
				</div>
				<div>
					<label class="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-200">Tax Rate (%)</label>
					<Input type="number" step="0.01" bind:value={invoiceTaxRate} class="rounded-lg" />
				</div>
				<div>
					<label class="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-200">Notes</label>
					<Input bind:value={invoiceNotes} placeholder="Optional notes" class="rounded-lg" />
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-sm font-medium text-gray-900 dark:text-gray-200">Items</label>
						<Button variant="outline" size="sm" onclick={addInvoiceItem} class="rounded">
							<Plus class="size-4 mr-1" /> Add Item
						</Button>
					</div>
					<div class="space-y-2">
						{#each invoiceItems as item, index (index)}
							<div class="grid grid-cols-12 gap-2 items-end">
								<div class="col-span-12 sm:col-span-4">
									<Input bind:value={item.name} placeholder="Item name" class="rounded-lg" />
								</div>
								<div class="col-span-12 sm:col-span-3">
									<Input bind:value={item.description} placeholder="Description" class="rounded-lg" />
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
								<div class="col-span-12 sm:col-span-1 flex justify-end">
									<Button variant="ghost" size="sm" onclick={() => removeInvoiceItem(index)} class="rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-800 transition" aria-label="Remove Item">
										<X class="size-4" />
									</Button>
								</div>
							</div>
						{/each}
					</div>
				</div>
				{#if invoiceItems.length > 0}
					{@const totals = calculateInvoiceTotals()}
					<div class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
						<div class="flex justify-between text-gray-700 dark:text-gray-300">
							<span>Subtotal:</span>
							<span>{currency(totals.subtotal)}</span>
						</div>
						<div class="flex justify-between text-gray-700 dark:text-gray-300">
							<span>Tax ({invoiceTaxRate}%):</span>
							<span>{currency(totals.taxAmount)}</span>
						</div>
						<div class="flex justify-between font-bold text-lg text-gray-900 dark:text-white">
							<span>Total:</span>
							<span>{currency(totals.total)}</span>
						</div>
					</div>
				{/if}
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (showAddInvoice = false)} class="rounded">Cancel</Button>
				<Button onclick={addInvoice} class="bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800 text-white rounded">Create Invoice</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
	
	<!-- Edit Invoice Dialog -->
	<Dialog.Root bind:open={showEditInvoice}>
		<Dialog.Content class="max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700">
			<Dialog.Header>
				<Dialog.Title class="text-xl text-gray-900 dark:text-white">Edit Invoice</Dialog.Title>
			</Dialog.Header>
			<div class="space-y-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-200">Invoice Number</label>
						<Input bind:value={invoiceNumber} placeholder="Optional" class="rounded-lg" />
					</div>
					<div>
						<label class="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-200">Due Date</label>
						<Input type="date" bind:value={invoiceDueDate} class="rounded-lg" />
					</div>
				</div>
				<div>
					<label class="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-200">Tax Rate (%)</label>
					<Input type="number" step="0.01" bind:value={invoiceTaxRate} class="rounded-lg" />
				</div>
				<div>
					<label class="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-200">Notes</label>
					<Input bind:value={invoiceNotes} placeholder="Optional notes" class="rounded-lg" />
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-sm font-medium text-gray-900 dark:text-gray-200">Items</label>
						<Button variant="outline" size="sm" onclick={addInvoiceItem} class="rounded">
							<Plus class="size-4 mr-1" /> Add Item
						</Button>
					</div>
					<div class="space-y-2">
						{#each invoiceItems as item, index (index)}
							<div class="grid grid-cols-12 gap-2 items-end">
								<div class="col-span-12 sm:col-span-4">
									<Input bind:value={item.name} placeholder="Item name" class="rounded-lg" />
								</div>
								<div class="col-span-12 sm:col-span-3">
									<Input bind:value={item.description} placeholder="Description" class="rounded-lg" />
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
								<div class="col-span-12 sm:col-span-1 flex justify-end">
									<Button variant="ghost" size="sm" onclick={() => removeInvoiceItem(index)} class="rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-800 transition" aria-label="Remove Item">
										<X class="size-4" />
									</Button>
								</div>
							</div>
						{/each}
					</div>
				</div>
				{#if invoiceItems.length > 0}
					{@const totals = calculateInvoiceTotals()}
					<div class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
						<div class="flex justify-between text-gray-700 dark:text-gray-300">
							<span>Subtotal:</span>
							<span>{currency(totals.subtotal)}</span>
						</div>
						<div class="flex justify-between text-gray-700 dark:text-gray-300">
							<span>Tax ({invoiceTaxRate}%):</span>
							<span>{currency(totals.taxAmount)}</span>
						</div>
						<div class="flex justify-between font-bold text-lg text-gray-900 dark:text-white">
							<span>Total:</span>
							<span>{currency(totals.total)}</span>
						</div>
					</div>
				{/if}
				{#if editInvoiceError}
					<p class="text-red-600 dark:text-red-400 text-sm">{editInvoiceError}</p>
				{/if}
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={cancelEditInvoice} class="rounded">Cancel</Button>
				<Button onclick={editInvoice} class="bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-800 text-white rounded">Save Changes</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
	
	<!-- Delete Invoice Confirmation Dialog -->
	<Dialog.Root bind:open={showDeleteInvoice}>
		<Dialog.Content class="max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700">
			<Dialog.Header>
				<Dialog.Title class="text-xl text-red-700 dark:text-red-400">Confirm Delete Invoice</Dialog.Title>
			</Dialog.Header>
			<div class="py-4">
				<p class="text-gray-800 dark:text-gray-200 mb-2">
					Are you sure you want to delete
					invoice <b>{editingInvoice?.invoiceNumber || `#${editingInvoice?.id}`}</b>?
				</p>
				<p class="text-gray-600 dark:text-gray-400 text-sm">This action cannot be undone.</p>
			</div>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => { showDeleteInvoice = false; editingInvoice = null; }} class="rounded">Cancel</Button>
				<Button onclick={() => { if (editingInvoice) deleteInvoice(editingInvoice.id); }} class="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded">Delete</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
