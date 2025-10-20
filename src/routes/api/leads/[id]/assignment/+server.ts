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
    const { status, inspectionDate, laborIds, assignedToId } = body ?? {};

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
        if (!Array.isArray(laborIds) || laborIds.length === 0) {
            return json({ error: 'At least one inspector (laborIds) is required' }, { status: 400 });
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
    if (Array.isArray(laborIds)) {
        data.laborIds = laborIds.map((v: any) => BigInt(v));
    }

    const updated = await prisma.assignment.update({ where: { id: current.id }, data });

    // Optional: sync lead.assigned_user_id if status is assigned/in_contact (owner choice)
    if (status && (status === 'assigned' || status === 'in_contact')) {
        try {
            await prisma.lead.update({ where: { id: leadId }, data: { assignedUserId: updated.assignedToId, updatedAt: new Date() } });
        } catch {}
    }

    return json({ ok: true, assignment: updated });
};


