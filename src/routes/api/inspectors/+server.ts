import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    requireAuth(event);
    const role = event.locals.user?.role;
    if (role !== 'OWNER' && role !== 'REP') {
        return json({ error: 'Forbidden' }, { status: 403 });
    }
    const contractorId = event.locals.user?.contractorId ?? event.locals.user?.id;
    const users = await prisma.user.findMany({
        where: {
            role: 'INSPECTOR',
            OR: [
                { contractorId: contractorId as unknown as bigint },
                { id: contractorId as unknown as bigint }
            ]
        },
        orderBy: { firstName: 'asc' }
    });
    return json(users.map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role })));
};


