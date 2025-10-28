import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAuth } from '$lib/server/auth';

function mapStatus(status: string): string {
	switch (status) {
		case 'draft': return 'Draft';
		case 'leading': return 'Leading';
		case 'saved': return 'Saved';
		case 'sent': return 'Sent';
		case 'viewed': return 'Viewed';
		case 'accepted': return 'Accepted';
		case 'rejected': return 'Declined';
		default: return status;
	}
}

export const GET: RequestHandler = async (event) => {
	requireAuth(event);
	const user = event.locals.user!;
	const url = new URL(event.request.url);
	const q = url.searchParams.get('q')?.toLowerCase().trim() ?? '';
	const statusFilter = url.searchParams.get('status') || '';

	const whereByRole: any = {};
	if (user.role === 'ESTIMATOR') {
		whereByRole.assignment = { estimatorId: user.id as unknown as bigint };
	} else if (user.role === 'OWNER') {
		whereByRole.assignment = { ownerId: user.id as unknown as bigint };
	} else if (user.role === 'REP') {
		whereByRole.assignment = { assignedToId: user.id as unknown as bigint };
	}

	const results = await prisma.estimate.findMany({
		where: {
			...whereByRole,
			...(statusFilter ? { status: statusFilter.toLowerCase() } : {})
		},
		include: {
			customer: true,
			assignment: { include: { lead: true } }
		},
		orderBy: { createdAt: 'desc' }
	});

	const mapped = results
		.map((e) => {
			const customerName = `${e.customer?.firstName ?? ''} ${e.customer?.lastName ?? ''}`.trim() || (e.assignment?.lead?.title ?? 'Customer');
			return {
				id: Number(e.id), // Convert BigInt to Number
				number: `E-${e.id}`,
				date: e.createdAt.toISOString().slice(0, 10),
				customer: customerName,
				amount: Number(e.totalAmount ?? 0),
				status: mapStatus(e.status)
			};
		})
		.filter((row) => (q ? `${row.customer}`.toLowerCase().includes(q) : true));

	return new Response(JSON.stringify(mapped), { headers: { 'content-type': 'application/json' } });
};

export const POST: RequestHandler = async (event) => {
	requireAuth(event);
	const user = event.locals.user!;
	const body = await event.request.json().catch(() => ({} as any));
	const { assignmentId, items, notes, status, taxRate: inputTaxRate, discount = 0, wasteFactor = 0 } = body ?? {};
	if (!assignmentId) return new Response(JSON.stringify({ error: 'assignmentId required' }), { status: 400 });
	if (!Array.isArray(items) || items.length === 0) return new Response(JSON.stringify({ error: 'items required' }), { status: 400 });

	// Only ESTIMATORs can create estimates
	if (user.role !== 'ESTIMATOR') {
		return new Response(JSON.stringify({ error: 'Only estimators can create estimates' }), { status: 403 });
	}

	// Validate assignment access
	const assignment = await prisma.assignment.findUnique({ where: { id: BigInt(assignmentId) }, include: { lead: true } });
	if (!assignment) return new Response(JSON.stringify({ error: 'Assignment not found' }), { status: 404 });
	if (assignment.estimatorId !== (user.id as unknown as bigint)) {
		return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
	}

	// Compute totals
	const normalizedItems = items.map((it: any, idx: number) => ({
		id: it.id ?? idx + 1,
		label: String(it.label ?? it.description ?? ''),
		quantity: Number(it.quantity ?? 1),
		unitPrice: Number(it.unitPrice ?? it.price ?? 0),
		total: Number((Number(it.quantity ?? 1) * Number(it.unitPrice ?? it.price ?? 0)).toFixed(2))
	}));
	const baseSubtotal = normalizedItems.reduce((sum: number, it: any) => sum + it.total, 0);
	const wasteMultiplier = 1 + Math.max(0, Number(wasteFactor) || 0) / 100;
	const subtotal = Number((baseSubtotal * wasteMultiplier).toFixed(2));
	const taxRate = Number(inputTaxRate ?? 0);
	const taxAmount = Number(((subtotal - Number(discount || 0)) * (Math.max(0, taxRate) / 100)).toFixed(2));
	const totalAmount = Number((subtotal - Number(discount || 0) + taxAmount).toFixed(2));

	const estimate = await prisma.estimate.create({
		data: {
			assignmentId: assignment.id,
			customerId: assignment.lead!.customerId!,
			leadId: assignment.leadId,
			details: { items: normalizedItems, notes: notes ?? '', taxRate, discount, wasteFactor } as any,
			status: (status ?? 'draft').toLowerCase(),
			subtotal: subtotal as any,
			taxRate: taxRate as any,
			totalAmount: totalAmount as any,
			notes: notes ?? ''
		}
	});

	// If not draft, update latestEstimateId and history timeline
	if (estimate.status !== 'draft') {
		const historyEvent = {
			type: 'estimateCreated',
			assignor: { id: Number(user.id), name: user.firstName + ' ' + user.lastName, role: user.role }, // Convert BigInt to Number
			at: new Date().toISOString(),
			estimateId: Number(estimate.id) // Convert BigInt to Number
		} as any;
		await prisma.assignment.update({
			where: { id: assignment.id },
			data: { latestEstimateId: estimate.id as unknown as bigint, role: 'Sales Rep', history: [...((assignment.history as any[]) ?? []), historyEvent] as any }
		});
	}

	return new Response(JSON.stringify({ ok: true, id: Number(estimate.id) }), { headers: { 'content-type': 'application/json' } }); // Convert BigInt to Number
};	
