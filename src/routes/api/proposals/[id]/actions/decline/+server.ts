import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
    requireAuth(event);
    const { params, locals } = event;
    const user = locals.user!;
    const id = BigInt(params.id ?? '');

    const existing = await prisma.proposal.findUnique({
        where: { id },
        include: { assignment: true }
    });
    if (!existing) return json({ error: 'Not found' }, { status: 404 });
    if (user.role === 'REP' && existing.assignment.assignedToId !== (user.id as unknown as bigint)) {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.proposal.update({
        where: { id },
        data: { status: 'declined', updatedAt: new Date() }
    });

    const assignment = await prisma.assignment.findUnique({ where: { id: existing.assignmentId } });
    const historyEvent = {
        type: 'proposalDeclined',
        assignor: { id: Number(user.id), name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(), role: user.role },
        at: new Date().toISOString(),
        proposalId: Number(updated.id)
    } as any;
    await prisma.assignment.update({
        where: { id: existing.assignmentId },
        data: {
            history: [...(((assignment?.history as any[]) ?? [])), historyEvent] as any,
            lastStatusChangedAt: new Date()
        }
    });

    return json({ ok: true });
};


