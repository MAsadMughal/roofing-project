import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    requireAuth(event);
    const userId = event.locals.user!.id as unknown as bigint;

    const rows = await prisma.assignment.findMany({
        where: { assignedToId: userId },
        include: {
            lead: { include: { customer: { select: { firstName: true, lastName: true } } } }
        },
        orderBy: { assignedAt: 'desc' },
        take: 100
    });

    return json(rows.map((a) => ({
        id: Number(a.id),
        lead_id: Number(a.leadId),
        customer_name: `${a.lead?.customer?.firstName ?? ''} ${a.lead?.customer?.lastName ?? ''}`.trim()
    })));
};


