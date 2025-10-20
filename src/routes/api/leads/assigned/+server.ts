import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireRole } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    requireRole(event, 'OWNER');
    const ownerId = event.locals.user!.id as unknown as bigint;

    const user = await prisma.user.findUnique({ where: { id: ownerId } });

    const leads = await prisma.lead.findMany({
        where: {
            assignments: { some: { ownerId } }
        },
        include: {
            customer: { select: { firstName: true, lastName: true, email: true, phone: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 200
    });

    return json(leads.map((l: any) => ({
        ...l,
        first_name: l.customer?.firstName,
        last_name: l.customer?.lastName,
        email: l.customer?.email,
        phone: l.customer?.phone,
        watchlisted: ((user as any)?.watchlistLeadIds ?? []).includes(l.id)
    })));
};


