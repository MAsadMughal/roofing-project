import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth, requireRole } from '$lib/server/auth';

// GET: list docs for an assignment (Estimator only)
export const GET: RequestHandler = async (event) => {
    requireAuth(event);
    requireRole(event, 'ESTIMATOR');
    const assignmentId = BigInt(event.params.id ?? '');

    const docs = await prisma.docs.findMany({
        where: { assignmentId },
        orderBy: { createdAt: 'desc' }
    });
    return json({ ok: true, docs });
};

// POST: upload docs refs and update assignment status -> docs_uploaded, append history
export const POST: RequestHandler = async (event) => {
    requireAuth(event);
    requireRole(event, 'ESTIMATOR');
    const { request, locals } = event;
    const assignmentId = BigInt(event.params.id ?? '');
    const body = await request.json().catch(() => ({} as any));
    const { docs } = body ?? {};

    if (!Array.isArray(docs) || docs.length === 0) {
        return json({ error: 'docs array required' }, { status: 400 });
    }

    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) return json({ error: 'Assignment not found' }, { status: 404 });

    const created = await prisma.docs.create({
        data: { assignmentId, docs }
    });

    const historyEvent = {
        type: 'docsUploaded',
        assignor: { id: locals.user!.id, role: locals.user!.role, name: locals.user!.firstName + ' ' + locals.user!.lastName },
        at: new Date().toISOString(),
        count: docs.length
    } as any;

    const updated = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
            status: 'docs_uploaded',
            lastStatusChangedAt: new Date(),
            role: 'Estimator',
            history: [...((assignment.history as any[]) ?? []), historyEvent] as any
        }
    });

    return json({ ok: true, docs: created, assignment: updated });
};


