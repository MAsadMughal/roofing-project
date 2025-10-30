import type { RequestHandler } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    requireAuth(event);
    return new Response(JSON.stringify({ error: 'PDF generation not implemented' }), {
        status: 501,
        headers: { 'content-type': 'application/json' }
    });
};


