import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
    const res = await fetch('/api/watchlist');
    const leads = await res.json();
    return { leads };
};


