import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
    requireAuth(event);
    const userId = event.locals.user!.id as unknown as bigint;
    await prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } });
    return json({ ok: true });
};


