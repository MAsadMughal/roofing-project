import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	const row = await prisma.invoice.findUnique({ 
		where: { id },
		include: { 
			customer: true,
			items: true,
			job: { select: { id: true, title: true } },
			estimate: { select: { id: true } }
		}
	});
	if (!row) return new Response('Not Found', { status: 404 });
	return json(row);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = BigInt(params.id);
	const body = await request.json();
	
	// Handle items if provided
	if (body.items && Array.isArray(body.items)) {
		// Delete existing items
		await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
		
		// Calculate totals from items
		let subtotal = 0;
		const items = body.items.map((item: any) => {
			const quantity = Number(item.quantity || 1);
			const unitPrice = Number(item.unit_price || item.unitPrice || 0);
			const total = quantity * unitPrice;
			subtotal += total;
			return {
				name: item.name || item.label || '',
				description: item.description || null,
				quantity: quantity,
				unitPrice: unitPrice,
				total: total
			};
		});
		
		// Create new items
		await prisma.invoiceItem.createMany({
			data: items.map((item: any) => ({
				invoiceId: id,
				...item
			}))
		});
		
		// Calculate tax and total
		const taxRate = Number(body.tax_rate || body.taxRate || 0);
		const taxAmount = (subtotal * taxRate) / 100;
		const totalAmount = subtotal + taxAmount;
		
		const row = await prisma.invoice.update({
			where: { id },
			data: {
				customerId: body.customer_id ? BigInt(body.customer_id) : undefined,
				jobId: body.job_id ? BigInt(body.job_id) : undefined,
				estimateId: body.estimate_id ? BigInt(body.estimate_id) : undefined,
				status: body.status ?? undefined,
				dueDate: body.due_date ? new Date(body.due_date) : undefined,
				subtotal: subtotal,
				taxRate: taxRate,
				taxAmount: taxAmount,
				totalAmount: totalAmount,
				notes: body.notes ?? undefined,
				invoiceNumber: body.invoice_number ?? undefined,
				updatedAt: new Date()
			}
		});
		return json(row);
	}
	
	const updateData: any = {};
	
	if (body.customer_id !== undefined) updateData.customerId = BigInt(body.customer_id);
	if (body.job_id !== undefined) updateData.jobId = body.job_id ? BigInt(body.job_id) : null;
	if (body.estimate_id !== undefined) updateData.estimateId = body.estimate_id ? BigInt(body.estimate_id) : null;
	if (body.status !== undefined) updateData.status = body.status;
	if (body.due_date !== undefined) updateData.dueDate = body.due_date ? new Date(body.due_date) : null;
	if (body.total_amount !== undefined) updateData.totalAmount = body.total_amount;
	if (body.subtotal !== undefined) updateData.subtotal = body.subtotal;
	if (body.tax_rate !== undefined) updateData.taxRate = body.tax_rate;
	if (body.tax_amount !== undefined) updateData.taxAmount = body.tax_amount;
	if (body.notes !== undefined) updateData.notes = body.notes;
	if (body.invoice_number !== undefined) updateData.invoiceNumber = body.invoice_number;
	updateData.updatedAt = new Date();
	
	const row = await prisma.invoice.update({
		where: { id },
		data: updateData
	});
	return json(row);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	await prisma.invoice.delete({ where: { id } });
	return new Response(null, { status: 204 });
};


