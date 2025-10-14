import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
    requireRole(event, 'OWNER');
    return {};
};


