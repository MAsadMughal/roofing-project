import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireRole } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    requireRole(event, 'OWNER');
    const role = event.url.searchParams.get('role') ?? undefined;
    const contractorId = event.locals.user?.contractorId ?? event.locals.user?.id;
    const users = await prisma.user.findMany({
        where: {
            role: role ?? undefined,
            OR: [
                { contractorId: contractorId as unknown as bigint },
                { id: contractorId as unknown as bigint } // in case owner uses self-id as contractor root
            ]
        },
        orderBy: { firstName: 'asc' }
    });
    return json(users.map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role })));
};


