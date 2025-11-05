import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

// GET all items for an invoice
export const GET: RequestHandler = async ({ params }) => {
	const invoiceId = BigInt(params.id);
	const items = await prisma.invoiceItem.findMany({
		where: { invoiceId },
		orderBy: { createdAt: 'asc' }
	});
	return json(items);
};

// POST - Create a new item for an invoice
export const POST: RequestHandler = async ({ params, request }) => {
	const invoiceId = BigInt(params.id);
	const body = await request.json();
	
	const quantity = Number(body.quantity || 1);
	const unitPrice = Number(body.unit_price || body.unitPrice || 0);
	const total = quantity * unitPrice;
	
	const item = await prisma.invoiceItem.create({
		data: {
			invoiceId,
			name: body.name || body.label || '',
			description: body.description || null,
			quantity: quantity,
			unitPrice: unitPrice,
			total: total
		}
	});
	
	// Recalculate invoice totals
	const invoice = await prisma.invoice.findUnique({
		where: { id: invoiceId },
		include: { items: true }
	});
	
	if (invoice) {
		const subtotal = invoice.items.reduce((sum, it) => sum + Number(it.total || 0), 0);
		const taxRate = Number(invoice.taxRate || 0);
		const taxAmount = (subtotal * taxRate) / 100;
		const totalAmount = subtotal + taxAmount;
		
		await prisma.invoice.update({
			where: { id: invoiceId },
			data: {
				subtotal,
				taxAmount,
				totalAmount
			}
		});
	}
	
	return json(item, { status: 201 });
};
