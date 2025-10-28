import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth, requireRole } from '$lib/server/auth';

// PATCH: update current user's assignment for this lead (REP) or a specific rep (OWNER)
export const PATCH: RequestHandler = async (event) => {
    requireAuth(event);
    const { params, locals, request } = event;
    const leadId = BigInt(params.id ?? '');
    const user = locals.user!;
    const body = await request.json().catch(() => ({} as any));
    const { status, inspectionDate, inspectorId, assignedToId } = body ?? {};

    // Allowed statuses per request
    const allowedStatuses = new Set(['assigned', 'in_contact', 'inspection_scheduled', 'closed']);
    if (status && !allowedStatuses.has(status)) {
        return json({ error: 'Invalid status' }, { status: 400 });
    }

    // Determine which assignment to update
    let where: any = { leadId };
    if (user.role === 'REP') {
        where.assignedToId = user.id as unknown as bigint;
    } else if (user.role === 'OWNER') {
        if (!assignedToId) return json({ error: 'assignedToId required for owner updates' }, { status: 400 });
        where.assignedToId = BigInt(assignedToId);
    } else {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    const current = await prisma.assignment.findFirst({ where, orderBy: { assignedAt: 'desc' } });
    if (!current) return json({ error: 'Assignment not found' }, { status: 404 });

    // Status-specific validation
    if (status === 'inspection_scheduled') {
        if (!inspectionDate) {
            return json({ error: 'inspectionDate is required' }, { status: 400 });
        }
        if (!inspectorId) {
            return json({ error: 'inspectorId is required' }, { status: 400 });
        }
    }

    const data: any = {};
    if (status && status !== current.status) {
        data.status = status;
        data.lastStatusChangedAt = new Date();
    }
    if (inspectionDate !== undefined) {
        data.inspectionDate = inspectionDate ? new Date(inspectionDate) : null;
    }
    if (inspectorId !== undefined) {
        data.estimatorId = inspectorId ? BigInt(inspectorId) : null;
    }

    // Build history event
    let historyEvent: any | null = null;
    if (status && status !== (current as any).status) {
        const assignor = { id: user.id, name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() };
        const assignedTo = await prisma.user.findUnique({ where: { id: current.assignedToId } }).catch(() => null);
        if (status === 'assigned') {
            historyEvent = {
                type: 'statusAssigned',
                assignor,
                assignee: { id: current.assignedToId, name: `${assignedTo?.firstName ?? ''} ${assignedTo?.lastName ?? ''}`.trim() },
                at: new Date().toISOString()
            };
        } else if (status === 'in_contact') {
            historyEvent = { type: 'inContact', assignor, at: new Date().toISOString() };
        } else if (status === 'inspection_scheduled') {
            const inspector = await prisma.user.findUnique({ where: { id: BigInt(inspectorId) } }).catch(() => null);
            historyEvent = {
                type: 'inspectionScheduled',
                assignor,
                assignee: { id: BigInt(inspectorId), name: `${inspector?.firstName ?? ''} ${inspector?.lastName ?? ''}`.trim() },
                at: new Date().toISOString(),
                date: inspectionDate || null
            };
        } else if (status === 'closed') {
            historyEvent = { type: 'closed', assignor, at: new Date().toISOString() };
        }
    }

    const updated = await prisma.assignment.update({
        where: { id: current.id },
        data: {
            ...data,
            role: 'Estimator',
            history: historyEvent ? [...(current.history as any[] ?? []), historyEvent] as any : (current.history as any)
        }
    });


    return json({ ok: true, assignment: updated });
};
