import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    requireAuth(event);
    const { url, locals } = event;
    const status = url.searchParams.get('status') ?? undefined;
    const q = url.searchParams.get('q') ?? undefined;
    const userId = locals.user!.id as unknown as bigint;

    const where: any = {
        status: status ?? undefined,
        // proposals for assignments belonging to this rep
        assignment: { assignedToId: userId },
        estimate: q
            ? {
                  customer: {
                      OR: [
                          { firstName: { contains: q, mode: 'insensitive' } },
                          { lastName: { contains: q, mode: 'insensitive' } }
                      ]
                  }
              }
            : undefined
    };

    const rows = await prisma.proposal.findMany({
        where,
        include: {
            estimate: {
                select: {
                    totalAmount: true,
                    createdAt: true,
                    customer: { select: { firstName: true, lastName: true } }
                }
            },
            assignment: { select: { id: true, leadId: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 200
    });

    return json(
        rows.map((p) => ({
            id: Number(p.id),
            assignment_id: Number(p.assignmentId),
            estimate_id: Number(p.estimateId),
            status: p.status,
            sent_at: p.sentAt,
            created_at: p.createdAt,
            total_amount: p.estimate?.totalAmount,
            first_name: p.estimate?.customer.firstName,
            last_name: p.estimate?.customer.lastName
        }))
    );
};

export const POST: RequestHandler = async (event) => {
    requireAuth(event);
    const user = event.locals.user!;
    const body = await event.request.json().catch(() => ({} as any));
    const { assignment_id, estimate_id, subject, content, status } = body ?? {};

    if (!assignment_id) return json({ error: 'assignment_id required' }, { status: 400 });
    if (!estimate_id) return json({ error: 'estimate_id required' }, { status: 400 });

    const assignment = await prisma.assignment.findUnique({ where: { id: BigInt(assignment_id) } });
    if (!assignment) return json({ error: 'Assignment not found' }, { status: 404 });
    if (user.role === 'REP' && assignment.assignedToId !== (user.id as unknown as bigint)) {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    const estimate = await prisma.estimate.findUnique({ where: { id: BigInt(estimate_id) } });
    if (!estimate) return json({ error: 'Estimate not found' }, { status: 404 });
    if (estimate.assignmentId !== assignment.id) {
        return json({ error: 'Estimate does not belong to the assignment' }, { status: 400 });
    }

    // Only one draft per assignment
    const existingDraft = await prisma.proposal.findFirst({ where: { assignmentId: assignment.id, status: 'draft' } });
    if ((status ?? 'draft') === 'draft' && existingDraft) {
        return json({ error: 'A draft proposal already exists for this assignment' }, { status: 400 });
    }

    // If sending final proposal now, require a non-draft estimate
    if ((status ?? 'draft') === 'sent') {
        const nonFinalStatuses = new Set(['draft', 'leading']);
        if (nonFinalStatuses.has(String(estimate.status || '').toLowerCase())) {
            return json({ error: 'Estimate must be finalized before sending proposal' }, { status: 400 });
        }
    }

    const created = await prisma.proposal.create({
        data: {
            assignmentId: assignment.id,
            estimateId: estimate.id,
            subject: subject ?? null,
            content: content ?? null,
            status: (status ?? 'draft').toLowerCase(),
            sentAt: (status ?? 'draft') === 'sent' ? new Date() : null
        } as any
    });

    // If sent, update assignment history and latestProposalId
    if ((status ?? 'draft') === 'sent') {
        const historyEvent = {
            type: 'proposalSent',
            assignor: { id: Number(user.id), name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(), role: user.role },
            at: new Date().toISOString(),
            proposalId: Number(created.id),
            estimateId: Number(estimate.id)
        } as any;
        await prisma.assignment.update({
            where: { id: assignment.id },
            data: {
                latestProposalId: created.id as unknown as bigint,
                history: [...(((assignment.history as any[]) ?? [])), historyEvent] as any,
                status: 'proposal_sent',
                lastStatusChangedAt: new Date()
            }
        });
    }

    return json({ ok: true, id: Number(created.id) }, { status: 201 });
};


