import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	const estimate = await prisma.estimate.findUnique({
		where: { id },
		include: { items: true }
	});
	if (!estimate) return new Response('Not Found', { status: 404 });
	return json(estimate);
};

export const PUT: RequestHandler = async (event) => {
	const { params, request, locals } = event;
	const id = BigInt(params.id);
	const body = await request.json();

	// Only update attributes that come from frontend
	const dataToUpdate: any = {};
	const detailsToUpdate: any = {};

	// Used for assignment/history logic
	let assignmentId: bigint | undefined = undefined;

	// If status is being set to 'saved', check for other 'saved' estimates (not draft/final),
	// prevent more than one 'saved' estimate for the same assignment.
	if (
		'status' in body &&
		String(body.status).toLowerCase() === 'saved'
	) {
		// Find the assignmentId for this estimate
		const currentEstimate = await prisma.estimate.findUnique({
			where: { id },
			select: { assignmentId: true }
		});
		assignmentId = currentEstimate?.assignmentId;
		if (assignmentId) {
			// Look for any other estimate (not this id) with status 'saved' for this assignment
			const anotherSaved = await prisma.estimate.findFirst({
				where: {
					assignmentId: assignmentId,
					id: { not: id },
					OR: [
						{ status: 'saved' },
						{ status: 'final' }
					]
				}
			});
			if (anotherSaved) {
				return new Response(
					JSON.stringify({ error: 'There is already an estimate with Saved or Final status for this assignment.' }),
					{ status: 400, headers: { 'content-type': 'application/json' } }
				);
			}
		}
	}

	// If the estimate items array is sent, process them and recalculate totals etc.
	let recalc = false;
	let normalizedItems = undefined;
	let baseSubtotal = 0, wasteMultiplier = 1, subtotal = 0, taxRate = 0, taxAmount = 0, totalAmount = 0;

	// If items are present and is array
	if (Array.isArray(body.items)) {
		recalc = true;
		// Normalize items as in POST
		normalizedItems = body.items.map((it: any, idx: number) => ({
			id: it.id ?? idx + 1,
			label: String(it.label ?? it.description ?? ''),
			quantity: Number(it.quantity ?? 1),
			unitPrice: Number(it.unitPrice ?? it.price ?? 0),
			total: Number((Number(it.quantity ?? 1) * Number(it.unitPrice ?? it.price ?? 0)).toFixed(2))
		}));
		baseSubtotal = normalizedItems.reduce((sum: number, it: any) => sum + it.total, 0);
		wasteMultiplier = 1 + Math.max(0, Number(body.wasteFactor) || 0) / 100;
		subtotal = Number((baseSubtotal * wasteMultiplier).toFixed(2));
		taxRate = Number(body.taxRate ?? 0);
		taxAmount = Number(((subtotal - Number(body.discount || 0)) * (Math.max(0, taxRate) / 100)).toFixed(2));
		totalAmount = Number((subtotal - Number(body.discount || 0) + taxAmount).toFixed(2));

		// for update
		dataToUpdate.subtotal = subtotal as any;
		dataToUpdate.taxRate = taxRate as any;
		dataToUpdate.totalAmount = totalAmount as any;
	}

	// Only update fields explicitly present in body
	if ('notes' in body) dataToUpdate.notes = body.notes;
	if ('taxRate' in body && !recalc) dataToUpdate.taxRate = Number(body.taxRate ?? 0);
	if ('discount' in body && !recalc) dataToUpdate.discount = Number(body.discount) || 0;
	if ('wasteFactor' in body && !recalc) dataToUpdate.wasteFactor = Number(body.wasteFactor) || 0;
	if ('status' in body) dataToUpdate.status = body.status?.toLowerCase();

	// If details exist, update details object
	if ('items' in body || 'notes' in body || 'taxRate' in body || 'discount' in body || 'wasteFactor' in body) {
		// Get the current estimate's previous details (for partial update)
		const prevEstimate = await prisma.estimate.findUnique({
			where: { id },
			select: { details: true }
		});
		const prevDetails = (typeof prevEstimate?.details === "object" && prevEstimate?.details !== null) ? prevEstimate.details as any : {};

		detailsToUpdate.items = normalizedItems ?? prevDetails.items;
		detailsToUpdate.taxRate = "taxRate" in body ? (taxRate || Number(body.taxRate ?? 0)) : prevDetails.taxRate;
		detailsToUpdate.discount = "discount" in body ? (Number(body.discount) || 0) : prevDetails.discount;
		detailsToUpdate.wasteFactor = "wasteFactor" in body ? (Number(body.wasteFactor) || 0) : prevDetails.wasteFactor;
		detailsToUpdate.notes = ("notes" in body) ? (body.notes ?? "") : prevDetails.notes;

		dataToUpdate.details = detailsToUpdate;
	}

	const updated = await prisma.estimate.update({
		where: { id },
		data: dataToUpdate
	});

	// ---- Record history event when changing to saved, if not already recorded ----
	if (
		'status' in body &&
		String(body.status).toLowerCase() === 'saved' &&
		assignmentId // already set above if status is 'saved'
	) {
		// Get the assignment to check its history, avoid duplicate
		const assignment = await prisma.assignment.findUnique({
			where: { id: assignmentId },
			select: { history: true }
		});
		let history: any[] = Array.isArray(assignment?.history) ? assignment!.history as any[] : [];

		// Check if any event of type "estimateSaved" for this estimate id is in history
		const alreadyRecorded = history.some((e) => e.type === 'estimateSaved' && String(e.estimateId) === String(id));
		if (!alreadyRecorded) {
			// Record the event. Try to get some actor information from event.locals.user (if present)
			const user = locals && locals.user
				? {
					id: Number(locals.user.id),
					name: `${locals.user.firstName ?? ''} ${locals.user.lastName ?? ''}`.trim(),
					role: locals.user.role ?? undefined
				}
				: undefined;

			const newEvent = {
				type: 'estimateSaved',
				at: new Date().toISOString(),
				estimateId: Number(id),
				assignor: user
			};

			const updatedHistory = [...history, newEvent];

			await prisma.assignment.update({
				where: { id: assignmentId },
				data: { history: updatedHistory, role: 'Sales Rep' }
			});
		}
	}

	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	await prisma.estimate.delete({ where: { id } });
	return new Response(null, { status: 204 });
};


