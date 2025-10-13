import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
	const q = url.searchParams.get('q') ?? '';
	const status = url.searchParams.get('status') ?? '';
	const dateFrom = url.searchParams.get('dateFrom') ?? '';
	const dateTo = url.searchParams.get('dateTo') ?? '';

	const params = new URLSearchParams();
	if (q) params.set('q', q);
	if (status) params.set('status', status);
	if (dateFrom) params.set('dateFrom', dateFrom);
	if (dateTo) params.set('dateTo', dateTo);

	const res = await fetch(`/api/jobs${params.toString() ? `?${params.toString()}` : ''}`);
	const jobs = await res.json();
	return { jobs, q, status, dateFrom, dateTo };
};


