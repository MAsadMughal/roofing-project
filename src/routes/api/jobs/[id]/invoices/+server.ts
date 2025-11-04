import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth, hasRole } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params } = event;
	const jobId = BigInt(params.id);

	try {
		const invoices = await prisma.invoice.findMany({
			where: { jobId },
			include: {
				items: true,
				payments: true,
				createdBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		});

		return json(
			invoices.map((inv) => ({
				id: String(inv.id),
				invoiceNumber: inv.invoiceNumber,
				status: inv.status,
				subtotal: Number(inv.subtotal),
				taxRate: inv.taxRate ? Number(inv.taxRate) : 0,
				taxAmount: Number(inv.taxAmount),
				totalAmount: Number(inv.totalAmount),
				dueDate: inv.dueDate?.toISOString() || null,
				notes: inv.notes,
				items: inv.items.map((item) => ({
					id: String(item.id),
					name: item.name,
					description: item.description,
					quantity: Number(item.quantity),
					unitPrice: Number(item.unitPrice),
					total: Number(item.total)
				})),
				payments: inv.payments.map((p) => ({
					id: String(p.id),
					amount: Number(p.amount),
					method: p.method,
					paidAt: p.paidAt.toISOString()
				})),
				createdBy: inv.createdBy
					? {
							id: String(inv.createdBy.id),
							firstName: inv.createdBy.firstName,
							lastName: inv.createdBy.lastName,
							email: inv.createdBy.email
					  }
					: null,
				createdAt: inv.createdAt.toISOString()
			}))
		);
	} catch (error) {
		console.error('Error fetching invoices:', error);
		return new Response('Failed to fetch invoices', { status: 500 });
	}
};

export const POST: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params, request, locals } = event;
	const user = locals.user!;
	const userId = user.id as unknown as bigint;

	// Only OWNER and REP can create invoices
	if (!hasRole(event, ['OWNER', 'REP'])) {
		return new Response('Forbidden', { status: 403 });
	}

	const jobId = BigInt(params.id);
	const { items, taxRate = 0, dueDate, notes, invoiceNumber } = await request.json();

	if (!items || !Array.isArray(items) || items.length === 0) {
		return new Response('Items are required', { status: 400 });
	}

	try {
		// Get job to get customer
		const job = await prisma.job.findUnique({
			where: { id: jobId },
			select: { customerId: true }
		});

		if (!job) {
			return new Response('Job not found', { status: 404 });
		}

		// Calculate totals
		const subtotal = items.reduce((sum: number, item: any) => {
			const quantity = Number(item.quantity) || 0;
			const unitPrice = Number(item.unitPrice) || 0;
			return sum + quantity * unitPrice;
		}, 0);

		const taxAmount = (subtotal * Number(taxRate || 0)) / 100;
		const totalAmount = subtotal + taxAmount;

		// Create invoice
		const invoice = await prisma.invoice.create({
			data: {
				customerId: job.customerId,
				jobId,
				createdById: userId,
				invoiceNumber: invoiceNumber || null,
				status: 'draft',
				subtotal,
				taxRate: Number(taxRate || 0),
				taxAmount,
				totalAmount,
				dueDate: dueDate ? new Date(dueDate) : null,
				notes: notes || null,
				items: {
					create: items.map((item: any) => ({
						name: item.name,
						description: item.description || null,
						quantity: Number(item.quantity) || 1,
						unitPrice: Number(item.unitPrice) || 0,
						total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
					}))
				}
			},
			include: {
				items: true,
				createdBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true
					}
				}
			}
		});

		return json({
			id: String(invoice.id),
			invoiceNumber: invoice.invoiceNumber,
			status: invoice.status,
			subtotal: Number(invoice.subtotal),
			taxRate: invoice.taxRate ? Number(invoice.taxRate) : 0,
			taxAmount: Number(invoice.taxAmount),
			totalAmount: Number(invoice.totalAmount),
			dueDate: invoice.dueDate?.toISOString() || null,
			notes: invoice.notes,
			items: invoice.items.map((item) => ({
				id: String(item.id),
				name: item.name,
				description: item.description,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				total: Number(item.total)
			})),
			payments: [],
			createdBy: invoice.createdBy
				? {
						id: String(invoice.createdBy.id),
						firstName: invoice.createdBy.firstName,
						lastName: invoice.createdBy.lastName,
						email: invoice.createdBy.email
				  }
				: null,
			createdAt: invoice.createdAt.toISOString()
		});
	} catch (error) {
		console.error('Error creating invoice:', error);
		return new Response('Failed to create invoice', { status: 500 });
	}
};

