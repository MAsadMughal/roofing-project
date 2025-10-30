<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { writable, derived } from 'svelte/store';

	// Props
	export let tasks = []; // [{id, name, start: '2025-10-01', end: '2025-10-05', color}]
	export let rowHeight = 44;
	export let hourWidth = 20; // pixels per hour for fine-grain control

	const dispatch = createEventDispatcher();

	// Local reactive stores so we can mutate without replacing parent array immediately
	let tasksStore = writable([]);
	$: tasksStore.set(tasks.map((t) => ({ ...t, start: new Date(t.start), end: new Date(t.end) })));

	// Compute timeline bounds
	const bounds = derived(tasksStore, ($tasks) => {
		if ($tasks.length === 0) {
			const now = new Date();
			return { min: now, max: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7) };
		}
		let min = new Date(Math.min(...$tasks.map((t) => t.start.getTime())));
		let max = new Date(Math.max(...$tasks.map((t) => t.end.getTime())));
		// add padding
		min = new Date(min.getFullYear(), min.getMonth(), min.getDate() - 2);
		max = new Date(max.getFullYear(), max.getMonth(), max.getDate() + 2);
		return { min, max };
	});

	// Derived total duration in ms
	const totalMs = derived(bounds, ($b) => $b.max - $b.min);

	// Convert date to percentage position within timeline
	function dateToPct(date, min, max) {
		const total = max - min;
		return ((date - min) / total) * 100;
	}

	// Dragging logic
	let dragging = null; // {type: 'move'|'resize-left'|'resize-right', id, startX, origStart, origEnd}

	function onPointerDown(e, task, type = 'move') {
		e.preventDefault();
		const startX = e.clientX;
		dragging = {
			type,
			id: task.id,
			startX,
			origStart: new Date(task.start),
			origEnd: new Date(task.end)
		};
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
	}

	function onPointerMove(e) {
		if (!dragging) return;
		// compute delta in ms
		const deltaPx = e.clientX - dragging.startX;
		// get bounds width in px
		const timelineEl = document.querySelector('.gantt-timeline-inner');
		if (!timelineEl) return;
		const width = timelineEl.clientWidth;
		const { min, max } = $bounds;
		const msPerPx = $totalMs / width;
		const deltaMs = deltaPx * msPerPx;

		tasksStore.update((list) =>
			list.map((t) => {
				if (t.id !== dragging.id) return t;
				let newStart = new Date(t.start.getTime());
				let newEnd = new Date(t.end.getTime());
				if (dragging.type === 'move') {
					newStart = new Date(dragging.origStart.getTime() + deltaMs);
					newEnd = new Date(dragging.origEnd.getTime() + deltaMs);
				} else if (dragging.type === 'resize-left') {
					newStart = new Date(dragging.origStart.getTime() + deltaMs);
					if (newStart >= newEnd) newStart = new Date(newEnd.getTime() - 1000 * 60 * 60); // min 1 hour
				} else if (dragging.type === 'resize-right') {
					newEnd = new Date(dragging.origEnd.getTime() + deltaMs);
					if (newEnd <= newStart) newEnd = new Date(newStart.getTime() + 1000 * 60 * 60);
				}
				return { ...t, start: newStart, end: newEnd };
			})
		);
	}

	function onPointerUp() {
		if (!dragging) return;
		// emit update for single task
		const id = dragging.id;
		dragging = null;
		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerup', onPointerUp);

		// Notify parent with updated task (convert dates back to ISO strings)
		tasksStore.subscribe((list) => {
			const task = list.find((x) => x.id === id);
			if (task)
				dispatch('update', {
					...task,
					start: task.start.toISOString(),
					end: task.end.toISOString()
				});
		})();
	}

	// Inline edit name
	function onNameBlur(e, id) {
		const newName = e.target.innerText.trim();
		tasksStore.update((list) => list.map((t) => (t.id === id ? { ...t, name: newName } : t)));
		const task = getTaskById(id);
		dispatch('rename', { id, name: newName, task });
	}

	function getTaskById(id) {
		let found;
		tasksStore.subscribe((list) => {
			found = list.find((t) => t.id === id);
		})();
		return found;
	}

	// Utility: format day header
	function formatDateHeader(d) {
		return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
	}

	// Small helpers to access derived values in non-reactive contexts
	let boundsValue;
	let totalMsValue;
	bounds.subscribe((v) => (boundsValue = v));
	totalMs.subscribe((v) => (totalMsValue = v));

	// create a simple days array for header
	function daysArray() {
		const arr = [];
		const start = new Date(
			$bounds.min.getFullYear(),
			$bounds.min.getMonth(),
			$bounds.min.getDate()
		);
		const end = new Date($bounds.max.getFullYear(), $bounds.max.getMonth(), $bounds.max.getDate());
		for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
			arr.push(new Date(d));
		}
		return arr;
	}

	// When parent updates tasks prop, sync local store
	$: if (tasks)
		tasksStore.set(tasks.map((t) => ({ ...t, start: new Date(t.start), end: new Date(t.end) })));
