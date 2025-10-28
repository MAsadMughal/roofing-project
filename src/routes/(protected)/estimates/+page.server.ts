import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch, url }) => {
    const role = locals.user?.role ?? null;
    const q = url.searchParams.get('q') ?? '';
    const status = url.searchParams.get('status') ?? '';
    let assignments: any[] = [];
    if (role === 'ESTIMATOR') {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (status) params.set('status', status);
        const res = await fetch(`/api/estimator/assignments${params.toString() ? `?${params.toString()}` : ''}`);
        const out = await res.json().catch(() => ({ assignments: [] }));
        assignments = (res.ok ? (Array.isArray(out) ? out : out.assignments) : []) ?? [];
    }1
    return { role, q, status, assignments, estimates: [] };
};


