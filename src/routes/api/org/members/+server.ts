import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    requireAuth(event);
    const user = event.locals.user!;
    const contractorId = (user.contractorId ?? user.id) as unknown as bigint;

    const members = await prisma.user.findMany({
        where: {
            OR: [
                { contractorId },
                { id: contractorId }
            ],
            NOT: { id: user.id as unknown as bigint }
        },
        select: { id: true, firstName: true, lastName: true, email: true, role: true, lastSeenAt: true }
    });
    const now = new Date();
    const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
    return json(members.map((m) => ({ id: Number(m.id), name: `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim(), email: m.email, role: m.role, online: !!(m.lastSeenAt && now.getTime() - new Date(m.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS) })));
};


