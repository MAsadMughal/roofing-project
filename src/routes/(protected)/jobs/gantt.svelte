<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { writable, derived, get } from 'svelte/store';

	// Props
	export let tasks = []; // [{id, name, start: '2025-10-01', end: '2025-10-05', color}]
	export let rowHeight = 44;
	export let hourWidth = 20;

	const dispatch = createEventDispatcher();

	// Local reactive stores for tasks
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
		min = new Date(min.getFullYear(), min.getMonth(), min.getDate() - 2);
		max = new Date(max.getFullYear(), max.getMonth(), max.getDate() + 2);
		return { min, max };
	});

	const totalMs = derived(bounds, ($b) => $b.max - $b.min);

	function dateToPct(date, min, max) {
		const total = max - min;
		return ((date - min) / total) * 100;
	}

	// Drag state and improved pointer tracking (for best UX)
	let dragging = null; // {type, id, startX, origX, origStart, origEnd}
	let dragGhost = null;
	let animationFrame;

	function getTimelineEl() {
		return document.querySelector('.gantt-timeline-inner');
	}

	// Unified pointer down logic for move and resize handles
	function onPointerDown(e, task, type = 'move') {
		// Avoid starting drag on right-click
		if (e.button !== 0) return;
		e.stopPropagation();
		e.preventDefault();

		const timelineEl = getTimelineEl();
		if (!timelineEl) return;

		// Calculate pointer offset in timeline, supports touch and mouse
		const pointerX = e.touches ? e.touches[0].clientX : e.clientX;

		dragging = {
			type,
			id: task.id,
			startX: pointerX,
			origStart: new Date(task.start),
			origEnd: new Date(task.end)
		};

		// Add UX enhancement: highlight bar being dragged
		dragGhost = task.id;

		// Attach listeners (capture phase to avoid event being swallowed)
		window.addEventListener('pointermove', onPointerMove, { passive: false, capture: true });
		window.addEventListener('pointerup', onPointerUp, { passive: false, capture: true });
		document.body.style.cursor =
			type === 'move' ? 'grabbing' : 'ew-resize';

		// Prevent text selection while dragging
		document.body.classList.add('gantt-noselect');
	}

	function onPointerMove(e) {
		if (!dragging) return;
		e.preventDefault();

		const boundsObj = get(bounds);
		const totalMsVal = get(totalMs);

		const timelineEl = getTimelineEl();
		if (!timelineEl) return;

		const pointerX = e.touches ? e.touches[0].clientX : e.clientX;

		const width = timelineEl.clientWidth;
		const msPerPx = totalMsVal / width;
		const deltaPx = pointerX - dragging.startX;
		const deltaMs = deltaPx * msPerPx;

		// Only update on animation frame to guarantee smoothness and avoid perf
		if (animationFrame) cancelAnimationFrame(animationFrame);
		animationFrame = requestAnimationFrame(() => {
			tasksStore.update((list) =>
				list.map((t) => {
					if (t.id !== dragging.id) return t;
					let newStart = new Date(t.start.getTime());
					let newEnd = new Date(t.end.getTime());
					if (dragging.type === 'move') {
						newStart = new Date(dragging.origStart.getTime() + deltaMs);
						newEnd = new Date(dragging.origEnd.getTime() + deltaMs);

						// Clamp move to bounds
						const boundsStart = boundsObj.min.getTime();
						const boundsEnd = boundsObj.max.getTime();
						const taskDuration = dragging.origEnd - dragging.origStart;

						if (newStart < boundsStart) {
							newStart = new Date(boundsStart);
							newEnd = new Date(boundsStart + taskDuration);
						}
						if (newEnd > boundsEnd) {
							newEnd = new Date(boundsEnd);
							newStart = new Date(boundsEnd - taskDuration);
						}
					} else if (dragging.type === 'resize-left') {
						newStart = new Date(dragging.origStart.getTime() + deltaMs);
						// Clamp left resize
						if (newStart >= newEnd) {
							newStart = new Date(newEnd.getTime() - 1000 * 60 * 60); // min 1 hour
						}
						if (newStart < boundsObj.min) {
							newStart = new Date(boundsObj.min);
						}
					} else if (dragging.type === 'resize-right') {
						newEnd = new Date(dragging.origEnd.getTime() + deltaMs);
						// Clamp right resize
						if (newEnd <= newStart) {
							newEnd = new Date(newStart.getTime() + 1000 * 60 * 60);
						}
						if (newEnd > boundsObj.max) {
							newEnd = new Date(boundsObj.max);
						}
					}
					return { ...t, start: newStart, end: newEnd };
				})
			);
		});
	}

	function onPointerUp() {
		if (!dragging) return;
		const id = dragging.id;

		// Cleanup UI
		document.body.classList.remove('gantt-noselect');
		document.body.style.cursor = '';
		dragGhost = null;
		window.removeEventListener('pointermove', onPointerMove, true);
		window.removeEventListener('pointerup', onPointerUp, true);

		// Debounce any stray animation frames
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}

		// Emit update
		const unsub = tasksStore.subscribe((list) => {
			const task = list.find((x) => x.id === id);
			if (task)
				dispatch('update', {
					...task,
					start: task.start.toISOString(),
					end: task.end.toISOString()
				});
		});
		unsub();

		dragging = null;
	}

	// For accessibility: Cancel drag on Esc
	function cancelDrag() {
		if (dragging) {
			document.body.classList.remove('gantt-noselect');
			document.body.style.cursor = '';
			dragGhost = null;
			window.removeEventListener('pointermove', onPointerMove, true);
			window.removeEventListener('pointerup', onPointerUp, true);
			dragging = null;
		}
	}
	function onKeydown(e) {
		if (e.key === 'Escape') {
			cancelDrag();
		}
	}
	onMount(() => {
		window.addEventListener('keydown', onKeydown, true);
	});
	onDestroy(() => {
		window.removeEventListener('keydown', onKeydown, true);
		cancelDrag();
	});

	// Inline edit name
	function onNameBlur(e, id) {
		const newName = e.target.innerText.trim();
		tasksStore.update((list) => list.map((t) => (t.id === id ? { ...t, name: newName } : t)));
		const task = getTaskById(id);
		dispatch('rename', { id, name: newName, task });
	}

	function getTaskById(id) {
		let found;
		const unsub = tasksStore.subscribe((list) => {
			found = list.find((t) => t.id === id);
		});
		unsub();
		return found;
	}

	function formatDateHeader(d) {
		return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
	}

	let boundsValue;
	let totalMsValue;
	bounds.subscribe((v) => (boundsValue = v));
	totalMs.subscribe((v) => (totalMsValue = v));

	function daysArray() {
		const arr = [];
		const start = new Date(
			get(bounds).min.getFullYear(),
			get(bounds).min.getMonth(),
			get(bounds).min.getDate()
		);
		const end = new Date(get(bounds).max.getFullYear(), get(bounds).max.getMonth(), get(bounds).max.getDate());
		for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
			arr.push(new Date(d));
		}
		return arr;
	}

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
			{#if $tasksStore}
				{#each $tasksStore as task, i}
					<div class="gantt-row" style="height:{rowHeight}px">
						<div class="task-name" style="padding:8px;">
							<div
								contenteditable
								class="name-edit"
								on:blur={(e) => onNameBlur(e, task.id)}
								on:keydown={(e) => e.key === 'Enter' && e.target.blur()}
								tabindex="0"
								aria-label="Edit task name"
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
					{#each $tasksStore as task, idx (task.id)}
						{#if $bounds}
							<div
								class="task-bar {dragGhost === task.id ? 'dragging-bar' : ''}"
								style="
									left: {dateToPct(task.start, $bounds.min, $bounds.max)}%;
									width: {dateToPct(task.end, $bounds.min, $bounds.max) - dateToPct(task.start, $bounds.min, $bounds.max)}%;
									top: {idx * rowHeight + 8}px;
									background: {task.color || `linear-gradient(90deg,#4f46e5,#06b6d4)`};
									z-index: {dragGhost === task.id ? 10 : 2};
									transition: box-shadow 0.08s, background 0.08s;
								"
								on:pointerdown={(e) => onPointerDown(e, task, 'move')}
								tabindex="0"
								role="slider"
								aria-valuetext="Start: {task.start.toLocaleDateString()}, End: {task.end.toLocaleDateString()}"
								aria-label="Move {task.name} task bar"
							>
								<div
									class="handle left"
									on:pointerdown|stopPropagation={(e) => onPointerDown(e, task, 'resize-left')}
									tabindex="0"
									aria-label="Resize {task.name} start"
								></div>
								<div style="flex:1; text-overflow:ellipsis; overflow:hidden; white-space:nowrap">
									{task.name}
								</div>
								<div
									class="handle right"
									on:pointerdown|stopPropagation={(e) => onPointerDown(e, task, 'resize-right')}
									tabindex="0"
									aria-label="Resize {task.name} end"
								></div>
							</div>
						{/if}
					{/each}

					{#each $tasksStore as _, i}
						<div
							style="position:absolute; left:0; right:0; top:{i * rowHeight + rowHeight + 8}px; height:1px; background:#f3f4f6"
						></div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

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
		will-change: left, width;
		transition: box-shadow 0.08s;
	}
	.task-bar:focus, .task-bar.dragging-bar {
		box-shadow: 0 6px 20px 1px #6366f13f, 0 0 0 3px #4f46e570;
		outline: none;
		z-index: 12;
	}
	.task-bar.dragging-bar {
		background: linear-gradient(90deg,#818cf8,#06b6d4) !important;
		transition: background 0.1s, box-shadow 0.1s;
	}
	.handle {
		width: 13px;
		height: 100%;
		position: absolute;
		top: 0;
		cursor: ew-resize;
		z-index: 2;
		transition: background 0.13s;
		background: rgba(0,0,0,0.00);
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
	.handle.left:hover, .handle.right:hover, .handle.left:focus, .handle.right:focus {
		background: rgba(99,102,241,0.17);
	}
	.name-edit {
		outline: none;
		min-width: 40px;
		background: transparent;
	}
	.gantt-noselect, .gantt-noselect * {
		user-select: none !important;
	}
</style>
