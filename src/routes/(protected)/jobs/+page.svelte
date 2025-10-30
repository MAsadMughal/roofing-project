<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Eye from '@lucide/svelte/icons/eye';
	import Plus from '@lucide/svelte/icons/plus';
	import User2 from '@lucide/svelte/icons/user-check';
	import { tick } from 'svelte';
	// @ts-ignore
	import { Search } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import Gantt from './gantt.svelte';

	const data = { jobs: [] as any[] };
	// To be replaced with actual data assignment above.

	// Dummy helpers for formatting
	const currency = (n: number = 0) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
	const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString() : '-');
	const dummyNotes = [
		{
			id: 'note-1',
			content: "Don't forget client call",
			time: '2024-06-04T08:00',
			jobId: '1',
			unread: true
		},
		{
			id: 'note-2',
			content: 'Site visit scheduled',
			time: '2024-06-03T13:20',
			jobId: '2',
			unread: false
		}
	];
	const dummyActivities = [
		{
			id: 'act-1',
			text: 'Job #1 moved to scheduled',
			time: '2024-06-02T14:21',
			type: 'status',
			unread: true
		},
		{
			id: 'act-2',
			text: 'Note added to Job #2',
			time: '2024-06-03T09:05',
			type: 'note',
			unread: true
		},
		{
			id: 'act-3',
			text: 'Invoice sent for Job #1',
			time: '2024-06-03T18:40',
			type: 'invoice',
			unread: false
		}
	];
	const dummyInvoices = [
		{ id: 'inv-1', jobTitle: 'Renovation A', status: 'Paid', amount: 1800.0 },
		{ id: 'inv-2', jobTitle: 'Paint Job', status: 'Pending', amount: 600.0 }
	];
	const dummyMedia = [
		{
			id: 'media-1',
			type: 'image',
			thumbnail:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9-wMe_AdvHpoZ2PaQXv10WyWVLyI6CzKLFA&s',
			name: 'work.jpg'
		},
		{
			id: 'media-2',
			type: 'image',
			thumbnail:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9-wMe_AdvHpoZ2PaQXv10WyWVLyI6CzKLFA&s',
			name: 'work1.jpg'
		},
		{
			id: 'media-3',
			type: 'image',
			thumbnail:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9-wMe_AdvHpoZ2PaQXv10WyWVLyI6CzKLFA&s',
			name: 'work2.jpg'
		},
		{
			id: 'media-4',
			type: 'image',
			thumbnail:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9-wMe_AdvHpoZ2PaQXv10WyWVLyI6CzKLFA&s',
			name: 'work3.jpg'
		},
		{
			id: 'media-5',
			type: 'image',
			thumbnail:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9-wMe_AdvHpoZ2PaQXv10WyWVLyI6CzKLFA&s',
			name: 'work4.jpg'
		},
		{
			id: 'media-6',
			type: 'image',
			thumbnail:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9-wMe_AdvHpoZ2PaQXv10WyWVLyI6CzKLFA&s',
			name: 'work5.jpg'
		},
		{
			id: 'media-7',
			type: 'image',
			thumbnail:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9-wMe_AdvHpoZ2PaQXv10WyWVLyI6CzKLFA&s',
			name: 'work6.jpg'
		},
		{
			id: 'media-8',
			type: 'image',
			thumbnail:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9-wMe_AdvHpoZ2PaQXv10WyWVLyI6CzKLFA&s',
			name: 'work7.jpg'
		},
		{
			id: 'media-9',
			type: 'image',
			thumbnail:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9-wMe_AdvHpoZ2PaQXv10WyWVLyI6CzKLFA&s',
			name: 'work8.jpg'
		},
		{
			id: 'media-10',
			type: 'image',
			thumbnail:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9-wMe_AdvHpoZ2PaQXv10WyWVLyI6CzKLFA&s',
			name: 'work9.jpg'
		},
		{
			id: 'media-11',
			type: 'image',
			thumbnail:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9-wMe_AdvHpoZ2PaQXv10WyWVLyI6CzKLFA&s',
			name: 'work10.jpg'
		},
		{
			id: 'media-12',
			type: 'image',
			thumbnail:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9-wMe_AdvHpoZ2PaQXv10WyWVLyI6CzKLFA&s',
			name: 'work11.jpg'
		}
	];

	// Status mapping
	const STATUS_META: Record<string, { title: string; color: string }> = {
		scheduled: { title: 'Scheduled', color: 'bg-sky-100 text-sky-800' },
		in_progress: { title: 'In Progress', color: 'bg-amber-100 text-amber-800' },
		completed: { title: 'Completed', color: 'bg-green-100 text-green-800' },
		pending_payment: { title: 'Pending Payment', color: 'bg-violet-100 text-violet-800' },
		cancelled: { title: 'Cancelled', color: 'bg-red-100 text-red-800' }
	};

	// Filtering, search, ordering --- remove tabs/board/table
	let jobs: any[] = [];
	let searchText = '';
	let selectedJobId: string | null = null;
	let notes: Array<{ id: string; content: string; time: string; jobId: string; unread?: boolean }> =
		[];
	let activities: any[] = [];
	let localJobsLSKey = 'jobs-priority-list';

	// --- On mount: sync jobs from server and localstorage (priority order) ---
	onMount(() => {
		loadJobs();
		loadNotes();
		loadActivities();
	});

	function loadJobs() {
		const ls = browser && localStorage.getItem(localJobsLSKey);
		const parsedLs = ls && JSON.parse(ls);
		const serverJobs = Array.isArray(data.jobs) ? structuredClone(data.jobs) : [];
		// Merge: preserve local order, add new jobs from server, remove if deleted
		if (parsedLs && Array.isArray(parsedLs)) {
			const serverIds = new Set(serverJobs.map((j: any) => j.id));
			let localList: any[] = parsedLs
				.filter((j: any) => serverIds.has(j.id))
				.map((j: any) => {
					const found = serverJobs.find((sj: any) => sj.id === j.id);
					return found ? { ...found } : j;
				});
			const notInLocal = serverJobs.filter(
				(j: any) => !localList.find((lj: any) => lj.id === j.id)
			);
			jobs = [...localList, ...notInLocal];
		} else {
			jobs = serverJobs;
		}
	}

	function saveJobsOrder() {
		if (browser)
			localStorage.setItem(localJobsLSKey, JSON.stringify(jobs.map((j: any) => ({ id: j.id }))));
	}

	// DnD event handler
	function handleDnd(e: DndEvent) {
		const { items } = e.detail;
		if (items) {
			jobs = items;
			saveJobsOrder();
		}
	}

	async function onDragFinalize() {
		dndActive = false;
		await tick();
		saveJobsOrder();
	}

	function selectJob(jobId: string) {
		selectedJobId = jobId;
	}

	function openNewJob() {
		goto('/jobs/new');
	}

	function viewJob(job: any) {
		goto(`/jobs/${job.id}`);
	}

	// Notes logic
	function loadNotes() {
		notes = [
			...dummyNotes,
			...(browser && JSON.parse(localStorage.getItem('all-job-notes') ?? '[]'))
		];
	}

	function addNote(note: string) {
		if (!note || !selectedJobId) return;
		const newNote = {
			id: 'note-' + Math.random().toString(36).slice(2),
			content: note,
			time: new Date().toISOString(),
			jobId: selectedJobId,
			unread: true
		};
		notes = [newNote, ...notes];
		saveNotes();
	}

	function saveNotes() {
		if (browser) localStorage.setItem('all-job-notes', JSON.stringify(notes));
	}

	// Activities
	function loadActivities() {
		activities = [
			...dummyActivities,
			...(browser && JSON.parse(localStorage.getItem('all-job-activities') ?? '[]'))
		];
	}

	// svar-ui/svelte-gantt seed data -- editable and tracks

	// Media gallery (dummy)
	let jobMedia = [...dummyMedia];

	// Error handler for all sections
	function safe<T>(fn: () => T, fallback: T): T {
		try {
			return fn();
		} catch {
			return fallback;
		}
	}
	let addNoteText = '';
	let tasks = [
		{ id: 1, name: 'Design', start: '2025-10-01', end: '2025-10-05', color: '#6366f1' },
		{ id: 2, name: 'Build', start: '2025-10-04', end: '2025-10-12', color: '#06b6d4' }
	];

	function onUpdate(e) {
		// e.detail contains the updated task (start/end as ISO strings)
		console.log('task updated', e.detail);
		// Sync with server or your store here
	}

	function onRename(e) {
		console.log('rename', e.detail);
	}
