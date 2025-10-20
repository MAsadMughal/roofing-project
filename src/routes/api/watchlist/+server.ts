import { requireRole } from '$lib/server/auth';
import { json } from '$lib/server/json';
import { prisma } from '$lib/server/prisma';
import type { RequestHandler } from '@sveltejs/kit';

// List current user's watchlist leads (basic info)
export const GET: RequestHandler = async (event) => {
    requireRole(event, 'OWNER');
    const userId = event.locals.user!.id as unknown as bigint;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { watchlistLeadIds: true } });
    const leadIds = user?.watchlistLeadIds ?? [];
    if (leadIds.length === 0) return json([]);
    const leads = await prisma.lead.findMany({
        where: { id: { in: leadIds } },
        include: { customer: { select: { firstName: true, lastName: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' }
    });
    return json(leads.map((l) => ({
        ...l,
        first_name: l.customer?.firstName,
        last_name: l.customer?.lastName,
        email: l.customer?.email,
        phone: l.customer?.phone,
        watchlisted: true
    })));
};

// Add lead to watchlist
export const POST: RequestHandler = async (event) => {
    requireRole(event, 'OWNER');
    const userId = event.locals.user!.id as unknown as bigint;
    const body = await event.request.json().catch(() => ({} as any));
    const { leadId } = body ?? {};
    if (!leadId) return json({ error: 'leadId required' }, { status: 400 });
    const data = await prisma.user.update({
        where: { id: userId },
        data: { watchlistLeadIds: { push: BigInt(leadId) } }
    });
    console.log(data)
    return json({ ok: true });
};

// Remove lead from watchlist
export const DELETE: RequestHandler = async (event) => {
    requireRole(event, 'OWNER');
    const userId = event.locals.user!.id as unknown as bigint;
    const leadIdParam = event.url.searchParams.get('leadId');
    if (!leadIdParam) return json({ error: 'leadId required' }, { status: 400 });
    const leadId = BigInt(leadIdParam);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { watchlistLeadIds: true } });
    const next = (user?.watchlistLeadIds ?? []).filter((id) => id !== leadId);
    await prisma.user.update({ where: { id: userId }, data: { watchlistLeadIds: next } });
    return json({ ok: true });
};


