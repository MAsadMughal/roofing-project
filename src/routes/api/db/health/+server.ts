import type { RequestHandler } from '@sveltejs/kit';
import { pingDatabase } from '$lib/server/db';

export const GET: RequestHandler = async () => {
    const ok = await pingDatabase();
    if (!ok) {
        return new Response(JSON.stringify({ ok: false }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
        });
    }
    return new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' }
    });
};


