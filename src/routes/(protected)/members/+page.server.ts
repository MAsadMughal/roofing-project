import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async (event) => {
    requireRole(event, 'OWNER');
    const invites = await prisma.invite.findMany({
        where: { ownerId: event.locals.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 20
    }).catch(() => []);
    return { invites };
};



