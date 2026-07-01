<script lang="ts">
	interface Props {
		type?: 'job' | 'lead' | 'priority' | 'role' | 'generic';
		value: string;
		class?: string;
	}

	let { type = 'generic', value, class: className = '' }: Props = $props();

	// Normalized status keys
	const key = $derived(value.toLowerCase().replace('-', '_'));

	// Map key to friendly label and styling classes
	const meta = $derived.by(() => {
		if (type === 'priority') {
			switch (key) {
				case 'high':
					return { label: 'High', style: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' };
				case 'medium':
					return { label: 'Medium', style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' };
				case 'low':
				default:
					return { label: 'Low', style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20' };
			}
		}

		if (type === 'role') {
			switch (key) {
				case 'owner':
					return { label: 'Owner', style: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20' };
				case 'rep':
					return { label: 'Sales Rep', style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' };
				case 'estimator':
					return { label: 'Estimator', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' };
				case 'pm':
					return { label: 'Project Manager', style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' };
				case 'foreman':
					return { label: 'Foreman', style: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' };
				case 'office':
					return { label: 'Office Staff', style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20' };
				default:
					return { label: value, style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20' };
			}
		}

		if (type === 'job') {
			switch (key) {
				case 'scheduled':
					return { label: 'Scheduled', style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' };
				case 'in_progress':
					return { label: 'In Progress', style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' };
				case 'completed':
					return { label: 'Completed', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' };
				case 'pending_payment':
					return { label: 'Pending Payment', style: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200/20' };
				case 'cancelled':
					return { label: 'Cancelled', style: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' };
				default:
					return { label: value, style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20' };
			}
		}

		if (type === 'lead') {
			switch (key) {
				case 'new':
					return { label: 'New', style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' };
				case 'contacted':
					return { label: 'Contacted', style: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20' };
				case 'qualified':
					return { label: 'Qualified', style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' };
				case 'inspection_scheduled':
					return { label: 'Inspection Scheduled', style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' };
				case 'estimate_sent':
					return { label: 'Estimate Sent', style: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20' };
				case 'proposal_sent':
					return { label: 'Proposal Sent', style: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' };
				case 'job_created':
					return { label: 'Job Created', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' };
				case 'closed':
					return { label: 'Closed', style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20' };
				default:
					return { label: value, style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20' };
			}
		}

		// Generic fallbacks
		return {
			label: value,
			style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
		};
	});
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase transition-all {meta.style} {className}"
>
	{meta.label}
</span>
