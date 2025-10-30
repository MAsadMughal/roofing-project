import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth, requireRole } from '$lib/server/auth';
import { uploadFileServer } from '$lib/supabase';
import { randomUUID } from 'node:crypto';

// GET: list docs for an assignment (Estimator only)
export const GET: RequestHandler = async (event) => {
    requireAuth(event);
    requireRole(event, 'ESTIMATOR');
    const assignmentId = BigInt(event.params.id ?? '');

    const rows = await prisma.docs.findMany({
        where: { assignmentId },
        orderBy: { createdAt: 'desc' }
    });

    // Backfill missing IDs/bucket on legacy docs in-place
    for (const row of rows) {
        let changed = false;
        const updated = (row.docs as any[]).map((d: any) => {
            if (!d.id) { d.id = randomUUID(); changed = true; }
            if (!d.bucket) { d.bucket = 'assignment-docs'; changed = true; }
            return d;
        });
        if (changed) {
            await prisma.docs.update({ where: { id: row.id }, data: { docs: updated } });
        }
    }

    // Re-fetch if any were changed
    const effectiveRows = rows.length ? await prisma.docs.findMany({
        where: { assignmentId },
        orderBy: { createdAt: 'desc' }
    }) : rows;

    const merged = effectiveRows.flatMap((r) => (r.docs as any[])).sort((a: any, b: any) => {
        const ta = new Date(a.uploadedAt ?? a.createdAt ?? 0).getTime();
        const tb = new Date(b.uploadedAt ?? b.createdAt ?? 0).getTime();
        return tb - ta;
    });

    return json({ ok: true, docs: { assignmentId: assignmentId.toString(), docs: merged } });
};

// POST: upload docs refs and update assignment status -> docs_uploaded, append history

export const POST: RequestHandler = async (event) => {
    requireAuth(event);
    requireRole(event, 'ESTIMATOR');
    const { request, locals } = event;
    const assignmentId = BigInt(event.params.id ?? '');

    // Check if it's a multipart/form-data request
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
        return json({ error: 'Request must be multipart/form-data' }, { status: 400 });
    }

    // Parse formdata
    const formData = await request.formData();
    const files = formData.getAll('files');
    if (!files || files.length === 0) {
        return json({ error: 'No files found' }, { status: 400 });
    }

    // Check assignment exists
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) return json({ error: 'Assignment not found' }, { status: 404 });

    // Upload all files to supabase
    const uploadedDocs: any[] = [];
    const bucket = 'assignment-docs';
    for (const file of files) {
        // SvelteKit's formData.getAll() gives us File objects in Node.js 18+
        if (!(file instanceof Blob)) continue;
        const input = {
            bucket,
            file,
            // path: `assignments/${assignmentId}/${(file as any).name}`,
            path: `assignments/${assignmentId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${(file as any).name}`,
            upsert: false
        };
        try {
            const { path, publicUrl } = await uploadFileServer(input);
            uploadedDocs.push({
                id: randomUUID(),
                bucket,
                name: (file as any).name,
                size: (file as any).size,
                type: (file as any).type,
                storagePath: path,
                url: publicUrl,
                uploadedAt: new Date().toISOString()
            });
        } catch (e: any) {
            console.log(e)
            return json({ error: `Failed to upload file: ${(file as any).name}`, details: e?.message }, { status: 500 });
        }
    }

    if (uploadedDocs.length === 0) {
        return json({ error: 'No files were uploaded' }, { status: 400 });
    }

    // Append to latest row if exists, else create new
    const latest = await prisma.docs.findFirst({ where: { assignmentId }, orderBy: { createdAt: 'desc' } });
    let createdOrUpdated: any;
    if (latest) {
        const existing = (latest.docs as any[]) || [];
        createdOrUpdated = await prisma.docs.update({
            where: { id: latest.id },
            data: { docs: [...existing, ...uploadedDocs] }
        });
    } else {
        createdOrUpdated = await prisma.docs.create({
            data: {
                assignmentId,
                docs: uploadedDocs
            }
        });
    }

    // Compose history event
    const historyEvent = {
        type: 'docsUploaded',
        assignor: { id: locals.user!.id, role: locals.user!.role, name: locals.user!.firstName },
        at: new Date().toISOString(),
        count: uploadedDocs.length,
        docNames: uploadedDocs.map(d => d.name)
    } as any;

    // Update assignment status/history
    const updated = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
            status: 'docs_uploaded',
            lastStatusChangedAt: new Date(),
            role: 'Estimator',
            history: [...((assignment.history as any[]) ?? []), historyEvent] as any
        }
    });

    return json({ ok: true, docs: createdOrUpdated, assignment: updated });
};


