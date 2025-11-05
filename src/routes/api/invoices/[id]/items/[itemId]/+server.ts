import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

// PUT - Update an invoice item
export const PUT: RequestHandler = async ({ params, request }) => {
	const invoiceId = BigInt(params.id);
	const itemId = BigInt(params.itemId);
	const body = await request.json();
	
	const quantity = Number(body.quantity ?? 1);
	const unitPrice = Number(body.unit_price ?? body.unitPrice ?? 0);
	const total = quantity * unitPrice;
	
	const item = await prisma.invoiceItem.update({
		where: { id: itemId },
		data: {
			name: body.name ?? body.label ?? undefined,
			description: body.description ?? undefined,
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
	
	return json(item);
};

// DELETE - Delete an invoice item
export const DELETE: RequestHandler = async ({ params }) => {
	const invoiceId = BigInt(params.id);
	const itemId = BigInt(params.itemId);
	
	await prisma.invoiceItem.delete({
		where: { id: itemId }
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
	
	return new Response(null, { status: 204 });
};
