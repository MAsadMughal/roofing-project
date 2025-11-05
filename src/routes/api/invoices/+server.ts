import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ url }) => {
	const status = url.searchParams.get('status') ?? undefined;
	const rows = await prisma.invoice.findMany({
		where: status ? { status: status } : undefined,
		include: { 
			customer: { select: { firstName: true, lastName: true, email: true } },
			items: true,
			job: { select: { id: true, title: true } }
		},
		orderBy: { createdAt: 'desc' },
		take: 100
	});
	return json(rows.map((i) => ({ 
		...i, 
		first_name: i.customer.firstName, 
		last_name: i.customer.lastName 
	})));
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	
	// Calculate totals from items if provided
	let subtotal = 0;
	let items = [];
	
	if (body.items && Array.isArray(body.items) && body.items.length > 0) {
		items = body.items.map((item: any) => {
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
	}
	
	const taxRate = Number(body.tax_rate || body.taxRate || 0);
	const taxAmount = (subtotal * taxRate) / 100;
	const totalAmount = subtotal + taxAmount;
	
	const created = await prisma.invoice.create({
		data: {
			customerId: BigInt(body.customer_id),
			jobId: body.job_id ? BigInt(body.job_id) : null,
			estimateId: body.estimate_id ? BigInt(body.estimate_id) : null,
			createdById: body.created_by_id ? BigInt(body.created_by_id) : null,
			status: body.status ?? 'created',
			invoiceNumber: body.invoice_number || null,
			dueDate: body.due_date ? new Date(body.due_date) : null,
			subtotal: subtotal,
			taxRate: taxRate,
			taxAmount: taxAmount,
			totalAmount: totalAmount,
			notes: body.notes || null
		}
	});
	
	// Create invoice items if provided
	if (items.length > 0) {
		await prisma.invoiceItem.createMany({
			data: items.map((item: any) => ({
				invoiceId: created.id,
				...item
			}))
		});
	}
	
	// Fetch the created invoice with items
	const invoiceWithItems = await prisma.invoice.findUnique({
		where: { id: created.id },
		include: { items: true, customer: true }
	});
	
	return json(invoiceWithItems, { status: 201 });
};


