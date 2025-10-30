import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth, requireRole } from '$lib/server/auth';
import { createSupabaseAdminClient } from '$lib/supabase';

async function getAllDocsRows(assignmentId: bigint) {
	return prisma.docs.findMany({
		where: { assignmentId },
		orderBy: { createdAt: 'desc' }
	});
}

export const DELETE: RequestHandler = async (event) => {
	requireAuth(event);
	requireRole(event, 'ESTIMATOR');
	const assignmentId = BigInt(event.params.id ?? '');
	const docId = event.params.docId as string;
	if (!docId) return json({ error: 'docId required' }, { status: 400 });

	const rows = await getAllDocsRows(assignmentId);
	if (!rows || rows.length === 0) return json({ error: 'No documents found' }, { status: 404 });

	let foundRow: any = null;
	let foundIdx = -1;
	let toDelete: any = null;
	for (const r of rows) {
		const list = (r.docs as any[]) || [];
		const i = list.findIndex((d) => d.id === docId);
		if (i !== -1) { foundRow = r; foundIdx = i; toDelete = list[i]; break; }
	}
	if (!foundRow) return json({ error: 'Document not found' }, { status: 404 });
	// Remove from storage first (best-effort)
	try {
		const admin = createSupabaseAdminClient();
		const bucket = toDelete.bucket || 'assignment-docs';
		if (toDelete.storagePath) {
			await admin.storage.from(bucket).remove([toDelete.storagePath]);
		}
	} catch (e) {
		// proceed even if storage delete fails; you may want to log this
	}

	const updatedDocs = ((foundRow.docs as any[]) || []).filter((d) => d.id !== docId);
	if (updatedDocs.length === 0) {
		await prisma.docs.delete({ where: { id: foundRow.id } });
	} else {
		await prisma.docs.update({ where: { id: foundRow.id }, data: { docs: updatedDocs } });
	}

	// Return merged fresh docs
	const refreshedRows = await getAllDocsRows(assignmentId);
	const merged = refreshedRows.flatMap((r) => (r.docs as any[]));
	return json({ ok: true, docs: { assignmentId: assignmentId.toString(), docs: merged } });
};

export const PATCH: RequestHandler = async (event) => {
	requireAuth(event);
	requireRole(event, 'ESTIMATOR');
	const assignmentId = BigInt(event.params.id ?? '');
	const docId = event.params.docId as string;
	if (!docId) return json({ error: 'docId required' }, { status: 400 });

	const body = await event.request.json().catch(() => null);
	const newName = body?.name?.toString()?.trim();
	if (!newName) return json({ error: 'name required' }, { status: 400 });

	const rows = await getAllDocsRows(assignmentId);
	if (!rows || rows.length === 0) return json({ error: 'No documents found' }, { status: 404 });

	let foundRow: any = null;
	let foundIdx = -1;
	for (const r of rows) {
		const list = (r.docs as any[]) || [];
		const i = list.findIndex((d) => d.id === docId);
		if (i !== -1) { foundRow = r; foundIdx = i; break; }
	}
	if (!foundRow) return json({ error: 'Document not found' }, { status: 404 });

	const docs = (foundRow.docs as any[]) || [];
	docs[foundIdx] = { ...docs[foundIdx], name: newName };
	await prisma.docs.update({ where: { id: foundRow.id }, data: { docs } });

	const refreshedRows = await getAllDocsRows(assignmentId);
	const merged = refreshedRows.flatMap((r) => (r.docs as any[]));
	return json({ ok: true, docs: { assignmentId: assignmentId.toString(), docs: merged } });
};


