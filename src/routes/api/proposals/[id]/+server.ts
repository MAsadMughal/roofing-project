import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async ({ params }) => {
    const id = BigInt(params.id as string);
	const row = await prisma.proposal.findUnique({ where: { id } });
	if (!row) return new Response('Not Found', { status: 404 });
	return json(row);
};

export const PUT: RequestHandler = async (event) => {
    requireAuth(event);
    const { params, request, locals } = event;
    const id = BigInt(params.id as string);
    const user = locals.user!;
    const body = await request.json().catch(() => ({} as any));

    const existing = await prisma.proposal.findUnique({ include: { assignment: true, estimate: true }, where: { id } });
    if (!existing) return json({ error: 'Not found' }, { status: 404 });
    if (user.role === 'REP' && existing.assignment.assignedToId !== (user.id as unknown as bigint)) {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate estimate change if provided
    if (body.estimate_id) {
        const est = await prisma.estimate.findUnique({ where: { id: BigInt(body.estimate_id) } });
        if (!est) return json({ error: 'Estimate not found' }, { status: 404 });
        if (est.assignmentId !== existing.assignmentId) {
            return json({ error: 'Estimate must belong to the same assignment' }, { status: 400 });
        }
        // If updating to sent, ensure estimate is finalized
        if ((body.status ?? existing.status) === 'sent') {
            const nonFinalStatuses = new Set(['draft', 'leading']);
            if (nonFinalStatuses.has(String(est.status || '').toLowerCase())) {
                return json({ error: 'Estimate must be finalized before sending proposal' }, { status: 400 });
            }
        }
    } else if ((body.status ?? existing.status) === 'sent') {
        // If sending and not changing estimate, validate current estimate
        const nonFinalStatuses = new Set(['draft', 'leading']);
        if (nonFinalStatuses.has(String(existing.estimate.status || '').toLowerCase())) {
            return json({ error: 'Estimate must be finalized before sending proposal' }, { status: 400 });
        }
    }

    const nextStatus: string | undefined = body.status ? String(body.status).toLowerCase() : undefined;

    const updated = await prisma.proposal.update({
        where: { id },
        data: {
            estimateId: body.estimate_id ? BigInt(body.estimate_id) : undefined,
            subject: body.subject ?? undefined,
            content: body.content ?? undefined,
            status: nextStatus ?? undefined,
            sentAt: nextStatus === 'sent' && !existing.sentAt ? new Date() : undefined,
            viewedAt: nextStatus === 'viewed' ? new Date() : undefined,
            signedAt: body.signed_at ? new Date(body.signed_at) : undefined,
            updatedAt: new Date()
        } as any
    });

    // History update on transitions
    if (nextStatus === 'sent') {
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
    }

    return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
    const id = BigInt(params.id as string);
	await prisma.proposal.delete({ where: { id } });
	return new Response(null, { status: 204 });
};


