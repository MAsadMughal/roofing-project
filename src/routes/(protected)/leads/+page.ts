import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
	const q = url.searchParams.get('q') ?? '';
	const status = url.searchParams.get('status') ?? '';
	const source = url.searchParams.get('source') ?? '';

	const params = new URLSearchParams();
	if (q) params.set('q', q);
	if (status) params.set('status', status);
	if (source) params.set('source', source);

	const res = await fetch(`/api/leads${params.toString() ? `?${params.toString()}` : ''}`);
	const leads = await res.json();
	return { leads, q, status, source };
};


