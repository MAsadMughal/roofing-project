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
    const contractorRootId = event.locals.user!.contractorId ?? event.locals.user!.id;
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { contractorId: contractorRootId as unknown as bigint },
                { id: contractorRootId as unknown as bigint }
            ]
        },
        orderBy: { firstName: 'asc' },
        select: { id: true, email: true, firstName: true, lastName: true, role: true }
    }).catch(() => []);
    return { invites, users };
};