export const PUT: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params, request, locals } = event;
	const user = locals.user!;

	// Only OWNER and REP can update invoices
	if (!hasRole(event, ['OWNER', 'REP'])) {
		return new Response('Forbidden', { status: 403 });
	}

	const jobId = BigInt(params.id);
	const { invoiceId, status, items, taxRate, dueDate, notes } = await request.json();

	if (!invoiceId) {
		return new Response('Invoice ID is required', { status: 400 });
	}

	try {
		let updateData: any = {};

		if (status) updateData.status = status;
		if (dueDate) updateData.dueDate = new Date(dueDate);
		if (notes !== undefined) updateData.notes = notes;
		if (taxRate !== undefined) updateData.taxRate = Number(taxRate);

		// If items are provided, recalculate totals
		if (items && Array.isArray(items)) {
			// Delete existing items
			await prisma.invoiceItem.deleteMany({
				where: { invoiceId: BigInt(invoiceId) }
			});

			// Create new items
			const newItems = await prisma.invoiceItem.createMany({
				data: items.map((item: any) => ({
					invoiceId: BigInt(invoiceId),
					name: item.name,
					description: item.description || null,
					quantity: Number(item.quantity) || 1,
					unitPrice: Number(item.unitPrice) || 0,
					total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
				}))
			});

			// Recalculate totals
			const subtotal = items.reduce((sum: number, item: any) => {
				const quantity = Number(item.quantity) || 0;
				const unitPrice = Number(item.unitPrice) || 0;
				return sum + quantity * unitPrice;
			}, 0);

			const taxAmount = (subtotal * Number(updateData.taxRate || 0)) / 100;
			const totalAmount = subtotal + taxAmount;

			updateData.subtotal = subtotal;
			updateData.taxAmount = taxAmount;
			updateData.totalAmount = totalAmount;
		} else if (updateData.taxRate !== undefined) {
			// Recalculate tax if only tax rate changed
			const invoice = await prisma.invoice.findUnique({
				where: { id: BigInt(invoiceId) },
				select: { subtotal: true }
			});

			if (invoice) {
				const taxAmount = (Number(invoice.subtotal) * Number(updateData.taxRate)) / 100;
				updateData.taxAmount = taxAmount;
				updateData.totalAmount = Number(invoice.subtotal) + taxAmount;
			}
		}

		const updated = await prisma.invoice.update({
			where: { id: BigInt(invoiceId), jobId },
			data: updateData,
			include: {
				items: true,
				payments: true,
				createdBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true
					}
				}
			}
		});

		return json({
			id: String(updated.id),
			invoiceNumber: updated.invoiceNumber,
			status: updated.status,
			subtotal: Number(updated.subtotal),
			taxRate: updated.taxRate ? Number(updated.taxRate) : 0,
			taxAmount: Number(updated.taxAmount),
			totalAmount: Number(updated.totalAmount),
			dueDate: updated.dueDate?.toISOString() || null,
			notes: updated.notes,
			items: updated.items.map((item) => ({
				id: String(item.id),
				name: item.name,
				description: item.description,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				total: Number(item.total)
			})),
			payments: updated.payments.map((p) => ({
				id: String(p.id),
				amount: Number(p.amount),
				method: p.method,
				paidAt: p.paidAt.toISOString()
			})),
			createdBy: updated.createdBy
				? {
						id: String(updated.createdBy.id),
						firstName: updated.createdBy.firstName,
						lastName: updated.createdBy.lastName,
						email: updated.createdBy.email
				  }
				: null,
			createdAt: updated.createdAt.toISOString()
		});
	} catch (error) {
		console.error('Error updating invoice:', error);
		return new Response('Failed to update invoice', { status: 500 });
	}
};

