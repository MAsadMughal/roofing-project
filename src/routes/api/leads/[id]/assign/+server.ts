import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireRole } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
    requireRole(event, 'OWNER');
    const { params } = event;
    const leadId = BigInt(params?.id ?? '');
    const body = await event.request.json().catch(() => ({} as any));
    const { userId } = body ?? {};
    if (!userId) return json({ error: 'userId required' }, { status: 400 });

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return json({ error: 'Lead not found' }, { status: 404 });

    // Only assign within same contractor org (manager to rep within org)
    const ownerContractorId = event.locals.user?.contractorId ?? event.locals.user?.id;
    const user = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
    if (!user) return json({ error: 'User not found' }, { status: 404 });
    if ((user.contractorId ?? user.id) !== ownerContractorId) {
        return json({ error: 'User is not in your organization' }, { status: 403 });
    }
    // Check if lead is already assigned to this user
    const existingAssignment = await prisma.assignment.findFirst({
        where: {
            leadId
        }
    });

    if (existingAssignment) {
        return json({ error: 'Lead is already assigned to Sales Representative' }, { status: 400 });
    }

    // Create assignment row with owner -> sales rep for this lead
    const ownerId = event.locals.user!.id as unknown as bigint;
    const assignment = await prisma.assignment.create({
        data: {
            leadId,
            ownerId,
            assignedToId: BigInt(userId),
            role: 'Sales Rep',
            status: 'assigned',
            lastStatusChangedAt: new Date()
        }
    });

    // Optionally mirror primary owner on lead for quick filtering
    const updated = await prisma.lead.update({
        where: { id: leadId },
        data: { assignedUserId: BigInt(userId), updatedAt: new Date() }
    });

    return json({ ok: true, lead: updated, assignment });
};


