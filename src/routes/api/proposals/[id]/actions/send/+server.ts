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
        include: { assignment: true, estimate: true }
    });
    if (!existing) return json({ error: 'Not found' }, { status: 404 });
    if (user.role === 'REP' && existing.assignment.assignedToId !== (user.id as unknown as bigint)) {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    const nonFinalStatuses = new Set(['draft', 'leading']);
    if (nonFinalStatuses.has(String(existing.estimate.status || '').toLowerCase())) {
        return json({ error: 'Estimate must be finalized before sending proposal' }, { status: 400 });
    }

    const updated = await prisma.proposal.update({
        where: { id },
        data: { status: 'sent', sentAt: existing.sentAt ? existing.sentAt : new Date(), updatedAt: new Date() }
    });

    const assignment = await prisma.assignment.findUnique({ where: { id: existing.assignmentId } });
    const historyEvent = {
        type: 'proposalSent',
        assignor: { id: Number(user.id), name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(), role: user.role },
        at: new Date().toISOString(),
        proposalId: Number(updated.id),
        estimateId: Number(updated.estimateId)
    } as any;
    await prisma.assignment.update({
        where: { id: existing.assignmentId },
        data: {
            latestProposalId: updated.id as unknown as bigint,
            history: [...(((assignment?.history as any[]) ?? [])), historyEvent] as any,
            status: 'proposal_sent',
            lastStatusChangedAt: new Date()
        }
    });

    return json({ ok: true });
};


