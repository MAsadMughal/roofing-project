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

		// Check if job already has an invoice (only one invoice per job allowed)
		const existingInvoice = await prisma.invoice.findFirst({
			where: { jobId },
			select: { id: true }
		});

		if (existingInvoice) {
			return new Response('Job already has an invoice. Only one invoice per job is allowed.', { status: 400 });
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

		// Create feed item for invoice creation
		await prisma.jobFeedItem.create({
			data: {
				jobId,
				type: 'invoice_created',
				content: `Invoice created${invoice.invoiceNumber ? ` (${invoice.invoiceNumber})` : ''} - Total: $${totalAmount.toFixed(2)}`,
				createdById: userId,
				taggedUserIds: [],
				metadata: { invoiceId: String(invoice.id), invoiceNumber: invoice.invoiceNumber, totalAmount: Number(totalAmount) }
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
	const { invoiceId, status, items, taxRate, dueDate, notes, invoiceNumber } = await request.json();

	if (!invoiceId) {
		return new Response('Invoice ID is required', { status: 400 });
	}

	try {
		// Check if invoice exists and get current status
		const existingInvoice = await prisma.invoice.findUnique({
			where: { id: BigInt(invoiceId), jobId },
			include: { payments: true }
		});

		if (!existingInvoice) {
			return new Response('Invoice not found', { status: 404 });
		}

		// Prevent editing if invoice is paid or void
		if (existingInvoice.status === 'paid' || existingInvoice.status === 'void') {
			return new Response('Cannot edit paid or void invoice. Only draft, sent, or overdue invoices can be edited.', { status: 400 });
		}

		let updateData: any = {};

		if (status) updateData.status = status;
		if (dueDate) updateData.dueDate = new Date(dueDate);
		if (notes !== undefined) updateData.notes = notes;
		if (taxRate !== undefined) updateData.taxRate = Number(taxRate);
		if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber;

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
				job: {
					select: { id: true, status: true }
				},
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

		// If invoice status is set to "paid", close the job
		if (status === 'paid' && updated.job && updated.job.status !== 'completed') {
			await prisma.job.update({
				where: { id: updated.job.id },
				data: { status: 'completed' }
			});
		}

		// Create feed item for invoice update
		const oldStatus = existingInvoice.status;
		const oldTotal = Number(existingInvoice.subtotal) + Number(existingInvoice.taxAmount);
		const newTotal = Number(updated.totalAmount);
		
		let feedContent = '';
		if (status && status !== oldStatus) {
			feedContent = `Invoice status changed from "${oldStatus}" to "${status}"`;
			if (status === 'paid') {
				feedContent += ' (Job automatically closed)';
			}
		} else if (items && Array.isArray(items)) {
			feedContent = `Invoice updated - Total changed from $${oldTotal.toFixed(2)} to $${newTotal.toFixed(2)}`;
		} else {
			feedContent = `Invoice updated${updated.invoiceNumber ? ` (${updated.invoiceNumber})` : ''}`;
		}

		await prisma.jobFeedItem.create({
			data: {
				jobId,
				type: 'invoice_updated',
				content: feedContent,
				createdById: user.id as unknown as bigint,
				taggedUserIds: [],
				metadata: { 
					invoiceId: String(updated.id), 
					invoiceNumber: updated.invoiceNumber,
					oldStatus,
					newStatus: updated.status,
					oldTotal,
					newTotal: Number(updated.totalAmount)
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

export const DELETE: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params, request, locals } = event;
	const user = locals.user!;

	// Only OWNER and REP can delete invoices
	if (!hasRole(event, ['OWNER', 'REP'])) {
		return new Response('Forbidden', { status: 403 });
	}

	const jobId = BigInt(params.id);
	const { invoiceId } = await request.json();

	if (!invoiceId) {
		return new Response('Invoice ID is required', { status: 400 });
	}

	try {
		// Check if invoice exists and get current status
		const invoice = await prisma.invoice.findUnique({
			where: { id: BigInt(invoiceId), jobId }
		});

		if (!invoice) {
			return new Response('Invoice not found', { status: 404 });
		}

		// Prevent deletion if invoice is paid or void
		if (invoice.status === 'paid' || invoice.status === 'void') {
			return new Response('Cannot delete paid or void invoice. Only draft, sent, or overdue invoices can be deleted.', { status: 400 });
		}

		// Store invoice info for feed item
		const invoiceNumber = invoice.invoiceNumber;
		const totalAmount = Number(invoice.totalAmount);

		// Delete invoice (items will be cascade deleted)
		await prisma.invoice.delete({
			where: { id: BigInt(invoiceId), jobId }
		});

		// Create feed item for invoice deletion
		await prisma.jobFeedItem.create({
			data: {
				jobId,
				type: 'invoice_deleted',
				content: `Invoice deleted${invoiceNumber ? ` (${invoiceNumber})` : ''} - Total: $${totalAmount.toFixed(2)}`,
				createdById: user.id as unknown as bigint,
				taggedUserIds: [],
				metadata: { invoiceId: String(invoiceId), invoiceNumber, totalAmount }
			}
		});

		return new Response(null, { status: 204 });
	} catch (error) {
		console.error('Error deleting invoice:', error);
		return new Response('Failed to delete invoice', { status: 500 });
	}
};

