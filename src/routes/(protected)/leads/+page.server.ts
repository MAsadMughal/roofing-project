import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
    requireAuth(event);
    return {};
};


