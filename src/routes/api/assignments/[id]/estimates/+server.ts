import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    requireAuth(event);
    const user = event.locals.user!;
    const assignmentId = BigInt(event.params.id ?? '');

    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) return json({ error: 'Assignment not found' }, { status: 404 });
    if (user.role === 'REP' && assignment.assignedToId !== (user.id as unknown as bigint)) {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = await prisma.estimate.findMany({
        where: {
            assignmentId,
            status: 'saved'
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    console.log(rows)
    return json(rows.map((e) => ({ id: Number(e.id), total_amount: e.totalAmount, status: e.status })));
};