</script>

<div class="gantt" role="application">
	<div class="gantt-header">
		<div class="gantt-title">Gantt — editable</div>
		<div style="margin-left:auto; font-size:13px; color:#6b7280">
			Drag bars to move. Resize by edges. Double click name to edit.
		</div>
	</div>

	<div class="gantt-grid" style="--row: {rowHeight}px;">
		<div class="gantt-left">
			<!-- left column: task names -->
			{#if $tasksStore}
				{#each $tasksStore as task, i}
					<div class="gantt-row" style="height:{rowHeight}px">
						<div class="task-name" style="padding:8px;">
							<div
								contenteditable
								class="name-edit"
								on:blur={(e) => onNameBlur(e, task.id)}
								on:keydown={(e) => e.key === 'Enter' && e.target.blur()}
							>
								{task.name}
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<div class="gantt-right">
			<div class="time-header">
				{#each daysArray() as d}
					<div class="time-cell">{formatDateHeader(d)}</div>
				{/each}
			</div>

			<div class="gantt-timeline">
				<div class="gantt-timeline-inner">
					{#each $tasksStore as task, idx}
						{#if $bounds}
							{#key task.id}
								<div
									class="task-bar"
									style="left: {dateToPct(
										task.start,
										$bounds.min,
										$bounds.max
									)}%; width: {dateToPct(task.end, $bounds.min, $bounds.max) -
										dateToPct(task.start, $bounds.min, $bounds.max)}%; top: {idx * rowHeight +
										8}px; background: {task.color || `linear-gradient(90deg,#4f46e5,#06b6d4)`};"
									on:pointerdown={(e) => onPointerDown(e, task, 'move')}
								>
									<div
										class="handle left"
										on:pointerdown={(e) => onPointerDown(e, task, 'resize-left')}
									></div>
									<div style="flex:1; text-overflow:ellipsis; overflow:hidden; white-space:nowrap">
										{task.name}
									</div>
									<div
										class="handle right"
										on:pointerdown={(e) => onPointerDown(e, task, 'resize-right')}
									></div>
								</div>
							{/key}
						{/if}
					{/each}

					<!-- grid rows lines -->
					{#each $tasksStore as _, i}
						<div
							style="position:absolute; left:0; right:0; top:{i * rowHeight +
								rowHeight +
								8}px; height:1px; background:#f3f4f6"
						></div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Notes:
    - Emits 'update' on pointerup with task object where start/end are ISO strings.
    - Emits 'rename' when name is edited.
    - Uses absolute positioning and percent math for placement.
    - This is a single-file component; adapt styles and accessibility to your app.
  -->

<style>
	.gantt {
		font-family:
			Inter,
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			'Helvetica Neue',
			Arial;
		border-radius: 12px;
		background: linear-gradient(180deg, #ffffff, #fbfbfd);
		box-shadow: 0 8px 30px rgba(19, 24, 39, 0.06);
		padding: 18px;
		overflow: hidden;
	}
	.gantt-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
	}
	.gantt-title {
		font-size: 18px;
		font-weight: 700;
	}
	.gantt-grid {
		display: flex;
		gap: 0;
		border-radius: 8px;
		overflow: auto;
	}
	.gantt-left {
		min-width: 220px;
		border-right: 1px solid #eef0f6;
	}
	.gantt-right {
		flex: 1;
	}
	.gantt-row {
		display: flex;
		align-items: center;
		height: var(--row);
		padding: 8px;
		gap: 8px;
	}
	.task-name {
		padding: 8px;
		border-radius: 8px;
		font-weight: 600;
	}
	.gantt-timeline {
		position: relative;
		padding: 8px;
	}
	.gantt-timeline-inner {
		position: relative;
		min-height: 200px;
	}
	.time-header {
		display: flex;
		position: sticky;
		top: 0;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.75));
		z-index: 5;
	}
	.time-cell {
		min-width: 120px;
		padding: 6px 10px;
		border-right: 1px solid #f2f4f8;
		text-align: center;
		font-size: 12px;
	}
	.task-bar {
		position: absolute;
		height: 28px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
		color: white;
		font-weight: 700;
		box-shadow: 0 4px 14px rgba(30, 41, 59, 0.12);
		cursor: grab;
		user-select: none;
	}
	.handle {
		width: 10px;
		height: 100%;
		position: absolute;
		top: 0;
		cursor: ew-resize;
	}
	.handle.left {
		left: 0;
		border-top-left-radius: 8px;
		border-bottom-left-radius: 8px;
	}
	.handle.right {
		right: 0;
		border-top-right-radius: 8px;
		border-bottom-right-radius: 8px;
	}
	.name-edit {
		outline: none;
	}
</style>
