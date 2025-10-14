import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const POST: RequestHandler = async ({ locals, cookies }) => {
    const sessionId = locals.sessionId;
    if (sessionId) {
        await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    }
    cookies.set('session', '', { path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 0 });
    return new Response(null, { status: 204 });
};