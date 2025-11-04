// Utility functions for proposals page

export function formatAmount(n: number): string {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function toTitleCase(s: string): string {
	const t = (s || '').toLowerCase();
	return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}

export const statusChipStyles: Record<string, string> = {
	Draft: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-500',
	Sent: 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-500',
	Viewed: 'bg-purple-100 dark:bg-purple-800 text-purple-900 dark:text-purple-100 border border-purple-300 dark:border-purple-500',
	Approved: 'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100 border border-green-300 dark:border-green-500',
	Declined: 'bg-red-100 dark:bg-red-800 text-red-900 dark:text-red-100 border border-red-300 dark:border-red-500',
	Expired: 'bg-orange-100 dark:bg-orange-800 text-orange-900 dark:text-orange-100 border border-orange-300 dark:border-orange-500',
	Saved: 'bg-teal-100 dark:bg-teal-800 text-teal-900 dark:text-teal-100 border border-teal-300 dark:border-teal-500',
	Default: 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-500'
};

export function statusChipClass(status: string): string {
	const s = (status || '').toLowerCase();
	if (s === 'draft') return statusChipStyles.Draft;
	if (s === 'sent') return statusChipStyles.Sent;
	if (s === 'viewed') return statusChipStyles.Viewed;
	if (s === 'approved' || s === 'accepted') return statusChipStyles.Approved;
	if (s === 'declined') return statusChipStyles.Declined;
	if (s === 'expired') return statusChipStyles.Expired;
	if (s === 'saved') return statusChipStyles.Saved;
	return statusChipStyles.Default;
}

export function iconColor(action: string): string {
	switch (action) {
		case 'send': return 'text-blue-700 dark:text-blue-200';
		case 'view': return 'text-gray-800 dark:text-gray-100';
		case 'edit': return 'text-indigo-700 dark:text-indigo-200';
		case 'pdf': return 'text-slate-800 dark:text-slate-100';
		case 'approve': return 'text-green-700 dark:text-green-200';
		case 'decline': return 'text-red-700 dark:text-red-200';
		case 'new': return 'text-emerald-700 dark:text-emerald-200';
		default: return 'text-gray-700 dark:text-gray-200';
	}
}

export function getEstimateKeyValues(estimate: any): Array<{ key: string; value: any }> {
	if (!estimate || typeof estimate !== 'object') return [];
	const exclude = ['id', 'createdAt', 'status', 'total_amount', 'totalAmount', 'notes', 'description'];
	const keys = Object.keys(estimate).filter((key) => !exclude.includes(key));
	return keys.map((key) => ({ key, value: estimate[key] }));
}