</script>

<div class="flex w-full flex-col gap-6 md:flex-row">
	<!-- LEFT: Jobs list (Drag to reorder) -->
	<div class="flex-1">
		<div class="mb-4 flex items-center gap-3">
			<div class="relative w-full">
				<Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input
					class="pl-10"
					placeholder="Search jobs, customer, address..."
					bind:value={searchText}
				/>
			</div>
			<Button class="h-10" onclick={openNewJob}>
				<Plus class="mr-2 size-4" /> New Job
			</Button>
		</div>

		<Card class="jobs-list-dnd max-h-[67vh] overflow-auto">
			<div
				use:dndzone={{ items: jobs, flipDurationMs: 150 }}
				onconsider={handleDnd}
				onfinalize={onDragFinalize}
			>
				{#if jobs.length === 0}
					<div class="text-muted-foreground p-6 text-center">No jobs found</div>
				{:else}
					{#each jobs as job (job.id)}
						<div
							aria-roledescription=""
							class={`job-card ${selectedJobId === job.id ? 'border-slate-600 bg-slate-100' : 'bg-white'} mb-2 flex cursor-pointer items-center gap-4 rounded-md border p-4 shadow-sm transition hover:shadow-md`}
							draggable="true"
							onclick={() => selectJob(job.id)}
							data-id={job.id}
						>
							<div class="flex-1">
								<div class="flex items-center justify-between">
									<div class="text-base font-semibold">{safe(() => job.title, 'Untitled Job')}</div>
									<!-- svelte-ignore a11y/no-static-element-interactions -->
									{#if STATUS_META[String(job.status ?? 'scheduled')]}
										<div
											class={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_META[String(job.status ?? 'scheduled')]?.color ?? 'bg-gray-100 text-gray-600'}`}
										>
											{STATUS_META[String(job.status ?? 'scheduled')]?.title ?? 'Unknown'}
										</div>
									{:else}
										<div class="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
											Unknown
										</div>
									{/if}
								</div>
								<div class="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
									<User2 class="size-3" /> <span>{safe(() => job.customer, 'No customer')}</span>
									<span>·</span>
									<Calendar class="size-4" /><span>{safe(() => fmtDate(job.date), '-')}</span>
								</div>
							</div>
							<div class="text-sm font-semibold">{safe(() => currency(job.amount), '$0')}</div>
							<Button aria-label="Open" variant="ghost" size="icon" onclick={() => viewJob(job)}>
								<Eye class="size-5" />
							</Button>
						</div>
						<!-- svelte-ignore a11y-click-events-have-key-events -->
					{/each}
				{/if}
			</div>
		</Card>
		<div class="text-muted-foreground mt-2 text-sm">
			Showing {jobs.length} job{jobs.length == 1 ? '' : 's'}
		</div>
	</div>

	<!-- RIGHT: Side tabs - Notes, Activity, Invoices, Media -->
	<div class="side-tabs flex max-w-[400px] min-w-[320px] flex-col gap-4">
		<!-- Notes tab -->
		<Card>
			<div class="border-b p-4 text-base font-bold">Notes</div>
			<div class="space-y-3 p-3">
				{#if selectedJobId}
					<!-- Notes for selected job -->
					<ul class="mb-2 min-h-12 space-y-2">
						{#each notes.filter((n) => n.jobId === selectedJobId) as n (n.id)}
							<li class="rounded border bg-slate-50 px-2 py-1 text-sm">
								{n.content}
								<span class="text-muted-foreground block text-xs">{fmtDate(n.time)}</span>
							</li>
						{/each}
						{#if notes.filter((n) => n.jobId === selectedJobId).length === 0}
							<li class="text-muted-foreground text-xs">No notes for this job</li>
						{/if}
					</ul>
					<div class="flex items-center gap-1">
						<Input
							class="flex-1"
							bind:value={addNoteText}
							placeholder="Add a note..."
							onkeydown={(e: KeyboardEvent) => {
								if (e.key === 'Enter') {
									addNote(addNoteText);
									addNoteText = '';
								}
							}}
						/>
						<Button
							size="sm"
							onclick={() => {
								addNote(addNoteText);
								addNoteText = '';
							}}>+</Button
						>
					</div>
				{:else}
					<div class="text-muted-foreground p-4 text-center text-sm">
						Select a job to add/view notes.
					</div>
				{/if}
			</div>
		</Card>
		<!-- Activity tab -->
		<Card>
			<div class="flex items-center gap-2 border-b p-4 text-base font-bold">
				<span>Latest Unread Activity</span>
			</div>
			<div class="max-h-32 space-y-1 overflow-auto p-3">
				{#each activities.filter((a) => a.unread) as a (a.id)}
					<div class="rounded border bg-blue-50 px-2 py-1 text-xs leading-tight">
						{a.text} <span class="text-muted-foreground">{fmtDate(a.time)}</span>
					</div>
				{/each}
				{#if activities.filter((a) => a.unread).length === 0}
					<div class="text-muted-foreground text-xs">No unread activity</div>
				{/if}
			</div>
		</Card>
		<!-- Invoices section -->
		<Card>
			<div class="flex items-center gap-2 border-b p-4 text-base font-bold">
				<span>Invoices</span>
			</div>
			<div class="space-y-1 p-3">
				{#each dummyInvoices as inv (inv.id)}
					<div class="mb-1 flex items-center justify-between rounded border bg-slate-50 px-2 py-1">
						<div class="flex flex-col">
							<span class="text-sm font-medium">{inv.jobTitle}</span>
							<span class="text-muted-foreground text-xs">{inv.status}</span>
						</div>
						<span class="font-semibold">{currency(inv.amount)}</span>
					</div>
				{/each}
				{#if dummyInvoices.length === 0}
					<div class="text-muted-foreground text-xs">No invoices</div>
				{/if}
			</div>
		</Card>
		<!-- Media section -->
		<Card>
			<div class="flex items-center gap-2 border-b p-4 text-base font-bold">
				<span>Job Media</span>
			</div>
			<div class="grid grid-cols-4 gap-2 p-3">
				{#each jobMedia as media (media.id)}
					<div class="col-span-1 flex flex-col items-center gap-1">
						<img
							class="mb-1 h-12 w-12 rounded object-cover shadow"
							src={media.thumbnail}
							alt={media.name}
							loading="lazy"
						/>
						<span class="text-muted-foreground text-center text-xs">{media.name}</span>
					</div>
				{/each}
				{#if jobMedia.length === 0}
					<div class="text-muted-foreground col-span-4 text-xs">No media found</div>
				{/if}
			</div>
		</Card>
	</div>
</div>
<Gantt {tasks} on:update={onUpdate} on:rename={onRename} />

<style>
	.jobs-list-dnd .job-card-dragging {
		opacity: 0.5;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}
	.side-tabs {
		min-width: 320px;
		max-width: 400px;
		width: 100%;
	}
</style>
